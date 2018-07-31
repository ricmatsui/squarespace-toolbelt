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
 * squarespace-runserver command
 *
 * Runs the Squarespace Development Server. Note that the server must be
 * installed separately. This command simply wraps the server and applies
 * default configs from the .npmrc file.
 *
 * The Squarespace Development Server can be installed with the command:
 *   npm install -g @squarespace/squaresapace-dev-server
 * Visit http://developers.squarespace.com/local-development for more
 * information.
 *
 * Usage: squarespace runserver SITE_URL [options]
 */

/* eslint-disable no-process-exit */

var colors = require('colors');
var Program = require('commander');
var exec = require('./utils/exec');
var setup = require('./utils/setup');
var checkForServer = require('./utils/checkForServer');

function run(cmd) {
  checkForServer().then(function () {
    exec(cmd, { 'stdio': 'inherit' });
  });
}

function getHelp() {
  run(['squarespace-server', '--help']);
  console.log();
  console.log('NOTE: when running squarespace-server through runserver, default for --directory is \'./build\'');
  console.log();
}

var siteUrl = void 0;

Program.usage('squarespace runserver [siteUrl] [options]').allowUnknownOption().arguments('[siteUrl]').option('-d, --directory <directory>').action(function (url) {
  siteUrl = url;
});

var parsed = Program.parseOptions(process.argv.slice(2));
if (parsed.unknown.indexOf('--help') >= 0 || parsed.unknown.indexOf('-h') >= 0) {
  getHelp();
} else {
  Program.parseArgs(parsed.args, parsed.unknown);
}

if (!siteUrl) {
  siteUrl = setup.getSiteUrl(process.cwd());
}

if (!siteUrl) {
  getHelp();
  console.error(colors.red('ERROR: siteUrl must be provided or else run "squarespace setup" first.\n'));
} else {
  var dir = Program.directory || './build';
  var cmd = ['squarespace-server'].concat(siteUrl, '--directory=' + dir, parsed.unknown);
  run(cmd);
}