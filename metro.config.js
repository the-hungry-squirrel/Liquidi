const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Set base URL for GitHub Pages
if (process.env.EXPO_PUBLIC_URL) {
  config.transformer = {
    ...config.transformer,
    publicPath: process.env.EXPO_PUBLIC_URL,
  };
}

module.exports = config;
