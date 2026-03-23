import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

const terserPlugin = terser({
  compress: { passes: 3, unsafe: true, pure_getters: true },
  mangle: true,
  format: { comments: false }
});

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/lightpickr.js',
      format: 'iife',
      name: 'Lightpickr',
      sourcemap: false,
      plugins: [terserPlugin]
    },
    {
      file: 'dist/lightpickr.esm.js',
      format: 'es',
      sourcemap: false,
      plugins: [terserPlugin]
    }
  ],
  plugins: [
    copy({
      targets: [{ src: 'src/styles/base.css', dest: 'dist', rename: 'lightpickr.css' }]
    })
  ]
};
