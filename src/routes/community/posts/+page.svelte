<script>
    export let data;

    function formatDate(date) {
        return new Date(date).toLocaleString('ko-KR');
    }
</script>

<div class="container">
    <div class="header-section">
        <div class="header-content">
            <h1 class="page-title">커뮤니티</h1>
            <p class="header-description">다른 사용자들과 자유롭게 이야기를 나누어보세요</p>
        </div>
        <a href="/community/posts/create" class="create-post-btn">
            <i class="fas fa-plus"></i>
            새 글 작성
        </a>
    </div>

    <div class="navigation-bar">
        <a href="/community/posts" class="nav-link active">전체 글</a>
    </div>

    {#if data.databaseUnavailable}
        <p class="database-notice">데이터베이스에 연결할 수 없어 게시글을 불러오지 못했습니다.</p>
    {/if}

    <div class="posts-container">
        {#each data.posts as post}
            <a href="/community/posts/{post.id}" class="post-card">
                <div class="post-content">
                    <h2 class="post-title">{post.title}</h2>
                    {#if post.excerpt}
                        <p class="post-excerpt">{post.excerpt}</p>
                    {/if}
                    <div class="post-meta">
                        <span class="post-author">
                            <i class="fas fa-user"></i>
                            {post.author || '익명'}
                        </span>
                        <span class="post-date">
                            <i class="fas fa-clock"></i>
                            {formatDate(post.createdAt)}
                        </span>
                        {#if post.comments_count}
                            <span class="post-comments">
                                <i class="fas fa-comment"></i>
                                {post.comments_count}
                            </span>
                        {/if}
                    </div>
                </div>
            </a>
        {/each}
    </div>
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    .header-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
    }

    .header-content {
        flex: 1;
    }

    .page-title {
        font-size: 2.5em;
        font-weight: 800;
        margin: 0;
        background: linear-gradient(135deg, #1e293b, #334155);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.02em;
    }

    .header-description {
        color: #64748b;
        margin: 8px 0 0 0;
        font-size: 1.1em;
    }

    .create-post-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #3b82f6;
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    .create-post-btn:hover {
        background: #2563eb;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
    }

    .navigation-bar {
        display: flex;
        gap: 24px;
        margin-bottom: 32px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 16px;
    }

    .nav-link {
        color: #64748b;
        text-decoration: none;
        font-weight: 600;
        padding: 8px 0;
        position: relative;
        transition: color 0.2s ease;
    }

    .nav-link:hover {
        color: #3b82f6;
    }

    .nav-link.active {
        color: #3b82f6;
    }

    .nav-link.active::after {
        content: '';
        position: absolute;
        bottom: -17px;
        left: 0;
        right: 0;
        height: 2px;
        background: #3b82f6;
        border-radius: 2px;
    }

    .posts-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .database-notice {
        padding: 14px 16px;
        border: 1px solid #fed7aa;
        border-radius: 10px;
        background: #fff7ed;
        color: #9a3412;
    }

    .post-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        text-decoration: none;
        transition: all 0.2s ease;
    }

    .post-card:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .post-title {
        font-size: 1.25em;
        color: #0f172a;
        margin: 0 0 8px 0;
        font-weight: 600;
    }

    .post-excerpt {
        color: #64748b;
        font-size: 0.95em;
        margin: 0 0 16px 0;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .post-meta {
        display: flex;
        gap: 16px;
        color: #64748b;
        font-size: 0.9em;
    }

    .post-meta span {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .post-meta i {
        color: #3b82f6;
    }

    @media (max-width: 768px) {
        .container {
            padding: 20px 16px;
        }

        .header-section {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            text-align: center;
        }

        .page-title {
            font-size: 2em;
        }

        .create-post-btn {
            width: 100%;
            justify-content: center;
        }

        .navigation-bar {
            gap: 16px;
            overflow-x: auto;
            padding-bottom: 12px;
            margin-bottom: 24px;
        }

        .post-card {
            padding: 16px;
        }
    }
</style>
