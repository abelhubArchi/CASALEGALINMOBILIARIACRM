import adapterAuto from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const adapter = process.env.VERCEL
	? adapterAuto
	: () => adapterNode({ precompress: false });

export default defineConfig({
	build: {
		sourcemap: false,
		chunkSizeWarningLimit: 2000
	},
	ssr: {
		noExternal: ['lucide-svelte', '@lucide/svelte']
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});


