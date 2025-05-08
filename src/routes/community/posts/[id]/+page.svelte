<script>
    export let data;

    function formatDate(date) {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 수정 여부를 확인하는 함수
    function isEdited(createdAt, updatedAt) {
        return new Date(updatedAt).getTime() > new Date(createdAt).getTime();
    }
</script>

<div class="container">
    <div class="post-header">
        <a href="/community/posts" class="back-button">
            <i class="fas fa-arrow-left"></i>
            목록으로
        </a>
        <div class="post-actions">
            {#if data.user && data.user.isAdmin}
                <div class="admin-actions">
                    <a href="/community/posts/{data.post.id}/edit" class="edit-button admin">
                        <i class="fas fa-edit"></i>
                        관리자 수정
                    </a>
                    <form action="?/deletePostByAdmin" method="POST" class="delete-form admin">
                        <button type="submit" class="delete-button admin">
                            <i class="fas fa-trash"></i>
                            관리자 삭제
                        </button>
                    </form>
                </div>
            {:else}
                <div class="user-actions">
                    <a href="/community/posts/{data.post.id}/edit" class="edit-button">
                        <i class="fas fa-edit"></i>
                        수정
                    </a>
                    <form action="?/deletePost" method="POST" class="delete-form">
                        <input type="password" name="password" placeholder="비밀번호" required class="password-input">
                        <button type="submit" class="delete-button">
                            <i class="fas fa-trash"></i>
                            삭제
                        </button>
                    </form>
                </div>
            {/if}
        </div>
    </div>

    <article class="post-content">
        <h1 class="post-title">{data.post.title}</h1>
        
        <div class="post-meta">
            <div class="author-info">
                <i class="fas fa-user-circle"></i>
                <span>{data.post.author}</span>
            </div>
            <div class="date-info">
                <span class="created-date">
                    <i class="fas fa-clock"></i>
                    작성: {formatDate(data.post.createdAt)}
                </span>
                {#if isEdited(data.post.createdAt, data.post.updatedAt)}
                    <span class="updated-date">
                        <i class="fas fa-edit"></i>
                        수정: {formatDate(data.post.updatedAt)}
                    </span>
                {/if}
            </div>
        </div>

        <div class="content">
            {data.post.content}
        </div>
    </article>
</div>

<style>
    .container {
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    .post-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 40px;
    }

    .back-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s ease;
    }

    .back-button:hover {
        color: #3b82f6;
    }

    .post-actions {
        display: flex;
        gap: 16px;
    }

    .admin-actions, .user-actions {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .edit-button, .delete-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 0.95em;
        font-weight: 500;
        text-decoration: none;
        transition: all 0.2s ease;
    }

    .edit-button {
        background: #f1f5f9;
        color: #475569;
    }

    .edit-button:hover {
        background: #e2e8f0;
        color: #1e293b;
    }

    .delete-button {
        background: #fee2e2;
        color: #ef4444;
        border: none;
        cursor: pointer;
    }

    .delete-button:hover {
        background: #fecaca;
    }

    .edit-button.admin {
        background: #e0f2fe;
        color: #0284c7;
    }

    .edit-button.admin:hover {
        background: #bae6fd;
    }

    .delete-button.admin {
        background: #fef2f2;
    }

    .delete-form {
        display: flex;
        gap: 8px;
    }

    .password-input {
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.95em;
        outline: none;
        transition: border-color 0.2s ease;
    }

    .password-input:focus {
        border-color: #3b82f6;
    }

    .post-content {
        background: white;
        border-radius: 16px;
        padding: 40px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .post-title {
        font-size: 2.5em;
        font-weight: 800;
        color: #1e293b;
        margin: 0 0 24px 0;
        line-height: 1.3;
        letter-spacing: -0.02em;
    }

    .post-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        padding-bottom: 24px;
        margin-bottom: 32px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 0.95em;
    }

    .author-info, .date-info {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .date-info {
        display: flex;
        gap: 16px;
    }

    .created-date, .updated-date {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #000000;
    }

    .post-meta i {
        color: #3b82f6;
    }

    .content {
        font-size: 1.1em;
        line-height: 1.8;
        color: #334155;
    }

    @media (max-width: 768px) {
        .container {
            padding: 20px 16px;
        }

        .post-header {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
            margin-bottom: 24px;
        }

        .post-actions {
            width: 100%;
        }

        .admin-actions, .user-actions {
            width: 100%;
            flex-wrap: wrap;
        }

        .edit-button, .delete-button, .delete-form {
            width: 100%;
            justify-content: center;
        }

        .password-input {
            flex: 1;
        }

        .post-content {
            padding: 24px;
            border-radius: 12px;
        }

        .post-title {
            font-size: 1.8em;
        }

        .post-meta {
            flex-direction: column;
            gap: 16px;
        }
    }
</style>