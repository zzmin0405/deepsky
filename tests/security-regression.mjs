import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const originalFetch = globalThis.fetch;
try {
 const { db } = await server.ssrLoadModule('/src/lib/server/db.js');
 const record = { id: 1, title: '검증', content: '내용', author: '테스트', createdAt: new Date(), updatedAt: new Date(), passwordHash: '공개금지' };
 const selectRecord = async ({ select }) => {
  assert.ok(select, '공개 조회는 필드 선택이 필요합니다.');
  assert.equal(select.passwordHash, undefined);
  return Object.fromEntries(Object.keys(select).map(key => [key, record[key]]));
 };
 db.post.findMany = async (args) => [await selectRecord(args)];
 db.post.findUnique = selectRecord;
 for (const route of ['/src/routes/community/+page.server.js','/src/routes/community/posts/+page.server.js','/src/routes/community/posts/[id]/+page.server.js','/src/routes/community/posts/[id]/edit/+page.server.js']) {
  const { load } = await server.ssrLoadModule(route);
  assert.ok(!JSON.stringify(await load({ params: { id: '1' } })).includes('공개금지'));
 }
 const posts = await server.ssrLoadModule('/src/routes/community/posts/+server.js');
 assert.ok(!(await (await posts.GET()).text()).includes('공개금지'));
 const { POST } = await server.ssrLoadModule('/src/routes/api/chat/+server.js');
 const event = (body) => ({ request: new Request('http://localhost/api/chat', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } }), getClientAddress: () => 'regression-test' });
 for (const body of ['{', 'null', '{}', '{"message":12}', JSON.stringify({message:'x'.repeat(2001)})]) {
  assert.equal((await POST(event(body))).status, 400);
 }
 globalThis.fetch = async () => { throw new Error('테스트 네트워크 실패'); };
 const result = await POST(event(JSON.stringify({ message: '안녕하세요' })));
 assert.equal(result.status, 200);
 const payload = await result.json();
 assert.equal(payload.fallback, true);
 assert.equal(typeof payload.response, 'string');
 console.log('통과: 공개 조회 5곳 해시 제외, 잘못된 요청 5종, LLM 네트워크 실패 대체 응답');
} finally {
 globalThis.fetch = originalFetch;
 await server.close();
}
