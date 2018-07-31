'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setup = setup;
exports.getSiteUrl = getSiteUrl;

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _npmrcio = require('./npmrcio');

var _npmrcio2 = _interopRequireDefault(_npmrcio);

var _siteManager = require('./siteManager');

var SiteManager = _interopRequireWildcard(_siteManager);

var _constants = require('./constants');

var Constants = _interopRequireWildcard(_constants);

var _questions = require('./questions');

var Questions = _interopRequireWildcard(_questions);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// HELPERS -----------------------------------------------------------------------

/* if prompt is aborted via sigint, exit with nonzero code */
function prompt() {
  var result = _inquirer2.default.prompt.apply(_inquirer2.default.prompt, arguments);
  result.ui.rl.on('SIGINT', function () {
    process.exit(1);
  });
  return result;
}

/* Get's templateId of clonee website from package.json */
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
 * Utilities for configuring the toolbelt and retrieving configuration.
 */

/* eslint-disable no-process-exit */

function getCloneId(folder) {
  var cloneFromId = Constants.BASE_TEMPLATE;
  try {
    var pjson = require(_path2.default.join(folder, 'package.json'));
    cloneFromId = pjson.squarespace.templateId;
  } catch (e) {
    console.warn("Warn: `squarespace.templateId` not present in package.json.", "Using `base-template` to clone the new site.");
  }
  return cloneFromId;
}

// EXPORTS -----------------------------------------------------------------------

/**
 * Prompts the user for configuration options. Right now it's just site_url.
 * @param {string} folder - the project's root folder as relative path.
 */
function setup(folder) {

  var npmrcPath = _path2.default.join(folder, Constants.NPMRC_FILE);
  var npmrc = _npmrcio2.default.readNpmrcSync(npmrcPath);

  if (npmrc && npmrc[Constants.Keys.SITE_URL]) {
    console.log('Using site url: ' + npmrc[Constants.Keys.SITE_URL] + '\n' + ('To change this please edit the .npmrc file in "' + folder + '"'));
    process.exit(0);
  }

  // Setup required

  npmrc = npmrc || {};

  prompt([Questions.createSite]).then(function (answers) {
    if (answers.createSite === Questions.createSite.choices[1]) {
      // Create a new site
      return SiteManager.createSite(getCloneId(folder)).then(function (websiteId) {
        var siteUrl = 'https://' + websiteId + '.' + Constants.SQUARESPACE_DOMAIN;
        console.log('Success, your new site is ready at', siteUrl);
        return { siteUrl: siteUrl };
      });
    } else {
      // Use existing site
      return SiteManager.login().then(SiteManager.getWebsites).then(function (sites) {
        var question = Object.assign(Questions.chooseSite, { choices: sites });
        return prompt([question]);
      });
    }
  }).then(function (answers) {
    if (!answers.siteUrl) {
      process.exit(1);
    }
    npmrc[Constants.Keys.SITE_URL] = answers.siteUrl;
    _mkdirp2.default.sync(folder);
    _npmrcio2.default.writeNpmrcSync(npmrc, npmrcPath);
  }).catch(function (error) {
    console.error("ERROR:", error);
    process.exit(1);
  });
}

/**
 * Retrieves configuration options. Right now it's just site_url.
 * @param {string} folder - the project's root folder as relative path.
 */
function getSiteUrl(folder) {
  var npmrcPath = _path2.default.join(folder, Constants.NPMRC_FILE);
  var npmrc = _npmrcio2.default.readNpmrcSync(npmrcPath);
  return npmrc && npmrc[Constants.Keys.SITE_URL];
}