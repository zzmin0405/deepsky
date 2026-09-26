import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	},  vite: {
		server: {
		  proxy: {
			'/api': {
			  target: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0',
			  changeOrigin: true,
			  rewrite: (path) => path.replace(/^\/api/, ''),
			},
		  },
		},
	  },
	}

export default config;
