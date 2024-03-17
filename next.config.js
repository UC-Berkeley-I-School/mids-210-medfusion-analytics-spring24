const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  unstable_staticImage: true,
});

/**
 * @type {import('next').NextConfig}
 */
module.exports = withNextra({
  rewrites: undefined,
  output: 'export',
  basePath: '/mids-210-medical-multi-modal-model-spring24',
  images: {
    unoptimized: true,
  },
  webpack: (config, {}) => {
    // config.resolve.extensions.push('.ts', '.tsx', '.mdx');
    config.resolve.fallback = { fs: false };

    config.plugins.push(
      new NodePolyfillPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: './node_modules/onnxruntime-web/dist/ort-wasm.wasm',
            to: 'static/chunks/pages',
          },
          {
            from: './node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm',
            to: 'static/chunks/pages',
          },
          {
            from: './model',
            to: 'static/chunks/pages',
          },
        ],
      })
    );

    return config;
  },
});
