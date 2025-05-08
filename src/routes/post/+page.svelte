<script>
  import { onMount } from 'svelte';

  let posts = [];

  // 날짜 포맷팅 함수
  function formatDate(date) {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // 게시물 상세 페이지로 이동하는 함수
  function navigateToPost(id) {
    window.location.href = `/post/${id}`;
  }

  // 더미 데이터 생성 (테스트용)
  onMount(() => {
    posts = [
      {
        id: 1,
        title: '첫 번째 게시물',
        content: '이것은 첫 번째 게시물의 내용입니다.',
        author: '작성자1',
        created_at: new Date(),
        views: 10,
        tags: ['태그1', '태그2']
      },
      {
        id: 2,
        title: '두 번째 게시물',
        content: '이것은 두 번째 게시물의 내용입니다.',
        author: '작성자2',
        created_at: new Date(),
        views: 15,
        tags: ['태그2', '태그3']
      },
      // 더 많은 더미 데이터를 추가할 수 있습니다
    ];
  });
</script>

<div class="post-container">
  <div class="post-header-section">
    <div class="header-content">
      <h1 class="page-title">전체 글 보기</h1>
      <p class="header-description">딥스카이의 다양한 이야기를 만나보세요</p>
    </div>
    <div class="post-filters">
      <select class="filter-select">
        <option value="latest">최신순</option>
        <option value="views">조회순</option>
        <option value="likes">인기순</option>
      </select>
    </div>
  </div>

  <div class="post-grid">
    {#each posts as post}
      <button 
        class="post-card"
        on:click={() => navigateToPost(post.id)}
        on:keydown={(e) => e.key === 'Enter' && navigateToPost(post.id)}
      >
        <div class="post-thumbnail default-thumbnail">
          <div class="post-category">일반</div>
          <div class="post-date-badge">
            {formatDate(post.created_at).split(' ')[1]}
          </div>
        </div>
        
        <div class="post-content">
          <h2 class="post-title">{post.title || '제목 없음'}</h2>
          <p class="post-excerpt">
            {#if post.content}
              {post.content.slice(0, 100)}...
            {:else}
              내용이 없습니다.
            {/if}
          </p>
          
          <div class="post-meta">
            <div class="post-info">
              <span class="post-author">
                <i class="fas fa-user"></i>
                {post.author || '익명'}
              </span>
              <span class="post-views">
                <i class="fas fa-eye"></i>
                {post.views || 0}
              </span>
            </div>
          </div>

          <div class="post-tags">
            {#if post.tags && post.tags.length > 0}
              {#each post.tags as tag}
                <span class="tag">#{tag}</span>
              {/each}
            {:else}
              <span class="tag">#일반</span>
            {/if}
          </div>
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .post-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    background: #f8fafc;
  }

  .post-header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
    padding: 0 0 30px 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .header-content {
    flex: 1;
  }

  .page-title {
    font-size: 2.5em;
    background: linear-gradient(135deg, #1e293b, #334155);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .header-description {
    color: #64748b;
    margin: 8px 0 0 0;
    font-size: 1.1em;
  }

  .filter-select {
    padding: 12px 24px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: white;
    font-size: 0.95rem;
    cursor: pointer;
    color: #475569;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .filter-select:hover {
    border-color: #94a3b8;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  }

  .post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 30px;
  }

  .post-card {
    background: white;
    border: none;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    width: 100%;
    text-align: left;
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    position: relative;
  }

  .post-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
  }

  .post-thumbnail {
    height: 200px;
    background-size: cover;
    background-position: center;
    position: relative;
  }

  .default-thumbnail {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    position: relative;
    overflow: hidden;
  }

  .default-thumbnail::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.343 0L13.8 8.544 15.214 9.96l9.9-9.9h-2.77zM32 0l-3.657 3.657 1.414 1.414L35.23 0h-2.83zM37.657 0l-8.543 8.543 1.415 1.415 9.9-9.9h-2.772zm-5.657 0l-5.486 5.486 1.415 1.415 7.9-7.9h-2.83zM28 0L25.172 2.828 26.586 4.243 28 2.828 29.414 4.242 30.828 2.828 28 0zM39.9 16.385l1.414-1.414L30 3.658 18.686 14.97l1.415 1.415 9.9-9.9 9.9 9.9zm-2.83 2.828l1.415-1.414L30 9.313 21.515 17.8l1.414 1.413 7.07-7.07 7.07 7.07zm-2.827 2.83l1.414-1.416L30 14.97l-5.657 5.657 1.414 1.415L30 17.8l4.243 4.242zm-2.83 2.827l1.415-1.414L30 20.626l-2.828 2.83 1.414 1.414L30 23.456l1.414 1.414zM56.87 59.414L58.284 58 30 29.716 1.716 58l1.414 1.414L30 32.544l26.87 26.87z' fill='%23ffffff' fill-opacity='0.08' fill-rule='evenodd'/%3E%3C/svg%3E");
  }

  .post-category {
    position: absolute;
    top: 16px;
    left: 16px;
    background: rgba(255, 255, 255, 0.95);
    color: #2563eb;
    padding: 8px 16px;
    border-radius: 30px;
    font-size: 0.85em;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(4px);
  }

  .post-date-badge {
    position: absolute;
    bottom: 16px;
    right: 16px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.85em;
    backdrop-filter: blur(4px);
  }

  .post-content {
    padding: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .post-title {
    font-size: 1.35em;
    color: #0f172a;
    margin: 0 0 12px 0;
    line-height: 1.4;
    font-weight: 700;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-excerpt {
    color: #64748b;
    font-size: 0.95em;
    line-height: 1.6;
    margin-bottom: 16px;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    margin: 16px 0;
    border-top: 1px solid #f1f5f9;
    font-size: 0.9em;
    color: #64748b;
  }

  .post-info {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .post-meta i {
    color: #3b82f6;
    margin-right: 6px;
  }

  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag {
    background: #f1f5f9;
    color: #475569;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.85em;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .tag:hover {
    background: #3b82f6;
    color: white;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .post-container {
      padding: 20px 16px;
    }

    .post-header-section {
      flex-direction: column;
      gap: 20px;
      align-items: stretch;
      text-align: center;
      padding: 0 0 20px 0;
    }

    .page-title {
      font-size: 2em;
    }

    .header-description {
      font-size: 1em;
    }

    .filter-select {
      width: 100%;
    }

    .post-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .post-card:hover {
      transform: translateY(-4px);
    }
  }
</style> 