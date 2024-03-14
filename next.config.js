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
  basePath: '/mids-210-medical-multi-modal-model-spring24',
  images: {
    unoptimized: true,
  },
};
