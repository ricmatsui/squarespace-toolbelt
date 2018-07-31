'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setCookies = setCookies;
exports.setCookie = setCookie;
exports.serialize = serialize;
exports.getCrumb = getCrumb;

var _toughCookie = require('tough-cookie');

var sessionCookies = {};

/**
 * Sets cookies on a global cookiejar using the set-cookie headers
 * from an http response.
 *
 * @param {object} res - a response object created by the `request` lib.
 * @return {Object} - an array of toughcookie objects
 */
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
 * A set of convenience methods for working with Cookies.
 */

function setCookies(res) {
  var headers = res.headers['set-cookie'] || [];
  sessionCookies = headers.reduce(function (cookies, cookie) {
    var parsedCookie = _toughCookie.Cookie.parse(cookie);
    cookies[parsedCookie.key] = parsedCookie;
    return cookies;
  }, sessionCookies);
  return sessionCookies;
}

/**
 * Sets a cookie on the global cookiejar.
 *
 * @param {string} key - the cookie name
 * @param {string} value - the cookie value
 */
function setCookie(key, value) {
  sessionCookies[key] = new _toughCookie.Cookie({ key: key, value: value });
}

/**
 * Serializes the global cookiejar out to a string suitable for the cookie header.
 *
 * @return {string} - the cookiejar serialized to a string value
 */
function serialize() {
  var keys = Object.keys(sessionCookies);
  return keys.map(function (cookie) {
    return sessionCookies[cookie].toString();
  }).join(';');
}

/**
 * Returns the value of just the 'crumb' cookie.
 *
 * @return {string} - the crumb cookie value
 */
function getCrumb() {
  return (sessionCookies['crumb'] || {}).value;
}