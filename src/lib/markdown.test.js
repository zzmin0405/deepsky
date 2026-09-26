import { describe, expect, it } from 'vitest';
import { escapeHtml, renderMarkdown } from './markdown.js';

describe('renderMarkdown', () => {
	it('DOM이 없는 서버 렌더링에서는 HTML로 해석하지 않고 글자 그대로 내보낸다', () => {
		expect(renderMarkdown('<img src=x onerror=alert(1)> **굵게**')).toBe(
			'&lt;img src=x onerror=alert(1)&gt; **굵게**'
		);
		expect(renderMarkdown(null)).toBe('');
	});

	it('escapeHtml은 속성 값을 끊을 수 있는 따옴표까지 바꾼다', () => {
		expect(escapeHtml(`"'&<>`)).toBe('&quot;&#39;&amp;&lt;&gt;');
	});
});
