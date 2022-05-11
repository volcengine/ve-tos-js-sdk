const createConfigItems =
  require('tsdx2/dist/babelPluginTsdx').createConfigItems;
const replacements = [{ original: 'lodash-es', replacement: 'lodash' }];

const plugins = createConfigItems('plugin', [
  /**
   * tsdx transforms lodash to lodash-es, but using lodash@4.17.21 and lodash-es will result error。
   * so transforming lodash-es to lodash by plugin.
   */
  {
    name: 'babel-plugin-transform-rename-import',
    replacements,
  },
]);

module.exports = { plugins };
