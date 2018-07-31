'use strict';

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
 * Utilities for reading from / writing to a .npmrc file.
 */

var fs = require('fs');
var splitlines = require('split-lines');

/**
 * Reads an .npmrc file, returning an object containing the keys and values.
 * Each key, value pair should be on its own line, separated by an '=' sign.
 * Bracket notation is used to designate array values.
 *
 * See https://docs.npmjs.com/files/npmrc
 *
 * ex:
 * name = "John Doe"
 * type = human
 * friends[] = Mark
 * friends[] = Sue
 *
 * @param {string} rootFolder - the folder containing the .npmrc file.
 * @return {object} an object containing the keys and values in the file.
 */
function readNpmrcSync(filePath) {
  var result = {};
  var content = void 0;
  try {
    content = fs.readFileSync(filePath, { encoding: 'utf8' });
  } catch (e) {
    if (e.code === 'ENOENT') {
      return;
    }
    throw e;
  }
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = splitlines(content)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var line = _step.value;

      var tokens = line.split('=');
      var key = tokens[0].trim();
      var value = tokens.slice(1).join('=');
      if (key.endsWith('[]')) {
        key = key.substr(0, key.length - 2);
        if (!Array.isArray(result[key])) {
          result[key] = [];
        }
        result[key].push(value);
      } else {
        result[key] = value;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return result;
}

/**
 * Writes an .npmrc file from an object containing the keys and values.
 *
 * See https://docs.npmjs.com/files/npmrc
 *
 * @param {object} data - an object containing the keys and values.
 * @param {string} rootFolder - the folder in which to write the .npmrc file.
 */
function writeNpmrcSync(data, filePath) {
  var output = '';
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = Object.keys(data)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var key = _step2.value;

      if (!key) {
        continue;
      }
      if (Array.isArray(data[key])) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = data[key][Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var val = _step3.value;

            output += key + '[]=' + val + '\n';
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      } else {
        output += key + '=' + data[key] + '\n';
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  fs.writeFileSync(filePath, output, { mode: 384 });
}

module.exports = {
  readNpmrcSync: readNpmrcSync,
  writeNpmrcSync: writeNpmrcSync
};