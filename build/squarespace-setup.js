#!/usr/bin/env node
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
 * squarespace-setup command
 *
 * Prompts user to provide configuration options that will be added to
 * the .npmrc file for a Squarespace template.
 *
 * Usage: squarespace setup [options]
 */

/* eslint-disable no-process-exit */

var Program = require('commander');
var setup = require('./utils/setup');
var checkForServer = require('./utils/checkForServer');

function main(options) {
  var rootDir = process.cwd();
  var directory = options.directory || rootDir;
  checkForServer().then(function () {
    setup.setup(directory);
  }).catch(function () {
    process.exit(1);
  });
}

Program.option('-d, --directory <directory>', 'Directory to setup. Default is the current one.').parse(process.argv);

process.on('SIGINT', function () {
  process.exit(1);
});

main(Program);