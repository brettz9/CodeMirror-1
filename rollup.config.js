import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';

function getBundleInfo ({format, file, min = false}) {
  return {
    input: "src/codemirror.js",
    output: {
      format,
      file,
      name: "CodeMirror",
      sourcemap: true,
      banner: `// CodeMirror, copyright (c) by Marijn Haverbeke and others
  // Distributed under an MIT license: https://codemirror.net/LICENSE

  // This is CodeMirror (https://codemirror.net), a code editor
  // implemented in JavaScript on top of the browser's DOM.
  //
  // You can find some technical background for some of the code below
  // at http://marijnhaverbeke.nl/blog/#cm-internals .
  `
    },
    plugins: [ babel(), min ? terser() : null ]
  };
}

export default [
  getBundleInfo({format: 'es', file: "dist/codemirror-es.js"}),
  getBundleInfo({format: 'es', file: "dist/codemirror-es.min.js", min: true}),
  getBundleInfo({format: 'umd', file: "lib/codemirror.js"}),
  getBundleInfo({format: 'umd', file: "lib/codemirror.min.js", min: true})
];
