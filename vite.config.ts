import { copyFileSync } from 'node:fs';
import builtins from 'builtin-modules';
import path from 'path';
import { defineConfig, UserConfig } from 'vite';

export default defineConfig(async ({ mode }) => {
	const { resolve } = path;
	const prod = mode === 'production';

	return {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: ''
				}
			}
		},
		define: {
			DEV: mode === 'development'
		},
		plugins: [
			{
				name: 'copy-manifest',
				writeBundle() {
					const src = resolve(__dirname, './manifest.json');
					const dest = resolve(__dirname, 'dist/manifest.json');
					if (mode === 'development') {
						copyFileSync(resolve(__dirname, 'src/devel/.hotreload'), resolve(__dirname, 'dist/.hotreload'));
						console.log('✅ [DEVMODE] Copied .hotreload to dist/');
					}
					copyFileSync(src, dest);
					console.log('✅ Copied manifest.json to dist/');
				}
			}
		],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src')
			}
		},
		build: {
			lib: {
				entry: resolve(__dirname, 'src/main.ts'),
				name: 'main',
				//				fileName: () => 'main.js',
				formats: ['cjs']
			},
			minify: prod,
			sourcemap: prod ? false : 'inline',
			cssCodeSplit: false,
			emptyOutDir: mode !== 'development',
			outDir: 'dist',
			rollupOptions: {
				input: {
					main: resolve(__dirname, 'src/main.ts'),
					styles: resolve(__dirname, 'src/style.scss')
				},
				output: {
					entryFileNames: 'main.js',
					assetFileNames: 'styles.css'
				},
				external: [
					'obsidian',
					'electron',
					'@codemirror/autocomplete',
					'@codemirror/collab',
					'@codemirror/commands',
					'@codemirror/language',
					'@codemirror/lint',
					'@codemirror/search',
					'@codemirror/state',
					'@codemirror/view',
					'@lezer/common',
					'@lezer/highlight',
					'@lezer/lr',
					...builtins
				]
			}
		}
	} as UserConfig;
});
