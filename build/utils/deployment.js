'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
 * Utilities for deploying a squarespace template. Uses git under the hood.
 */

var git = require('git-cli');
var path = require('path');
var fs = require('fs-extra');
var URL = require('url-parse');

/**
 * Utility to resolve git async action, throwing error if needed.
 */
function finishWithGitResult(repo, resolve, reject, failMsg) {
  return function (err) {
    if (err) {
      reject(failMsg ? new Error(failMsg) : err);
    } else {
      resolve(repo);
    }
  };
}

/**
 * Validates and converts a repo URL into a suitable name for a git remote.
 * @param {string} url - The git repo URL
 * @return {string} the git remote name
 */
function gitUrlToOriginName(url) {
  var parsed = new URL(url);
  var badProto = parsed.protocol !== 'https:';
  var badPath = parsed.pathname !== '/template.git';
  var badPort = parsed.port !== '';
  if (badProto || badPath || badPort) {
    throw new Error('Invalid Squarespace git URL: ' + url + '.');
  }
  return parsed.hostname;
}

/**
 * Utilities for deploying templates using git.
 */
var Deployment = {

  /**
   * Attempts to open a git repo at the given path.
   * @param {string} repoPath - the folder containing the .git folder.
   * @return {Promise} a promise to return a git repo.
   */
  openRepo: function openRepo(repoPath) {
    var fullpath = path.resolve(repoPath, '.git');
    return Promise.resolve().then(function () {
      console.log('Opening repository...');
      try {
        var stat = fs.statSync(fullpath);
        if (!stat.isDirectory()) {
          throw '';
        }
      } catch (e) {
        throw new Error('No .git repository found');
      }
      return new git.Repository(fullpath);
    });
  },


  /**
   * Clones a repo if it exists.
   * @param {string} repoPath - the folder containing a .git folder.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {Promise} a promise to return a git repo.
   */
  cloneRepo: function cloneRepo(repoPath, repoUrl) {
    console.log('Trying to clone...');
    return new Promise(function (resolve, reject) {
      try {
        git.Repository.clone(repoUrl, repoPath, function (err, repo) {
          if (err) {
            var errmsg = 'Couldn\'t clone. Please ensure that the URL ' + 'points to a valid Squarespace GIT repository.';
            reject(new Error(errmsg));
          } else {
            resolve(repo);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },


  /**
   * Initializes a repository from scratch.
   * @param {string} repoPath - the folder containing a .git folder.
   * @return {Promise} a promise to return a git repo.
   */
  initRepo: function initRepo(repoPath) {
    console.log('Trying to create new repo...');
    return new Promise(function (resolve, reject) {
      try {
        git.Repository.init(repoPath, function (err, repo) {
          if (err) {
            reject(new Error('Couldn\'t create new git repository.'));
          } else {
            resolve(repo);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },


  /**
   * Adds a remote.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {Promise} a promise to return a git repo.
   */
  addRemote: function addRemote(repo, repoUrl) {
    console.log('Adding remote...');
    return new Promise(function (resolve, reject) {
      try {
        var remote = gitUrlToOriginName(repoUrl);
        repo.addRemote(remote, repoUrl, function (err) {
          if (err) {
            reject(new Error('Couldn\'t set remote of new repo.'));
          } else {
            resolve(repo);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },


  /**
   * Checks to see if repo has a remote for the given URL.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {Promise} a promised boolean value.
   */
  hasRemote: function hasRemote(repo, repoUrl) {
    return new Promise(function (resolve, reject) {
      try {
        var remote = gitUrlToOriginName(repoUrl);
        repo.listRemotes(function (err, remotes) {
          if (remotes.includes(remote)) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },


  /**
   * Adds all changes in repo's working dir to build.
   * @param {object} repo - a git repo.
   * @return {Promise} a promise to return a git repo.
   */
  addBuild: function addBuild(repo) {
    console.log('Adding build...');
    return new Promise(function (resolve, reject) {
      repo.add(['.'], { 'all': '' }, finishWithGitResult(repo, resolve, reject));
    });
  },


  /**
   * Creates a commit for this build.
   * @param {object} repo - a git repo.
   * @param {string} message - a commit message describing this build.
   * @return {Promise} a promise to return a git repo.
   */
  makeBuildCommit: function makeBuildCommit(repo, message) {
    console.log('Committing build...');
    return new Promise(function (resolve, reject) {
      repo.commit(message, function (err) {
        resolve(repo);
      });
    });
  },


  /**
   * Pulls from the remote specified by the repo's URL.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {Promise} a promise to return a git repo.
   */
  pullRemote: function pullRemote(repo, repoUrl) {
    console.log('Pulling from remote...');
    var remote = gitUrlToOriginName(repoUrl);
    return new Promise(function (resolve, reject) {
      repo.pull([remote, 'master'], { 'strategy': 'ours' }, finishWithGitResult(repo, resolve, reject));
    });
  },


  /**
   * Pushes the current build to the remote specified by the repo's URL.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {Promise} a promise to return a git repo.
   */
  pushBuild: function pushBuild(repo, repoUrl) {
    console.log('Pushing build...');
    var remote = gitUrlToOriginName(repoUrl);
    return new Promise(function (resolve, reject) {
      repo.push([remote, 'master'], finishWithGitResult(repo, resolve, reject));
    });
  },


  /**
   * Opens or creates a repo, using least creative strategy.
   * @param {string} folder - path to a folder containing the .git folder.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {async object} a git repo.
   */
  ensureRepo: function ensureRepo(folder, repoUrl) {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var repo;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              repo = void 0;
              _context.prev = 1;
              _context.next = 4;
              return Deployment.openRepo(folder);

            case 4:
              repo = _context.sent;
              _context.next = 29;
              break;

            case 7:
              _context.prev = 7;
              _context.t0 = _context['catch'](1);

              console.log('Failed to open repo.', _context.t0.message);
              _context.prev = 10;
              _context.next = 13;
              return Deployment.cloneRepo(folder, repoUrl);

            case 13:
              repo = _context.sent;
              _context.next = 29;
              break;

            case 16:
              _context.prev = 16;
              _context.t1 = _context['catch'](10);

              console.log('Failed to clone repo.');
              _context.prev = 19;
              _context.next = 22;
              return Deployment.initRepo(folder);

            case 22:
              repo = _context.sent;
              _context.next = 29;
              break;

            case 25:
              _context.prev = 25;
              _context.t2 = _context['catch'](19);

              console.log('Failed to initialize repo.', _context.t2.message);
              return _context.abrupt('return', null);

            case 29:
              return _context.abrupt('return', repo);

            case 30:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this, [[1, 7], [10, 16], [19, 25]]);
    }))();
  },


  /**
   * Checks for the remote, creates if missing.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @return {async object} a git repo.
   */
  ensureRemote: function ensureRemote(repo, repoUrl) {
    var _this2 = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return Deployment.hasRemote(repo, repoUrl);

            case 3:
              if (_context2.sent) {
                _context2.next = 6;
                break;
              }

              _context2.next = 6;
              return Deployment.addRemote(repo, repoUrl);

            case 6:
              _context2.next = 12;
              break;

            case 8:
              _context2.prev = 8;
              _context2.t0 = _context2['catch'](0);

              console.log('Failed to add remote.', _context2.t0);
              return _context2.abrupt('return', null);

            case 12:
              return _context2.abrupt('return', repo);

            case 13:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2, [[0, 8]]);
    }))();
  },


  /**
   * Creates a build commit and pushes it to the repo.
   * @param {object} repo - a git repo.
   * @param {string} repoUrl - the git URL for the repo.
   * @param {string} buildMessage- a commit message for the build.
   * @return {async object} a git repo.
   */
  commitBuild: function commitBuild(repo, repoUrl, buildMessage) {
    var _this3 = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              _context3.next = 3;
              return Deployment.addBuild(repo);

            case 3:
              _context3.next = 5;
              return Deployment.makeBuildCommit(repo, buildMessage);

            case 5:
              _context3.next = 7;
              return Deployment.pullRemote(repo, repoUrl);

            case 7:
              _context3.next = 9;
              return Deployment.pushBuild(repo, repoUrl);

            case 9:
              _context3.next = 16;
              break;

            case 11:
              _context3.prev = 11;
              _context3.t0 = _context3['catch'](0);

              console.error('Failed to deploy build. ' + 'Please ensure that your site is in dev mode.');
              console.error(_context3.t0.message);
              return _context3.abrupt('return', null);

            case 16:
              return _context3.abrupt('return', repo);

            case 17:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this3, [[0, 11]]);
    }))();
  },


  /**
   * Deploys a template using git.
   * @param {string} folder - path to a folder containing the .git folder.
   * @param {string} url - the git URL for the repo.
   * @param {string} buildMessage - a commit message for the build.
   * @param {boolean} ensureRemote - create remote if not already there.
   */
  deploy: function deploy(folder, url, buildMessage, ensureRemote) {
    var _this4 = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
      var noCredsUrl, repo;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              noCredsUrl = url.replace(/(\/\/).*?:.*?@/, '$1');

              console.log('Deploying files in ' + folder + ' to ' + noCredsUrl + '...');
              _context4.next = 4;
              return Deployment.ensureRepo(folder, url);

            case 4:
              repo = _context4.sent;

              if (repo) {
                _context4.next = 7;
                break;
              }

              throw new Error('No repo!');

            case 7:
              if (!ensureRemote) {
                _context4.next = 13;
                break;
              }

              _context4.next = 10;
              return Deployment.ensureRemote(repo, url);

            case 10:
              repo = _context4.sent;

              if (repo) {
                _context4.next = 13;
                break;
              }

              throw new Error('No repo!');

            case 13:
              _context4.next = 15;
              return Deployment.commitBuild(repo, url, buildMessage);

            case 15:
              repo = _context4.sent;

              if (repo) {
                _context4.next = 18;
                break;
              }

              throw new Error('No repo!');

            case 18:
              console.log('Success!');

            case 19:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this4);
    }))();
  }
};

module.exports = Deployment;