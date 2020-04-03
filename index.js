'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const paths = require('razzle/config/paths');
const CopyPlugin = require('copy-webpack-plugin');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebookincubator/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const DefaultOptions = {
  pkg: 'package.json',
  firebase: 'firebase.json',
  target: '',
  exec: false,
  start: 'emulators:start',
};

function modify(config, { target, dev }, webpack, opts = {}) {
  if (target === 'node') {
    const options = Object.assign({}, DefaultOptions, opts);
    const pkg = require(resolveApp(options.pkg));
    const firebase = require(resolveApp(options.firebase));
    const hosting = options.target
      ? firebase.hosting.find(({ target }) => target === options.target)
      : firebase.hosting;
    const functions = firebase.functions || {};

    // Correct servers output
    config.output.filename = 'index.js';
    config.output.path = resolveApp(functions.source || 'functions');

    // Add functions/package.json
    const functionsPkg = JSON.stringify({
      name: `${pkg.name}-functions`,
      version: pkg.version,
      private: true,
      dependencies: pkg.dependencies,
      engines: pkg.engines,
    });

    config.plugins.push({
      apply: compiler => {
        compiler.hooks.emit.tapAsync(
          'razzle-plugin-firebase',
          (compilation, callback) => {
            compilation.assets['package.json'] = {
              source: () => functionsPkg,
              size: () => functionsPkg.length,
            };
            callback();
          }
        );
      },
    });

    if (dev) {
      config.entry = config.entry.filter(e => !e.startsWith('webpack'));
      config.entry.unshift('source-map-support/register');

      // No start server on dev
      config.plugins = config.plugins.filter(
        plugin => plugin.constructor.name !== 'StartServerPlugin'
      );

      // Copy public file to the one firebase emulator will use
      const publicFolder = resolveApp(hosting.public || 'public');
      if (paths.appPublic !== publicFolder) {
        config.plugins.push(
          new CopyPlugin([
            {
              from: paths.appPublic,
              to: publicFolder,
            },
          ])
        );
      }

      let proc;
      const firebaseBin = require.resolve(
        path.join(
          'firebase-tools',
          require('firebase-tools/package.json').bin.firebase
        )
      );
      config.plugins.push({
        apply: compiler => {
          compiler.hooks.done.tapAsync(
            'razzle-plugin-firebase',
            (compilation, callback) => {
              if (!proc) {
                if (os.platform() === 'win32' || options.exec) {
                  proc = child.exec(
                    ['node', firebaseBin, options.start].join(' '),
                    error => {
                      if (error) throw error;
                    }
                  );

                  proc.stdout.pipe(process.stdout);
                  proc.stderr.pipe(process.stderr);
                } else {
                  proc = child.spawn('node', [firebaseBin, options.start], {
                    stdio: 'inherit',
                  });

                  proc.on('close', error => {
                    if (error) throw error;
                  });
                }
              }

              callback();
            }
          );
        },
      });
    }
  }

  return config;
}

module.exports = modify;
