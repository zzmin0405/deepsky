// 공개 응답에 비밀번호 해시가 포함되지 않도록 조회 단계에서 제한합니다.
export const publicPostSelect = {
	id: true,
	title: true,
	content: true,
	author: true,
	createdAt: true,
	updatedAt: true
};
