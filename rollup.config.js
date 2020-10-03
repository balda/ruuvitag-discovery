import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
// import pkg from './../package.json';
// console.log(pkg);

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'svelte/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: production ? 'assets/app.min.js' : 'assets/app.js',
	},
	plugins: [
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into a separate file - better for performance
			css: css => {
				css.write(production ? 'app.min.css' : 'app.css');
			}
		}),

		// additional configuration
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		// In dev mode, call `NODE_ENV=dev node index.js` once the bundle has been generated
		!production && serve(),

		// If we're building for production (npm run build instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

function serve() {
	let started = false;
	return {
		writeBundle() {
			if (!started) {
				started = true;
				require('child_process').spawn('node', ['index.js'], {
					env: {...process.env, NODE_ENV: `dev`},
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true,
				});
			}
		}
	};
}
