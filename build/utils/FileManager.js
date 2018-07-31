'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @license
 * Copyright 2016 Squarespace, INC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Low level file utilities for locating, collating,
 * copying and editing template source and modules
 */
var fs = require('fs-extra');
var del = require('del');
var path = require('path');
var colors = require('colors');
var glob = require('glob');

var _require = require('lodash/object'),
    get = _require.get,
    values = _require.values;

var patterns = require('./patterns');

var _require2 = require('./confutils'),
    merge = _require2.merge;

/**
 * Finds a template module in a directory by package name
 *
 * @param {string} srcDir - directory to search from
 * @param {string} dep - dependency (npm) name
 * @return {Object}  - { modPath, templateDir, conf }
 */


var findModule = function findModule(startDir, dep) {
  var modPath = path.join(startDir, 'node_modules', dep);
  var mod = {
    path: modPath
  };

  try {
    var packagePath = path.join(modPath, 'package.json');
    var packageJson = fs.readJsonSync(packagePath);
    if (packageJson && get(packageJson, 'directories.squarespace')) {
      mod.templateDir = packageJson.directories.squarespace;
    } else {
      mod.templateDir = '';
    }
    var confPath = path.join(modPath, mod.templateDir, 'template.conf');
    mod.hasConf = !!fs.lstatSync(confPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(err.message);
      return null;
    }

    var numberOfLevels = modPath.match(/node_modules/gi).length;
    if (numberOfLevels > 1) {
      // Couldn't find dependency at this level that satisfied requirements,
      // so go one level up by finding the second to last occurrence of
      // "node_modules" in the path and try again.
      var pathArr = modPath.split(path.sep);
      var nodeModulesOccurrences = 0;
      for (var i = pathArr.length - 1; i >= 0; i--) {
        if (pathArr[i] === 'node_modules') {
          nodeModulesOccurrences++;
        }
        if (nodeModulesOccurrences > 1) {
          pathArr = pathArr.slice(0, i);
          break;
        }
      }
      var newPath = pathArr.join(path.sep);
      mod = findModule(newPath, dep);
    }
  }

  return mod;
};

