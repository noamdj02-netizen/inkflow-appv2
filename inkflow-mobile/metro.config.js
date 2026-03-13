/**
 * Metro config — fix tslib __extends undefined (ESM/CJS resolution)
 * Redirige tslib vers tslib.es6.js pour éviter "Cannot destructure property '__extends' of 'tslib.default' as it is undefined"
 */
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/tslib/tslib.es6.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
