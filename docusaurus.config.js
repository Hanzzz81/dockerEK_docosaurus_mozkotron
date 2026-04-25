// @ts-check
const {themes: prismThemes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Mozkotron',
  tagline: 'Znalostní báze Elektro Kutílek',
  favicon: 'img/favicon.ico',

  url: 'http://localhost',
  baseUrl: '/',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'cs',
    locales: ['cs'],
  },

  markdown: {
    format: 'detect',
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  scripts: [
    '/js/ek-components.js',
    '/js/cdn-loader.js',
    '/js/reading-tracker.js',
    '/js/sidebar-tree.js',
    '/js/status-bar.js',
  ],

  stylesheets: [
    '/css/mozkotron-theme.css',
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: undefined,
          exclude: [
            '_*/**',
            '**/_*/**',
          ],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Mozkotron',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'mainSidebar',
            position: 'left',
            label: 'Znalostní báze',
          },
        ],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
      footer: {
        style: 'light',
        copyright: `Elektro Kutílek — interní znalostní báze © ${new Date().getFullYear()}`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'yaml', 'json', 'python'],
      },
      mermaid: {
        theme: {light: 'neutral', dark: 'dark'},
      },
    }),
};

module.exports = config;
