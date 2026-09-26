import DOMPurify from 'dompurify';
import { marked } from 'marked';

const ALLOWED_TAGS = [
	'p', 'br', 'strong', 'em', 'del', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
	'h1', 'h2', 'h3', 'h4', 'a', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
];
const ALLOWED_ATTR = ['href', 'title'];

export function escapeHtml(text) {
	return String(text ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

// LLM 답변을 마크다운으로 렌더링하되 허용한 문서 태그와 링크 속성만 남깁니다.
// DOM이 없는 서버 렌더링에서는 DOMPurify가 정제를 하지 못하므로 HTML로 해석하지 않고 글자 그대로 내보냅니다.
export function renderMarkdown(text) {
	if (!DOMPurify.isSupported) return escapeHtml(text);

	const html = marked.parse(String(text ?? ''), { async: false });
	return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
