'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); /**
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
 * Handles site management, including creating sites, logging in and listing
 * sites already created.
 */

exports.getWebsites = getWebsites;
exports.login = login;
exports.createSite = createSite;

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _constants = require('./constants');

var Constants = _interopRequireWildcard(_constants);

var _questions = require('./questions');

var Questions = _interopRequireWildcard(_questions);

var _cookies = require('./cookies');

var Cookies = _interopRequireWildcard(_cookies);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// HELPERS ---------------------------------------------------------------------------

/* if prompt is aborted via sigint, exit with nonzero code */
function prompt() {
  var result = _inquirer2.default.prompt.apply(_inquirer2.default.prompt, arguments);
  result.ui.rl.on('SIGINT', function () {
    process.exit(1);
  });
  return result;
}

/* persist settings in global .squarespace file */
function storeSettings(settings) {
  try {
    var output = JSON.stringify(settings, null, 2);
    _fs2.default.writeFileSync(Constants.GLOBAL_SETTINGS_PATH, output, { mode: 384 });
  } catch (e) {
    console.warn("Couldn't write settings file at", Constants.GLOBAL_SETTINGS_PATH, e);
  }
}

/* read settings from global .squarespace file */
function readSettings() {
  var content = '';
  try {
    content = _fs2.default.readFileSync(Constants.GLOBAL_SETTINGS_PATH, { encoding: 'utf8' });
  } catch (e) {
    if (e.code === 'ENOENT') {
      return;
    }
    throw e;
  }
  try {
    return JSON.parse(content);
  } catch (e) {
    console.warn("Couldn't read settings file at", Constants.GLOBAL_SETTINGS_PATH, e);
  }
}

/* generic function to initiate an http request, and return a promise */
function requestJson(method, url) {
  var form = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  function doRequest() {
    return (0, _requestPromise2.default)({
      method: method,
      uri: url + ('?crumb=' + Cookies.getCrumb()),
      headers: Object.assign({
        'User-Agent': Constants.USER_AGENT,
        'cookie': Cookies.serialize()
      }, headers),
      resolveWithFullResponse: true,
      json: true,
      form: form
    }).then(function (res) {
      Cookies.setCookies(res);
      return res;
    });
  }

  return doRequest().then(function (res) {
    // If the crumb is outdated, try again
    if (res.body.error && res.body.crumb) {
      Cookies.setCookie('crumb', res.body.crumb);
      return doRequest();
    }
    return res;
  });
}

/* returns a promise that waits some time before passing a value to the
 * next promise in chain */
function delay(timeout, value) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve(value);
    }, timeout);
  });
}

// EXPORTS ---------------------------------------------------------------------------

/**
 * Returns a list of websites for the currently logged in user.
 *
 * @return {promise} A promise that resolves to an array of website URLs.
 */
function getWebsites() {
  return requestJson('GET', Constants.WEBSITES_URL).then(function (res) {
    return res.body.websites.map(function (site) {
      return site.baseUrl;
    });
  });
}

/**
 * Prompts the user to login using the command line.
 *
 * @return {promise} A promise that resolves to true if login succeeded, otherwise
 * the promise will throw an error.
 */
function login() {
  var acctData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;


  var settings = readSettings() || {};
  var authToken = settings[Constants.Keys.AUTH_TOKEN];
  var checkAuthToken = getWebsites;

  function sendLoginRequest(params) {
    return requestJson('POST', Constants.LOGIN_URL, {
      email: params.email,
      password: params.password,
      isClient: true,
      remember: true,
      includeWebsiteList: true
    }, {
      'Content-Type': 'application/x-www-form-urlencoded'
    });
  }

  function handleLoginResponse(res) {
    // cache auth token on this computer for later
    settings[Constants.Keys.AUTH_TOKEN] = res.body.secureauthtoken;
    storeSettings(settings);
    return true;
  }

  function handleLoginError(e) {
    if (e.statusCode === 401) {
      throw "Bad username or password";
    } else {
      throw "Unexpected Error:", e;
    }
  }

  if (acctData) {
    return sendLoginRequest(acctData).then(handleLoginResponse).catch(handleLoginError);
  } else if (authToken) {
    Cookies.setCookie('secureauthtoken', authToken);
    return checkAuthToken().catch(function (e) {
      if (e.statusCode === 401) {
        return prompt([Questions.email, Questions.password]).then(sendLoginRequest).then(handleLoginResponse).catch(handleLoginError);
      } else {
        throw "Unexpected error:", e;
      }
    });
  } else {
    return prompt([Questions.email, Questions.password]).then(sendLoginRequest).then(handleLoginResponse).catch(handleLoginError);
  }
}

/**
 * Creates a new website. First prompts the user to login or signup for
 * Squarespace.
 *
 * @param {string} cloneFromId - the website identifier of the parent template
 * from which the new template will be cloned.
 * @return {promise} an Promise that resolves to a string containing the new
 * website identifier.
 */
function createSite(cloneFromId) {

  function handleFormErrors(body) {
    var errorMsg = '';
    if (body.errors) {
      Object.keys(body.errors).forEach(function (key) {
        var passOrEmail = key === 'password' || key === 'email';
        var passwordOk = body.errors[key].indexOf('between 6 and 40 characters') === -1;
        if (passOrEmail && passwordOk) {
          errorMsg += 'Invalid email or password.\n';
        } else {
          errorMsg += body.errors[key] + '\n';
        }
      });
    } else if (body.error) {
      errorMsg += body.error + '\n';
    }
    if (errorMsg !== '') {
      throw errorMsg;
    }
  }

  function finalize(_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        loginResult = _ref2[0],
        pollResult = _ref2[1];

    if (!loginResult) {
      console.error("Failed to login after creating site. Please try logging in again.");
      process.exit(1);
    }
    return Promise.resolve(pollResult);
  }

  function pollSignup(jobId) {
    return requestJson('GET', Constants.SIGNUP_POLL + '/' + jobId).then(function (res) {
      var job = res.body;
      if (job === null || Constants.SIGNUP_JOB_PENDING.indexOf(job.status) >= 0) {
        return delay(1000, jobId).then(pollSignup);
      } else if (job.status === Constants.SIGNUP_JOB_COMPLETE) {
        return job.data.createdWebsiteIdentifier;
      } else {
        throw 'Error while creating new site. Please try again.';
      }
    });
  }

  function doCreateSite(acctData) {
    var payload = Object.assign({
      cloneIdentifier: cloneFromId,
      page: 'preview',
      developer: true
    }, acctData);

    return requestJson('POST', '' + Constants.SIGNUP_URL, payload).then(function (res) {
      handleFormErrors(res.body);
      return [acctData, res.body.id];
    });
  }

  function getSignupKey(acctData) {
    return requestJson('POST', Constants.SIGNUP_KEY_URL).then(function (data) {
      return Object.assign(acctData, { SK1: data.body.key });
    });
  }

  function loginOrSignup() {
    return prompt([Questions.loginOrSignup]).then(function (answers) {
      var newSignup = answers.loginOrSignup === Questions.loginOrSignup.choices[1];
      var prompts = [Questions.email, Questions.password];

      if (newSignup) {
        prompts = [Questions.firstName, Questions.lastName].concat(prompts);
      }

      return prompt(prompts).then(function (answers) {
        console.log("Creating your new Squarespace website...");
        return Object.assign(answers, { isNewAccount: newSignup });
      });
    });
  }

  return loginOrSignup().then(getSignupKey).then(doCreateSite).then(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        acctData = _ref4[0],
        jobId = _ref4[1];

    return Promise.all([login(acctData), pollSignup(jobId)]);
  }).then(finalize);
}