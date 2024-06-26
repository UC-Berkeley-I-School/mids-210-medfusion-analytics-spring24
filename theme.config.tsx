import React from 'react';
import { useRouter } from 'next/router';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span>MedFusion Analytics</span>,
  project: {
    link: 'https://github.com/UC-Berkeley-I-School/mids-210-medfusion-analytics-spring24',
  },
  docsRepositoryBase: 'https://github.com/UC-Berkeley-I-School/mids-210-medfusion-analytics-spring24/tree/main',
  footer: {
    text: 'MedFusion Analytics Capstone Project - MIDS 210 Spring 2024',
  },
  useNextSeoProps: () => {
    const { asPath } = useRouter();
    if (asPath !== '/') {
      return {
        titleTemplate: '%s – MedFusion Analytics',
      };
    }
    return {
      titleTemplate: '%s',
    };
  },
  feedback: {
    content: '',
  },
  head: (
    <>
      <link rel="apple-touch-icon" sizes="180x180" href="/mids-210-medfusion-analytics-spring24/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/mids-210-medfusion-analytics-spring24/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/mids-210-medfusion-analytics-spring24/favicon-16x16.png" />
      <link rel="manifest" href="/mids-210-medfusion-analytics-spring24/site.webmanifest" />
      <link rel="mask-icon" href="/mids-210-medfusion-analytics-spring24/safari-pinned-tab.svg" color="#5bbad5" />
    </>
  ),
};

export default config;
