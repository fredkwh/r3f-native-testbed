const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Shim Node built-ins that appear in R3F's CJS bundle (dead code from
// import.meta polyfill that Metro still tries to resolve)
config.resolver.extraNodeModules = {
  url: path.resolve(__dirname, 'shims/url'),
};

module.exports = config;
