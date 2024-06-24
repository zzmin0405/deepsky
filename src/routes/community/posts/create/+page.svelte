<h1>새 글 작성</h1>

<form action="?/createPost" method="POST">
  <label>
    제목:
    <input type="text" name="title" required>
  </label>
  <label>
    내용:
    <textarea name="content" required></textarea>
  </label>
  <label>
    작성자:
    <input type="text" name="author" required>
  </label>
  <label>
    비밀번호:
    <input type="password" name="password" minlength="4" required>
  </label>
  <button type="submit">작성</button>
</form>