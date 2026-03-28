import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localeDir = join(__dirname, 'src', 'locale');

/**
 * @returns {string[]}
 */
function readLocaleCodes() {
  return readdirSync(localeDir, { withFileTypes: true })
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.js'))
    .map((dirent) => dirent.name.replace(/\.js$/, ''))
    .sort();
}

/**
 * @param {object} [rootOpts] Terser minify root options (e.g. module, toplevel)
 * @returns {import('rollup').Plugin}
 */
function terserPlugin(rootOpts) {
  return terser({
    compress: {
      passes: 5,
      ecma: 2020,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_comps: true,
      unsafe_math: true,
      unsafe_methods: true,
      unsafe_proto: true,
      unsafe_regexp: true,
      unsafe_undefined: true,
      pure_getters: true
    },
    mangle: true,
    format: { comments: false, ecma: 2020 },
    ...rootOpts
  });
}

/** @type {import('rollup').RollupOptions} */
const mainBundle = {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/lightpickr.js',
      format: 'iife',
      name: 'Lightpickr',
      sourcemap: false,
      plugins: [terserPlugin()]
    },
    {
      file: 'dist/lightpickr.esm.js',
      format: 'es',
      sourcemap: false,
      plugins: [terserPlugin({ module: true, toplevel: true })]
    }
  ],
  plugins: [
    copy({
      targets: [{ src: 'src/styles/base.css', dest: 'dist', rename: 'lightpickr.css' }]
    })
  ]
};

/**
 * @param {string} code
 * @returns {import('rollup').RollupOptions}
 */
function localeBundle(code) {
  return {
    input: `src/locale/${code}.js`,
    output: {
      file: `dist/locale/${code}.js`,
      format: 'es',
      sourcemap: false,
      plugins: [terserPlugin({ module: true, toplevel: true })]
    }
  };
}

export default [mainBundle, ...readLocaleCodes().map(localeBundle)];
