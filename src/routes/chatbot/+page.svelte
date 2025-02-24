<script>
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  
  let messages = [];
  let newMessage = '';
  let chatContainer;
  let isLoading = false;

  async function sendMessage() {
      if (!newMessage.trim() || isLoading) return;
      
      messages = [...messages, { text: newMessage, isUser: true }];
      const userMessage = newMessage;
      newMessage = '';
      isLoading = true;
      
      try {
          const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ message: userMessage })
          });
          
          const data = await response.json();
          
          if (data.error) {
              throw new Error(data.error);
          }
          
          messages = [...messages, { text: data.response, isUser: false }];
          
      } catch (error) {
          messages = [...messages, { 
              text: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 
              isUser: false 
          }];
      } finally {
          isLoading = false;
          scrollToBottom();
      }
  }

  function scrollToBottom() {
      if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
      }
  }

  function formatMarkdown(text) {
      return marked.parse(text);
  }

  onMount(() => {
      messages = [{
          text: '안녕하세요! 천문학 전문 AI 어시스턴트입니다. 별자리, 망원경, 천체 관측 등에 대해 궁금한 점을 물어보세요.',
          isUser: false
      }];
  });
</script>

<div class="page-container">
    <div class="chat-header">
        <h1>DeepSky 천문학 챗봇</h1>
        <p>천문학에 대한 모든 것을 물어보세요</p>
    </div>
    
    <div class="chat-container">
        <div class="chat-box" bind:this={chatContainer}>
            {#each messages as message}
                <div class="message {message.isUser ? 'user' : 'bot'}">
                    <div class="message-content">
                        {#if message.isUser}
                            {message.text}
                        {:else}
                            {@html formatMarkdown(message.text)}
                        {/if}
                    </div>
                </div>
            {/each}
            {#if isLoading}
                <div class="message bot">
                    <div class="message-content loading">
                        <span class="dot">.</span>
                        <span class="dot">.</span>
                        <span class="dot">.</span>
                    </div>
                </div>
            {/if}
        </div>
        
        <div class="input-container">
            <input
                type="text"
                bind:value={newMessage}
                placeholder="천문학에 대해 궁금한 점을 입력하세요..."
                on:keydown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isLoading}
            />
            <button on:click={sendMessage} disabled={isLoading}>
                {isLoading ? '처리중...' : '전송'}
            </button>
        </div>
    </div>
</div>

<style>
    .page-container {
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
    }

    .chat-header {
        text-align: center;
        margin-bottom: 20px;
        color: white;
    }

    .chat-header h1 {
        margin: 0;
        font-size: 2em;
        margin-bottom: 10px;
    }

    .chat-header p {
        margin: 0;
        opacity: 0.8;
    }

    .chat-container {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 15px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .chat-box {
        height: 500px;
        overflow-y: auto;
        padding: 20px;
        background: rgba(245, 245, 245, 0.9);
    }

    .message {
        margin-bottom: 10px;
        display: flex;
    }

    .message.user {
        justify-content: flex-end;
    }

    .message-content {
        max-width: 70%;
        padding: 12px 16px;
        border-radius: 15px;
        word-wrap: break-word;
        line-height: 1.4;
    }

    .user .message-content {
        background: #8e66d8;
        color: white;
    }

    .bot .message-content {
        background: white;
        color: #333;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .loading {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .dot {
        animation: loading 1.4s infinite;
        margin: 0 2px;
        font-size: 20px;
    }

    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes loading {
        0%, 80%, 100% { opacity: 0; }
        40% { opacity: 1; }
    }

    .input-container {
        display: flex;
        padding: 15px;
        background: white;
        border-top: 1px solid #eee;
    }

    input {
        flex: 1;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        margin-right: 10px;
        font-size: 16px;
        transition: border-color 0.3s ease;
    }

    input:focus {
        outline: none;
        border-color: #8e66d8;
    }

    input:disabled {
        background: #f5f5f5;
    }

    button {
        padding: 12px 24px;
        background: #8e66d8;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        min-width: 100px;
        transition: background 0.3s ease;
    }

    button:disabled {
        background: #b8a8d8;
        cursor: not-allowed;
    }

    button:hover:not(:disabled) {
        background: #7451c3;
    }

    @media (max-width: 600px) {
        .page-container {
            padding: 10px;
        }

        .chat-box {
            height: 400px;
        }

        .message-content {
            max-width: 85%;
        }
    }

    /* 마크다운 스타일링 */
    :global(.message.assistant pre) {
        background-color: #f4f4f4;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
    }

    :global(.message.assistant code) {
        background-color: #f4f4f4;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-family: monospace;
    }

    :global(.message.assistant p) {
        margin: 0.5rem 0;
    }

    :global(.message.assistant ul, .message.assistant ol) {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }

    :global(.message.assistant blockquote) {
        border-left: 4px solid #ddd;
        margin: 0.5rem 0;
        padding-left: 1rem;
        color: #666;
    }
</style>