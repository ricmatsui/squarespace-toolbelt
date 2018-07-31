'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProcessChain = exports.Keys = exports.BASE_TEMPLATE = exports.USER_AGENT = exports.NPMRC_FILE = exports.GLOBAL_SETTINGS_PATH = exports.GLOBAL_SETTINGS_FILE = exports.SIGNUP_JOB_PENDING = exports.SIGNUP_JOB_COMPLETE = exports.SIGNUP_POLL = exports.SIGNUP_KEY_URL = exports.SIGNUP_URL = exports.WEBSITES_URL = exports.LOGIN_URL = exports.OAUTH_DOMAIN = exports.SQUARESPACE_DOMAIN = undefined;

var _homedir = require('homedir');

var _homedir2 = _interopRequireDefault(_homedir);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license
 * Copyright 2017 Squarespace, INC.
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
 * Top level constants used throughout squarespace toolbelt.
 */

var SQUARESPACE_DOMAIN = exports.SQUARESPACE_DOMAIN = 'squarespace.com';
var OAUTH_DOMAIN = exports.OAUTH_DOMAIN = 'https://oauth.' + SQUARESPACE_DOMAIN;
var LOGIN_URL = exports.LOGIN_URL = 'https://www.' + SQUARESPACE_DOMAIN + '/api/auth/Login';
var WEBSITES_URL = exports.WEBSITES_URL = OAUTH_DOMAIN + '/api/account/GetManagedWebsites';
var SIGNUP_URL = exports.SIGNUP_URL = OAUTH_DOMAIN + '/api/auth/QueueSignup';
var SIGNUP_KEY_URL = exports.SIGNUP_KEY_URL = OAUTH_DOMAIN + '/api/auth/SignupKey';
var SIGNUP_POLL = exports.SIGNUP_POLL = OAUTH_DOMAIN + '/api/jobs/signup';
var SIGNUP_JOB_COMPLETE = exports.SIGNUP_JOB_COMPLETE = 3;
var SIGNUP_JOB_PENDING = exports.SIGNUP_JOB_PENDING = [1, 2, 6];

var GLOBAL_SETTINGS_FILE = exports.GLOBAL_SETTINGS_FILE = '.squarespace';
var GLOBAL_SETTINGS_PATH = exports.GLOBAL_SETTINGS_PATH = _path2.default.resolve((0, _homedir2.default)() || '', GLOBAL_SETTINGS_FILE);
var NPMRC_FILE = exports.NPMRC_FILE = '.npmrc';

var USER_AGENT = exports.USER_AGENT = 'Squarespace Toolbelt (Squarespace)';
var BASE_TEMPLATE = exports.BASE_TEMPLATE = 'base-template';

var Keys = exports.Keys = {
  SITE_URL: 'sqs_site_url',
  AUTH_TOKEN: 'authToken'
};

var ProcessChain = exports.ProcessChain = {
  CONTINUE: 0,
  HALT: 1
};