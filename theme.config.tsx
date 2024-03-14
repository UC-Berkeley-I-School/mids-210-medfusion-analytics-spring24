import React from 'react';
import { useRouter } from 'next/router';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span>Medical Multi Modal Model</span>,
  project: {
    link: 'https://github.com/UC-Berkeley-I-School/mids-210-medical-multi-modal-model-spring24',
  },
  docsRepositoryBase: 'https://github.com/UC-Berkeley-I-School/mids-210-medical-multi-modal-model-spring24',
  footer: {
    text: 'Medical Multi Modal Models Capstone Project - MIDS 210 Spring 2024',
  },
  useNextSeoProps: () => {
    const { asPath } = useRouter();
    if (asPath !== '/mids-210-medical-multi-modal-model-spring24') {
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
