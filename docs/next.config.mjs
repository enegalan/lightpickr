import path from 'path';
import { fileURLToPath } from 'url';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const docsRoot = path.dirname(fileURLToPath(import.meta.url));
const lightpickrPackageRoot = path.join(docsRoot, '..');

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  basePath: process.env.LIGHTPICKR_GITHUB_PAGES === '1' ? '/lightpickr' : '',
  transpilePackages: ['lightpickr'],
  turbopack: {
    root: docsRoot,
    resolveAlias: {
      lightpickr: path.join(lightpickrPackageRoot, 'dist', 'lightpickr.esm.js'),
      'lightpickr/lightpickr.css': path.join(lightpickrPackageRoot, 'dist', 'lightpickr.css'),
    },
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      lightpickr: path.join(lightpickrPackageRoot, 'dist', 'lightpickr.esm.js'),
      'lightpickr/lightpickr.css': path.join(lightpickrPackageRoot, 'dist', 'lightpickr.css'),
    };
    return webpackConfig;
  },
};

export default withMDX(config);
