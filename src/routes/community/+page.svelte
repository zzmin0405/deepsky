<script>
  export let data;
</script>

<div class="community-container">
  <section class="hero-section">
    <h1>DeepSky 커뮤니티</h1>
    <p class="subtitle">천문학 애호가들을 위한 소통 공간</p>
  </section>

  <div class="content-wrapper">
    <section class="recent-posts">
      <div class="section-header">
        <h2>최신 글</h2>
        <a href="/community/posts" class="view-all">전체보기 →</a>
      </div>
      
      <div class="posts-grid">
        {#each data.recentPosts as post}
          <div class="post-card">
            <div class="post-content">
              <h3>
                <a href="/community/posts/{post.id}">{post.title}</a>
              </h3>
              <p class="post-meta">
                <span class="author">{post.author}</span>
                <span class="date">{new Date(post.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <section class="community-actions">
      <a href="/community/posts/create" class="create-post-btn">
        <i class="fas fa-pen"></i>
        새 글 작성하기
      </a>
    </section>
  </div>
</div>

<style>
  .community-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .hero-section {
    text-align: center;
    padding: 40px 20px;
    background: linear-gradient(to right, #4a365a63, #8e66d8e7);
    border-radius: 15px;
    color: white;
    margin-bottom: 40px;
  }

  .hero-section h1 {
    font-size: 2.5em;
    margin: 0;
    margin-bottom: 10px;
  }

  .subtitle {
    font-size: 1.2em;
    opacity: 0.9;
    margin: 0;
  }

  .content-wrapper {
    display: grid;
    gap: 30px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .section-header h2 {
    font-size: 1.5em;
    margin: 0;
    color: #333;
  }

  .view-all {
    color: #8e66d8;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .view-all:hover {
    color: #7451c3;
  }

  .posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .post-card {
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .post-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .post-content {
    padding: 20px;
  }

  .post-content h3 {
    margin: 0;
    margin-bottom: 10px;
    font-size: 1.2em;
  }

  .post-content h3 a {
    color: #333;
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .post-content h3 a:hover {
    color: #8e66d8;
  }

  .post-meta {
    font-size: 0.9em;
    color: #666;
    display: flex;
    justify-content: space-between;
  }

  .author {
    color: #8e66d8;
    font-weight: 500;
  }

  .community-actions {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .create-post-btn {
    background: #8e66d8;
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 25px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    transition: background-color 0.3s ease;
  }

  .create-post-btn:hover {
    background: #7451c3;
  }

  @media (max-width: 768px) {
    .hero-section {
      padding: 30px 15px;
    }

    .hero-section h1 {
      font-size: 2em;
    }

    .posts-grid {
      grid-template-columns: 1fr;
    }

    .post-card {
      margin-bottom: 15px;
    }
  }
</style>