const path = require('path');
const alias = require('@rollup/plugin-alias');
const replace = require('@rollup/plugin-replace');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');
const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve');
const { babelPluginTsdx } = require('tsdx2/dist/babelPluginTsdx');
const { DEFAULT_EXTENSIONS: DEFAULT_BABEL_EXTENSIONS } = require('@babel/core');

function p(relativeSrcPath) {
  return path.resolve(__dirname, 'src', relativeSrcPath);
}

module.exports = {
  // This function will run for each entry/format/env combination
  rollup(config, opts) {
    if (!config.treeshake) {
      config.treeshake = {};
    }
    config.treeshake.pureExternalModules = true;

    {
      // overwrite replace options to prevent warning message
      const replacePluginIdx = config.plugins.findIndex(
        it => it.name === 'replace'
      );
      config.plugins[replacePluginIdx] = replace({
        'process.env.NODE_ENV': JSON.stringify(opts.env),
        preventAssignment: true,
      });
    }

    {
      // overwrite babel for customizing node version
      // copy from:
      //   https://github.com/formium/tsdx/blob/462af2d002987f985695b98400e0344b8f2754b7/src/createRollupConfig.ts#L187-L197
      const MIN_NODE_VERSION = '10';
      const babelPluginIdx = config.plugins.findIndex(
        it => it.name === 'babel'
      );
      config.plugins[babelPluginIdx] = babelPluginTsdx({
        exclude: 'node_modules/**',
        extensions: [...DEFAULT_BABEL_EXTENSIONS, 'ts', 'tsx'],
        passPerPreset: true,
        custom: {
          targets:
            opts.target === 'node' ? { node: MIN_NODE_VERSION } : undefined,
          extractErrors: opts.extractErrors,
          format: opts.format,
        },
        babelHelpers: 'bundled',
      });
    }

    config.plugins.push(
      replace({
        'process.env.TARGET_ENVIRONMENT': `'${opts.target}'`,
        preventAssignment: true,
      })
    );

    config.plugins.push(
      replace({
        'process.env.BUILD_FORMAT': `'${opts.format}'`,
        preventAssignment: true,
      })
    );

    if (opts.target === 'browser') {
      config.input = p('browser-index.ts');

      {
        const resolverPluginIdx = config.plugins.findIndex(
          it => it.name === 'node-resolve'
        );
        config.plugins[resolverPluginIdx] = nodeResolve.default({
          browser: true,
          mainFields: ['module', 'main'],
          extensions: [...nodeResolve.DEFAULTS.extensions, '.jsx'],
        });
      }

      if (opts.format === 'umd') {
        config.external = () => false;
      }
    }

    return config; // always return a config.
  },
};
