module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required by react-native-reanimated/moti in production builds.
      'react-native-worklets/plugin',
    ],
  };
};
