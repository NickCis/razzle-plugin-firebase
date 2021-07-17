# razzle-plugin-firebase

A [Razzle](https://github.com/jaredpalmer/razzle) plugin for seting up [firebase](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin) (with local emulation!)

See [example](./example) for an example!

## Usage

Install the plugin:

```sh
# using npm
npm install --dev razzle-plugin-firebase

# yarn
npm add --dev razzle-plugin-firebase
```

Add configuration to `razzle.config.js`:

```js
// razzle.config.js file

module.exports = {
  plugins: [
    'firebase'
  ],
};
```

## Configuration

The plugin allows the following option keys:

- `pkg`: Project's `package.json` file (_default: `package.json`_)
- `firebase`: Project's `firebase.json` file (_default: `firebase.json`_)
- `target`: In the case `hostings` on the firebase file is an array, the [hosting target](https://firebase.google.com/docs/cli/targets) value
- `exec`: Use `exec` instead of `spawn` (_default: `false`_)
- `start`: Firebase command to run in order to start emulators (_default: `emulators:start`_)
- `serverIndex`: Server output filename (_default: `index.js`_)

```js
// razzle.config.js file

module.exports = {
  plugins: [
    {
      name: 'firebase',
      options: {
        target: 'app',
        start: 'serve',
      },
    }
  ],
};
```
