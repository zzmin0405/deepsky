import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.test.js', 'tests/**/*.test.js'],
		environment: 'node',
		// 테스트마다 vi.spyOn·vi.stubGlobal로 바꾼 전역을 원래대로 돌립니다.
		restoreMocks: true,
		unstubGlobals: true
	}
});
