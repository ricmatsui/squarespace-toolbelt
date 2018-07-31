'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.chooseSite = exports.createSite = exports.loginOrSignup = exports.lastName = exports.firstName = exports.password = exports.email = undefined;

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var email = exports.email = {
  type: 'input',
  name: 'email',
  message: 'What\'s your email address?'
}; /**
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
 * A collection of prompts to be used with inquirer.
 */

var password = exports.password = {
  type: 'password',
  name: 'password',
  message: 'Password'
};

var firstName = exports.firstName = {
  type: 'input',
  name: 'firstName',
  message: 'First Name',
  validate: function validate(val) {
    if (!_validator2.default.isEmpty(val)) return true;
    return 'Please enter your first name';
  }
};

var lastName = exports.lastName = {
  type: 'input',
  name: 'lastName',
  message: 'Last Name',
  validate: function validate(val) {
    if (!_validator2.default.isEmpty(val)) return true;
    return 'Please enter your last name';
  }
};

var loginOrSignup = exports.loginOrSignup = {
  type: 'list',
  name: 'loginOrSignup',
  message: 'Would you like to log in or create a new account?',
  choices: ['Log in', 'Create Account']
};

var createSite = exports.createSite = {
  type: 'list',
  name: 'createSite',
  choices: ['Use an existing website', 'Create a new website'],
  default: 0,
  message: 'Would you like to create a new site or start with an existing one?'
};

var chooseSite = exports.chooseSite = {
  type: 'list',
  name: 'siteUrl',
  message: 'Which website would you like to use?'
};