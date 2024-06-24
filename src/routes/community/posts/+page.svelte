<script>
    export let data;
  </script>
  <a href="/community">전체 글</a>
  <h1>게시글 목록</h1>
  
  <ul>
    {#each data.posts as post}
      <li>
        <a href="/community/posts/{post.id}">{post.title}</a>
      </li>
    {/each}
  </ul>
  
  <a href="/community/posts/create">새 글 작성</a>