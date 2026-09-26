<script>
	import { onMount, tick } from 'svelte';
	import { createLocationResolver } from '$lib/browserLocation';
	import ChatMessage from '$lib/components/chat/ChatMessage.svelte';

	const SUGGESTED_QUESTIONS = [
		'오늘 별 관측 장소 추천해줘',
		'내일 은하수 관측하기 좋은 지역 알려줘',
		'오늘 어둡고 탁 트인 곳 어디야?',
		'모레 강릉에서 별 관측 가능해?'
	];
	const GREETING =
		'안녕하세요! 천문학 전문 AI 어시스턴트입니다. "내일 강릉에서 별 보기 괜찮아?"처럼 지역과 시간을 넣어 물어보면 날씨 예보를 반영해서 답변해드릴게요.';
	const ERROR_REPLY = '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

	// 메시지는 새 배열로 바꿔 끼우기만 하므로 raw state로 둡니다.
	let messages = $state.raw([]);
	let newMessage = $state('');
	let isLoading = $state(false);
	let chatBox;
	let nextMessageId = 0;

	const resolveLocation = createLocationResolver();

	function appendMessage(message) {
		messages = [...messages, { id: nextMessageId++, ...message }];
	}

	async function scrollToBottom() {
		await tick();
		if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
	}

	async function sendMessage(text = newMessage) {
		if (!text.trim() || isLoading) return;

		appendMessage({ text, isUser: true });
		newMessage = '';
		isLoading = true;

		try {
			await scrollToBottom();
			const userLocation = await resolveLocation();
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, userLocation })
			});
			const data = await response.json().catch(() => ({}));

			if (!response.ok || data.error || typeof data.response !== 'string') {
				throw new Error(data.message || '챗봇 응답을 가져오지 못했습니다.');
			}

			appendMessage({
				text: data.response,
				isUser: false,
				weatherCard: data.weatherCard,
				recommendationCard: data.recommendationCard
			});
		} catch (error) {
			console.error('Chat request failed:', error);
			appendMessage({ text: ERROR_REPLY, isUser: false });
		} finally {
			isLoading = false;
			scrollToBottom();
		}
	}

	function handleKeydown(event) {
		// 한글 조합 중 Enter는 글자 확정이므로 전송하지 않습니다.
		if (event.key === 'Enter' && !event.isComposing) sendMessage();
	}

	onMount(() => {
		// 첫 질문 전에 위치 권한을 미리 받아 두면 "근처" 질문에 바로 답할 수 있습니다.
		resolveLocation();
		appendMessage({ text: GREETING, isUser: false });
	});
</script>

<div class="page-container">
	<div class="chat-header">
		<h1>DeepSky 천문학 챗봇</h1>
		<p>지역과 시간을 말하면 예보를 참고해 관측 가능성을 정리해드립니다.</p>
		<div class="suggested-questions" aria-label="추천 질문">
			{#each SUGGESTED_QUESTIONS as question (question)}
				<button
					type="button"
					class="suggestion-chip"
					onclick={() => sendMessage(question)}
					disabled={isLoading}
				>
					{question}
				</button>
			{/each}
		</div>
	</div>

	<div class="chat-container">
		<div class="chat-box" bind:this={chatBox}>
			{#each messages as message (message.id)}
				<ChatMessage {message} />
			{/each}
			{#if isLoading}
				<ChatMessage pending />
			{/if}
		</div>

		<div class="input-container">
			<input
				type="text"
				bind:value={newMessage}
				placeholder="예: 오늘 제주 서귀포에서 은하수 관측 가능해?"
				aria-label="챗봇 질문"
				onkeydown={handleKeydown}
				disabled={isLoading}
			/>
			<button type="button" onclick={() => sendMessage()} disabled={isLoading}>
				{isLoading ? '처리중...' : '전송'}
			</button>
		</div>
	</div>
</div>

<style>
	.page-container {
		width: min(920px, 100%);
		padding: 0;
		margin: 0 auto;
	}

	.chat-header {
		text-align: center;
		margin-bottom: 22px;
		color: #ffffff;
	}

	.chat-header h1 {
		margin: 0;
		font-size: clamp(2rem, 4vw, 3rem);
		line-height: 1.15;
		margin-bottom: 10px;
		font-weight: 800;
	}

	.chat-header p {
		max-width: 620px;
		margin: 0 auto;
		color: #cbd5e1;
		line-height: 1.65;
	}

	.suggested-questions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin: 18px auto 0;
		max-width: 760px;
	}

	.suggestion-chip {
		min-width: 0;
		width: auto;
		padding: 9px 12px;
		border: 1px solid rgba(255, 255, 255, 0.28);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.12);
		color: #ffffff;
		font-size: 0.88rem;
		font-weight: 800;
		box-shadow: none;
		backdrop-filter: blur(10px);
	}

	.suggestion-chip:hover:not(:disabled) {
		border-color: rgba(255, 255, 255, 0.62);
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	.chat-container {
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: #ffffff;
		box-shadow: var(--shadow);
	}

	.chat-box {
		height: min(58vh, 560px);
		min-height: 420px;
		overflow-y: auto;
		padding: 22px;
		background: linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%);
	}

	.input-container {
		display: flex;
		gap: 10px;
		padding: 16px;
		background: white;
		border-top: 1px solid var(--line);
	}

	input {
		flex: 1;
		min-width: 0;
		padding: 0 14px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		margin-right: 0;
		font-size: 16px;
		transition: border-color 0.3s ease;
	}

	input:focus {
		outline: none;
		border-color: var(--primary);
	}

	input:disabled {
		background: #f5f5f5;
	}

	button {
		min-width: 100px;
		padding: 0 20px;
	}

	button:disabled {
		background: var(--primary);
	}

	button:hover:not(:disabled) {
		background: var(--primary-strong);
	}

	@media (max-width: 600px) {
		.chat-box {
			min-height: 390px;
			padding: 16px;
		}

		.input-container {
			flex-direction: column;
		}

		button {
			width: 100%;
		}
	}
</style>
