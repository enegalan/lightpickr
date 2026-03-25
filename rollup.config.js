import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

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

export default {
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
