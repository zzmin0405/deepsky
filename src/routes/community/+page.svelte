<script>
  export let data;
</script>

<h1>Welcome to My Blog</h1>

<p>
  <a href="/community/posts">post</a>
</p>

<h2>최신 글</h2>

<ul>
  {#each data.recentPosts as post}
    <li>
      <a href="/community/posts/{post.id}">{post.title}</a>
    </li>
  {/each}
</ul>

{#if data.user}
  <p>Hello, {data.user.name}!</p>
  <a href="/community/posts/create">Create a new post</a>
{:else}
  <p>Please log in to create a new post.</p>
  <a href="/login">Log In</a>
{/if}