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
 * squarespace-deploy command
 *
 * Deploys a built template by creating a commit and pushing it to a git repo.
 * Typically should be called from the template's root, with the built template
 * located in a build/ subfolder.
 *
 * Note: The template will likely be version controlled using a separate
 * source-only repo at the root. In that repo, the build subfolder should be
 * added to .gitignore.
 *
 * Usage: squarespace deploy REPO_URL [options]
 */

require('babel-polyfill');

var colors = require('colors');
var Program = require('commander');
var Moment = require('moment');
var URL = require('url-parse');

var Deployment = require('./utils/deployment');
var Watcher = require('./utils/watch');
var setup = require('./utils/setup');

var WATCH_EXCL_PATTERNS = ['.git/', '.CVS/', '.svn/', 'node_modules/'];

var repoUrl = void 0;

function main(options) {
  var directory = options.directory || './build';
  var message = options.message || 'squarespace deploy ' + Moment().format('lll');
  var normalizedUrl = repoUrl.replace(/([^:])(\/\/+)/, '$1/').replace(/^http:/, 'https:');

  Deployment.deploy(directory, normalizedUrl, message, true);

  if (options.watch) {
    Watcher.watchFolder(directory, WATCH_EXCL_PATTERNS, function () {
      Deployment.deploy(directory, repoUrl, message, false);
    });
  }
}

Program.arguments('[repository]').action(function (repository) {
  repoUrl = repository;
}).option('-d, --directory <directory>', 'Deploy from this directory. Default is \'build\'').option('-m, --message <message>', 'Deployment message. Default is \'squarespace deploy <date time>\'').option('-w, --watch', 'Watch the build directory for changes and deploy automatically.').parse(process.argv);

if (!repoUrl) {
  var siteUrl = setup.getSiteUrl(process.cwd());
  if (siteUrl) {
    siteUrl = new URL(siteUrl);
    siteUrl.set('pathname', '/template.git');
    repoUrl = siteUrl.href;
  }
}

if (!repoUrl) {
  Program.outputHelp();
  console.error(colors.red('ERROR: repository must be provided or else ' + 'run "squarespace setup" first.\n'));
} else {
  main(Program);
}