var FileManager = function () {

  /**
   * @param {String} config.srcDir - dir containing template's source code
   * @param {String} config.buildDir - dir to build into
   */
  function FileManager(config) {
    _classCallCheck(this, FileManager);

    this.srcDir = config.srcDir;
    this.buildDir = config.buildDir;
    this.packageJson = this.getPackageJson(config.packageJsonDir);
  }

  /**
   * Gets files from given directory that match given patterns, and executes
   * a callback for each file.
   *
   * @param {Function} cb - callback to execute
   * @param {Object} flags - map of flags
   */


  _createClass(FileManager, [{
    key: 'getFiles',
    value: function getFiles(cb, flags) {
      var _this = this;

      var modules = this.getModules();
      var files = {};
      var filePatterns = patterns.getPatterns(flags);
      filePatterns.forEach(function (pattern) {
        var filePaths = glob.sync(_this.srcDir + pattern);
        filePaths.forEach(function (filePath) {
          files[filePath] = {
            filePath: filePath,
            relPath: _this.getRelativePath(filePath)
          };
        });
        values(modules).forEach(function (module) {
          var modulePaths = glob.sync(module.filePath + pattern);
          modulePaths.forEach(function (filePath) {
            files[filePath] = {
              filePath: filePath,
              relPath: _this.getRelativePath(filePath, module.filePath),
              moduleName: module.name
            };
          });
        });
      });
      this.files = files;
      values(files).forEach(function (file) {
        cb.call(_this, file, flags);
      });
      return files;
    }

    /**
     * Get package.json as a required object
     *
     * @param {string} packageJsonDir - template source directory
     * @return {object} - package.json, as an object
     */

  }, {
    key: 'getPackageJson',
    value: function getPackageJson(packageJsonDir) {
      try {
        var packageJsonPath = path.join(packageJsonDir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          return require(packageJsonPath);
        }
        return null;
      } catch (err) {
        console.error('Error: Unable to find package.json in ' + packageJsonDir);
        process.exit(1);
      }
    }

    /**
     * Recursively finds template modules and executes a callback
     *
     * @param {string} srcDir - directory to search from
     * @param {Function} callback - callback to execute
     */

  }, {
    key: 'eachModule',
    value: function eachModule(srcDir, callback) {
      var _this2 = this;

      var packageJson = this.getPackageJson(srcDir);
      var dependencies = packageJson && packageJson.dependencies ? packageJson.dependencies : {};
      Object.keys(dependencies).forEach(function (moduleName) {
        var mod = findModule(srcDir, moduleName);
        if (mod && mod.hasConf) {
          var modTemplateDir = path.join(mod.path, mod.templateDir);
          callback(modTemplateDir, moduleName);
          _this2.eachModule(mod.path, callback);
        }
      });
    }

    /**
     * Gets source information on all template module dependencies
     *
     * @param {string} srcDir - template source directory
     * @return {Array} - data objects for included template modules
     */

  }, {
    key: 'getModules',
    value: function getModules() {
      var modules = {};
      this.eachModule(this.srcDir, function (modulePath, moduleName) {
        modules[moduleName] = {
          name: moduleName,
          filePath: modulePath
        };
      });
      return modules;
    }

    /**
     * Get the relative path given an absolute path. If a dir is provided, that
     * dir is used as the root for that file; otherwise, the srcDir is used.
     *
     * @param  {string} path - absolute path
     * @param  {string} dir - dir of file
     * @return {string} - relative path
     */

  }, {
    key: 'getRelativePath',
    value: function getRelativePath(filePath, dir) {
      if (dir) {
        return path.relative(dir, filePath);
      }
      return path.relative(this.srcDir, filePath);
    }

    /**
     * Syncs all template files for this given FileManager
     *
     * @public
     * @param {Object} flags - map of flags to sync with
     */

  }, {
    key: 'syncAllFiles',
    value: function syncAllFiles(flags) {
      this.getFiles(this.syncFile, flags);
    }

    /**
     * Copies a single file to the build directory
     *
     * @param {string} file - if a string is provided, look at this.files map for the file object
     * @param {object} file - file can also be object with props listed below
     * @param {string} file.filePath - absolute path of file
     * @param {string} file.relPath - relative path of file
     * @param {string} file.moduleName - if file is module, name of the module
     * @param {object}  flags - a map of CLI options
     */

  }, {
    key: 'syncFile',
    value: function syncFile(file, flags) {
      if (typeof file === 'string') {
        file = this.files[file];
        if (!file) {
          return;
        }
      }
      var _file = file,
          filePath = _file.filePath,
          relPath = _file.relPath,
          moduleName = _file.moduleName;

      var isModConf = filePath.indexOf('conf') >= 0 && moduleName;
      var destPath = path.join(this.buildDir, relPath);
      var srcFileExists = fs.existsSync(filePath);
      var destFileExists = fs.existsSync(destPath);

      if (isModConf && destFileExists) {
        this.updateConf(filePath, moduleName, flags);
        return true;
      }
      if (!srcFileExists || !fs.lstatSync(filePath).isFile()) {
        return false;
      }
      var originPath = path.relative(this.srcDir, filePath);
      var destPathRelative = path.relative(this.srcDir, destPath);
      var fileParts = path.parse(originPath);

      // ensure .region files arrive in the base dest directory, not nested
      if (fileParts.ext === '.region') {
        destPath = path.join(this.buildDir, fileParts.base);
      }
      console.log(colors.cyan.bold('Copying ' + originPath + ' to ' + destPathRelative));
      fs.copySync(filePath, destPath, { dereference: true });
      return true;
    }

    /**
     * Copies source .conf file to build directory and recursively updates it
     * with values from template modules.
     *
     * @param {string} filePath - path of file to update
     */

  }, {
    key: 'updateAllModuleConfs',
    value: function updateAllModuleConfs(filePath) {
      var _this3 = this;

      var relPath = this.files[filePath].relPath;

      var buildFilePath = path.join(this.buildDir, relPath);
      del.sync(buildFilePath);
      values(this.files).forEach(function (file) {
        if (file.relPath === relPath) {
          _this3.syncFile(file);
        }
      });
    }

    /**
     * Removes all files from build directory.
     */

  }, {
    key: 'deleteBuild',
    value: function deleteBuild() {
      FileManager.delete(this.buildDir);
    }

    /**
     * Given a conf base (filename + ext) and a directory, figure out what kind of
     * conf it is and return the proper path string.
     *
     * @param  {String} confBase - filename + ext of conf
     * @param  {String} [dir] - dir to use
     * @return {String} - joined path
     */

  }, {
    key: 'getConfPath',
    value: function getConfPath(confBase) {
      var dir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      if (confBase === 'template.conf') {
        return path.join(dir, confBase);
      }

      return path.join(dir, 'collections', confBase);
    }

    /**
     * Updates {buildDir}/template.conf with new values
     *
     * @param {string} confPath - path of conf file to merge into build
     * @param {string} [moduleName] - name of module (used for logs)
     * @param {object} [flags] - a map of CLI options
     */

  }, {
    key: 'updateConf',
    value: function updateConf(confPath) {
      var moduleName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var flags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var buildConf = void 0;
      var conf = fs.readJsonSync(confPath);
      var confBase = path.parse(confPath).base;
      var buildConfPath = this.getConfPath(confBase, this.buildDir);
      var confDisplayName = confBase === 'template.conf' ? confBase : path.join('collections', confBase);

      // do not copy stylesheets in template.conf, if styles is omitted
      if (flags.omit && flags.omit.includes('styles') && "stylesheets" in conf) {
        console.log(colors.blue.bold('Dropping stylesheets from ' + confDisplayName + ' of ' + moduleName + ' because of --omit flag'));
        delete conf.stylesheets;
      }

      try {
        buildConf = fs.readJsonSync(buildConfPath);
      } catch (err) {
        console.error('Oh no, there was an error: ' + err.message);
      }

      if (!buildConf) {
        console.log('Oh no, couldn\'t find ' + confDisplayName + ' in build');
        return;
      }

      console.log(colors.blue.bold('Merging ' + confDisplayName + ' from ' + moduleName));
      buildConf = merge(buildConf, conf);

      try {
        fs.writeJsonSync(buildConfPath, buildConf);
      } catch (err) {
        console.error('Oh no, there was an error: ' + err.message);
      }
    }

    /**
     * Given some dir, deletes everything in that dir except for the dir itself
     * and the git directory. Typically used to clean the build dir.
     *
     * @param  {String} dir - path of dir
     */

  }], [{
    key: 'delete',
    value: function _delete(dir) {
      del.sync([dir + '/**', '!' + dir, '!' + dir + '/.git*']);
    }
  }]);

  return FileManager;
}();

module.exports = FileManager;