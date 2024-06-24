<script>
    export let data;
  </script>
  
  <h1>글 수정</h1>
  
  <form action="?/updatePost" method="POST">
    <label>
      제목:
      <input type="text" name="title" value={data.post.title} required>
    </label>
    <label>
      내용:
      <textarea name="content" required>{data.post.content}</textarea>
    </label>
    <label>
      비밀번호:
      <input type="password" name="password" required>
    </label>
    <button type="submit">수정</button>
  </form>