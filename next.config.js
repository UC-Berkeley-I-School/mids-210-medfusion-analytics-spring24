const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  unstable_staticImage: true,
});

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  ...withNextra(),
  rewrites: undefined,
  output: 'export',
  basePath: '',
  images: {
    unoptimized: true,
  },
};
