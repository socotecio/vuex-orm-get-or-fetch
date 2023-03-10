import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: "default"
    },
    {
      file: pkg.module,
      format: 'es',
      exports: "default"
    },
  ],
  external: [
    "@vuex-orm/core"
  ],
  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
  ],
}