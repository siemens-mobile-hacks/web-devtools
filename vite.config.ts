import { defineConfig, Plugin } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import solidSvg from 'vite-plugin-solid-svg'
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';
import fs from 'node:fs';

const ROUTES = [
	`/swilib`,
	`/swilib/phone`,
	`/swilib/analysis`,
	`/swilib/analysis/summary`,
	`/swilib/analysis/target`,
	`/swilib/check`,
	`/swilib/merge`,
	`/swilib/merge/editor`,

	`/re`,
	`/re/symbols`,
	`/re/ptr89`,
	`/re/c166-calculator`,

	`/db`,
	`/db/patches-map`,
	`/db/memory-map`,
];

function postBuildPlugin(): Plugin {
	return {
		name: 'postbuild-plugin',
		async closeBundle() {
			const isSymlinkExists = (file: string) => {
				try {
					fs.lstatSync(file);
					return true;
				} catch (e) {
					return false;
				}
			};

			let outDir = `${import.meta.dirname}/dist`;
			for (let routeDir of ROUTES) {
				let symlinkSrc = path.relative(`${outDir}/${routeDir}`, `${outDir}/index.html`);
				let symlinkDst = `${outDir}/${routeDir}/index.html`;

				fs.mkdirSync(`${outDir}/${routeDir}`, { recursive: true });

				if (isSymlinkExists(symlinkDst))
					fs.unlinkSync(symlinkDst);

				fs.symlinkSync(symlinkSrc, `${outDir}/${routeDir}/index.html`);
			}
		}
	};
}

export default defineConfig({
	worker: {
		format: 'es',
		plugins: () => [ tsconfigPaths() ]
	},
	css: {
		preprocessorOptions: {
			scss: {
				silenceDeprecations: ["import", "color-functions", "global-builtin", "if-function"],
			},
		}
	},
	plugins: [
		solidPlugin(),
		tsconfigPaths(),
		postBuildPlugin(),
		solidSvg({
			 defaultAsComponent: true,
			 svgo: {
				 enabled: true,
				 svgoConfig: {
					 plugins: [
						 {
							 name: 'preset-default',
							 params: {
								 overrides: {
									 removeViewBox: false,
								 },
							 },
						 },
					 ],
				 },
			 },
		 }),
	],
	optimizeDeps: {
		exclude: ['@sie-js/ptr89'],
	},
	server: {
		port: 3000,
	},
	build: {
		target: 'esnext'
	},
});
