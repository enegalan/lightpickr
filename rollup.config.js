import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/lightpickr.js',
    format: 'iife',
    name: 'Lightpickr',
    sourcemap: false
  },
  plugins: [
    terser({
      compress: { passes: 3, unsafe: true, pure_getters: true },
      mangle: true,
      format: { comments: false }
    }),
    copy({
      targets: [{ src: 'src/styles/base.css', dest: 'dist', rename: 'lightpickr.css' }]
    })
  ]
};
