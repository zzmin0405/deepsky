// 마지막 글자의 받침 유무로 주격 조사 '이'/'가'를 고릅니다. 한글로 끝나지 않으면 '이'를 씁니다.
export function subjectParticle(text) {
	const value = String(text ?? '');
	const lastChar = value.charCodeAt(value.length - 1);
	if (Number.isNaN(lastChar) || lastChar < 0xac00 || lastChar > 0xd7a3) return '이';
	return (lastChar - 0xac00) % 28 === 0 ? '가' : '이';
}
