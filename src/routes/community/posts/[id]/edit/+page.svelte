<script>
    export let data;
    export let form;
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';

    function handleCancel() {
        goto(`/community/posts/${data.post.id}`);
    }

    let isSubmitting = false;

    // 입력값 검증 함수
    function validateInput(input, maxLength) {
        if (input.length > maxLength) {
            return false;
        }
        return true;
    }

    // 폼 제출 전 검증
    function handleSubmit(event) {
        const title = event.target.title.value;
        const content = event.target.content.value;

        if (!validateInput(title, 100)) {
            alert('제목은 100자 이하여야 합니다.');
            event.preventDefault();
            return;
        }

        if (!validateInput(content, 5000)) {
            alert('내용은 5000자 이하여야 합니다.');
            event.preventDefault();
            return;
        }
    }
</script>

<div class="edit-container">
    <h1 class="edit-title">글 수정</h1>

    <form 
        action="?/updatePost" 
        method="POST" 
        class="edit-form"
        on:submit={handleSubmit}
        use:enhance={() => {
            isSubmitting = true;
            return async ({ result }) => {
                isSubmitting = false;
                if (result.type === 'redirect') {
                    goto(result.location);
                }
            };
        }}
    >
        {#if form?.message}
            <div class="error-message">{form.message}</div>
        {/if}

        <div class="form-group">
            <label for="title">제목</label>
            <input 
                type="text" 
                id="title"
                name="title" 
                value={form?.values?.title ?? data.post.title} 
                required
                class="form-input"
                maxlength="100"
                placeholder="제목을 입력하세요 (최대 100자)"
            >
        </div>

        <div class="form-group">
            <label for="content">내용</label>
            <textarea 
                id="content"
                name="content" 
                required
                class="form-textarea"
                rows="10"
                maxlength="5000"
                placeholder="내용을 입력하세요 (최대 5000자)"
            >{form?.values?.content ?? data.post.content}</textarea>
        </div>

        <div class="form-group">
            <label for="password">비밀번호</label>
            <input 
                type="password" 
                id="password"
                name="password" 
                required
                class="form-input"
                placeholder="글 작성 시 입력한 비밀번호를 입력하세요"
            >
        </div>

        <div class="button-group">
            <button type="submit" class="submit-button" disabled={isSubmitting}>
                {isSubmitting ? '수정 중...' : '수정하기'}
            </button>
            <button type="button" class="cancel-button" on:click={handleCancel}>취소</button>
        </div>
    </form>
</div>

<style>
    .edit-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 2rem;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .error-message {
        padding: 0.75rem;
        margin-bottom: 1rem;
        background-color: #fee2e2;
        border: 1px solid #fecaca;
        border-radius: 4px;
        color: #dc2626;
        font-size: 0.875rem;
    }

    .edit-title {
        font-size: 1.8rem;
        color: #333;
        margin-bottom: 2rem;
        text-align: center;
    }

    .edit-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-group label {
        font-size: 1rem;
        color: #4a5568;
        font-weight: 500;
    }

    .form-input {
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s ease;
    }

    .form-textarea {
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 1rem;
        resize: vertical;
        min-height: 200px;
        transition: border-color 0.2s ease;
    }

    .form-input:focus, .form-textarea:focus {
        outline: none;
        border-color: #4a365a;
    }

    .button-group {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1rem;
    }

    .submit-button, .cancel-button {
        padding: 0.75rem 2rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .submit-button {
        background-color: #4a365a;
        color: white;
    }

    .submit-button:hover:not(:disabled) {
        background-color: #5a4272;
    }

    .submit-button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
    }

    .cancel-button {
        background-color: #e2e8f0;
        color: #4a5568;
    }

    .cancel-button:hover {
        background-color: #cbd5e0;
    }

    @media (max-width: 768px) {
        .edit-container {
            margin: 1rem;
            padding: 1rem;
        }

        .button-group {
            flex-direction: column;
        }

        .submit-button, .cancel-button {
            width: 100%;
        }
    }
</style>