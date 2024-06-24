<script>
    export let data;
  </script>
  
  <article>
    <h1>{data.post.title}</h1>
    <p>{data.post.content}</p>
    <small>작성자: {data.post.author}</small>
    <br>
    <small>작성일: {new Date(data.post.createdAt).toLocaleString()}</small>
    <br>
    <small>수정일: {new Date(data.post.updatedAt).toLocaleString()}</small>
  </article>
  
  <a href="/community/posts/{data.post.id}/edit">수정</a>
  <form action="?/deletePost" method="POST">
    <label>
      비밀번호:
      <input type="password" name="password" required>
    </label>
    <button type="submit">삭제</button>
  </form>
  {#if data.user && data.user.isAdmin}
  <a href="/community/posts/{data.post.id}/edit">수정 (관리자)</a>
  <form action="?/deletePostByAdmin" method="POST">
    <button type="submit">삭제 (관리자)</button>
  </form>
{/if}