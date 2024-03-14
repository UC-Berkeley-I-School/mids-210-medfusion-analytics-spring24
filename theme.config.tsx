import React from 'react';
import { useRouter } from 'next/router';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span>Medical Multi Modal Model</span>,
  project: {
    link: 'https://github.com/shuding/nextra-docs-template',
  },
  docsRepositoryBase: 'https://github.com/shuding/nextra-docs-template',
  footer: {
    text: 'Medical Multi Modal Models Capstone Project - MIDS 210 Spring 2024',
  },
  useNextSeoProps: () => {
    const { asPath } = useRouter();
    if (asPath !== '/') {
      return {
        titleTemplate: '%s – Medical Multi Modal Model',
      };
    }
  },
  feedback: {
    content: '',
  },
};

export default config;
