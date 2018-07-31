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
 * squarespace-assemble command
 *
 * Assembles template files into the build folder, optionally
 * with template modules.
 *
 * Usage: squarespace-assemble [options]
 */

var path = require('path');
var http = require('http');
var Program = require('commander');
var FileManager = require('./utils/FileManager');
var Watcher = require('./utils/watch');

function configServer(options) {
  var server = 'http://localhost:9000';
  if (typeof options.triggerReload === 'string') {
    server = options.triggerReload.replace(/\/$/, '');
    if (server.search(/^http[s]?\:\/\//) === -1) {
      server = 'http://' + server;
    }
  }
  return server;
}

function main(options) {
  var srcDir = options.directory || process.cwd();
  var buildDir = options.output || path.join(srcDir, 'build');
  var packageJsonDir = options.package ? path.resolve(process.cwd(), options.package) : process.cwd();
  var omit = options.omit && options.omit.split(',') || [];
  var isLegacy = options.legacy || false;
  var server = configServer(options);

  var manager = new FileManager({
    srcDir: srcDir,
    buildDir: buildDir,
    packageJsonDir: packageJsonDir
  });

  function reload() {
    if (options.triggerReload) {
      http.get(server + '/local-api/reload/trigger').on('error', function () {});
    }
  }

  /**
   * Options
   */

  // --legacy, omit the scripts folder if not active
  if (!isLegacy) {
    omit.push('scripts');
  }

  // --noclean
  if (!options.noclean) {
    manager.deleteBuild();
    console.log('Destination directory cleaned');
  }

  // --watch
  if (options.watch) {
    manager.syncAllFiles({ omit: omit });
    Watcher.watchAndCollect({
      manager: manager,
      rootDir: srcDir,
      flags: { omit: omit },
      callback: reload
    });
  } else {
    manager.syncAllFiles({ omit: omit });
    reload();
  }
}

Program.option('-n, --noclean', 'Assemble without first cleaning the output directory.').option('-w, --watch', 'Watch for changes and assemble incrementally.').option('-d, --directory <directory>', 'Source directory. Default is \'.\'').option('-o, --output <output>', 'Output directory for assembled files. Default is \'build\'').option('-T, --trigger-reload [host:port]', 'Trigger Local Development Server to reload on each assemble.').option('-m, --omit <type>', 'Skip template components during assembly, comma separated (e.g. styles,blocks)').option('-p, --package <directory>', 'Directory containing package.json. Default is the current working directory.').option('-l, --legacy', 'Copies scripts directory for older templates with squarespace:script tags.').parse(process.argv);

main(Program);