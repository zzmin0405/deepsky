<script>
    import { untrack } from 'svelte';

    let { form } = $props();

    // 서버 검증에 실패해 다시 그려질 때 입력했던 본문을 되살립니다. 이후에는 사용자가 입력한 값을 따릅니다.
    let content = $state(untrack(() => form?.values?.content ?? ''));
    let charCount = $derived(content.length);
    let isSubmitting = $state(false);
</script>

<div class="container">
    <div class="form-header">
        <a href="/community/posts" class="back-button">
            <i class="fas fa-arrow-left"></i>
            목록으로
        </a>
        <h1 class="page-title">새 글 작성</h1>
    </div>

    <!-- 제출 중에는 버튼을 잠가 중복 작성을 막습니다. -->
    <form action="?/createPost" method="POST" class="post-form" onsubmit={() => (isSubmitting = true)}>
        {#if form?.message}
            <div class="error-message">{form.message}</div>
        {/if}

        <div class="form-group">
            <label class="form-label">
                <span class="label-text">제목</span>
                <input 
                    type="text" 
                    name="title" 
                    class="form-input"
                    placeholder="제목을 입력해주세요" 
                    maxlength="100"
                    value={form?.values?.title ?? ''}
                    required
                >
            </label>
        </div>

        <div class="form-group">
            <label class="form-label">
                <span class="label-text">내용</span>
                <textarea 
                    name="content" 
                    class="form-textarea"
                    placeholder="내용을 입력해주세요" 
                    maxlength="5000"
                    bind:value={content}
                    required
                ></textarea>
                <span class="char-counter {charCount >= 5000 ? 'limit' : ''}">{charCount}/5000자</span>
            </label>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label class="form-label">
                    <span class="label-text">작성자</span>
                    <input 
                        type="text" 
                        name="author" 
                        class="form-input"
                        placeholder="작성자명을 입력해주세요" 
                        maxlength="50"
                        value={form?.values?.author ?? ''}
                        required
                    >
                </label>
            </div>

            <div class="form-group">
                <label class="form-label">
                    <span class="label-text">비밀번호</span>
                    <input 
                        type="password" 
                        name="password" 
                        class="form-input"
                        placeholder="4자리 이상 입력해주세요" 
                        minlength="4" 
                        required
                    >
                </label>
            </div>
        </div>

        <div class="form-actions">
            <button type="submit" class="submit-button" disabled={isSubmitting}>
                <i class="fas fa-paper-plane"></i>
                작성하기
            </button>
        </div>
    </form>
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    .error-message {
        padding: 12px 14px;
        border: 1px solid #fecaca;
        border-radius: 8px;
        background: #fef2f2;
        color: #b91c1c;
    }

    .form-header {
        display: flex;
        align-items: center;
        gap: 24px;
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

    .page-title {
        font-size: 2em;
        font-weight: 800;
        color: #1e293b;
        margin: 0;
        letter-spacing: -0.02em;
    }

    .post-form {
        background: white;
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .form-group {
        margin-bottom: 24px;
        width: 100%;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 32px;
        width: 100%;
    }

    .form-label {
        display: block;
        width: 100%;
    }

    .label-text {
        display: block;
        font-size: 0.95em;
        font-weight: 600;
        color: #475569;
        margin-bottom: 8px;
    }

    .form-input, .form-textarea {
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 12px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1em;
        color: #000000;
        transition: all 0.2s ease;
        outline: none;
        background: #ffffff;
    }

    .form-textarea {
        resize: none;
        height: 500px;
        min-height: 500px;
        max-height: 500px;
        line-height: 1.6;
        overflow-y: auto;
        color: #000000;
        background: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 16px;
    }

    .form-input::placeholder, .form-textarea::placeholder {
        color: #94a3b8;
    }

    .form-input:hover, .form-textarea:hover {
        border-color: #cbd5e1;
        background: #ffffff;
    }

    .form-input:focus, .form-textarea:focus {
        border-color: #3b82f6;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
    }

    .submit-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 1em;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .submit-button:hover {
        background: #2563eb;
        transform: translateY(-1px);
    }

    .submit-button:disabled {
        background: #94a3b8;
        cursor: not-allowed;
        transform: none;
    }

    @media (max-width: 768px) {
        .container {
            padding: 20px 16px;
        }

        .form-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 24px;
        }

        .post-form {
            padding: 24px;
            border-radius: 12px;
        }

        .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-bottom: 24px;
        }

        .submit-button {
            width: 100%;
            justify-content: center;
        }
    }

    .char-counter {
        display: block;
        text-align: right;
        font-size: 0.9em;
        color: #64748b;
        margin-top: 8px;
    }

    .char-counter.limit {
        color: #ef4444;
        font-weight: 600;
    }
</style>
