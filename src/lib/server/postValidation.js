const LIMITS = {
	title: 100,
	content: 5000,
	author: 50,
	password: 128
};

function readText(formData, field) {
	return String(formData.get(field) || '').trim();
}

export function parsePostId(value) {
	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
}

export function validatePostForm(formData, { requireAuthor = true } = {}) {
	const values = {
		title: readText(formData, 'title'),
		content: readText(formData, 'content'),
		author: requireAuthor ? readText(formData, 'author') : undefined
	};
	const password = readText(formData, 'password');

	if (!values.title || !values.content || !password || (requireAuthor && !values.author)) {
		return { error: '모든 필드를 입력해 주세요.', values };
	}

	if (values.title.length > LIMITS.title) {
		return { error: `제목은 ${LIMITS.title}자 이하여야 합니다.`, values };
	}

	if (values.content.length > LIMITS.content) {
		return { error: `내용은 ${LIMITS.content}자 이하여야 합니다.`, values };
	}

	if (requireAuthor && values.author.length > LIMITS.author) {
		return { error: `작성자는 ${LIMITS.author}자 이하여야 합니다.`, values };
	}

	if (password.length < 4 || password.length > LIMITS.password) {
		return { error: '비밀번호는 4자 이상 128자 이하로 입력해 주세요.', values };
	}

	return { values, password };
}
