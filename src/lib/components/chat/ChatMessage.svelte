<script>
	import { renderMarkdown } from '$lib/markdown';
	import RecommendationCard from './RecommendationCard.svelte';
	import WeatherAnswerCard from './WeatherAnswerCard.svelte';

	/**
	 * 채팅 말풍선 하나입니다. pending이면 답변을 기다리는 표시를 보여줍니다.
	 * @type {{
	 *   message?: { text: string, isUser: boolean, weatherCard?: object | null, recommendationCard?: object | null } | null,
	 *   pending?: boolean
	 * }}
	 */
	let { message = null, pending = false } = $props();
</script>

{#if pending}
	<div class="message bot">
		<div class="message-content loading" role="status" aria-label="답변을 준비하고 있어요">
			<span class="dot">.</span>
			<span class="dot">.</span>
			<span class="dot">.</span>
		</div>
	</div>
{:else if message}
	<div class="message" class:user={message.isUser} class:bot={!message.isUser}>
		<div
			class="message-content"
			class:wide={Boolean(message.weatherCard)}
			class:wider={Boolean(message.recommendationCard)}
		>
			{#if message.isUser}
				{message.text}
			{:else}
				{#if message.weatherCard}
					<WeatherAnswerCard card={message.weatherCard} />
				{/if}
				{#if message.recommendationCard}
					<RecommendationCard card={message.recommendationCard} />
				{/if}
				<!-- renderMarkdown은 DOMPurify로 허용한 태그만 남긴 HTML을 돌려줍니다. -->
				<div class="markdown">{@html renderMarkdown(message.text)}</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.message {
		margin-bottom: 14px;
		display: flex;
	}

	.message.user {
		justify-content: flex-end;
	}

	.message-content {
		max-width: min(76%, 640px);
		padding: 13px 16px;
		border-radius: var(--radius);
		word-wrap: break-word;
		line-height: 1.62;
		font-size: 0.97rem;
	}

	.user .message-content {
		background: var(--primary);
		color: white;
		border-bottom-right-radius: 3px;
		box-shadow: 0 10px 26px rgba(37, 99, 235, 0.2);
	}

	.bot .message-content {
		background: white;
		color: var(--text);
		border: 1px solid var(--line);
		border-bottom-left-radius: 3px;
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
	}

	.bot .message-content.wide {
		width: min(100%, 680px);
		max-width: min(92%, 680px);
		padding: 12px;
	}

	.bot .message-content.wider {
		width: min(100%, 720px);
		max-width: min(94%, 720px);
		padding: 12px;
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

	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes loading {
		0%,
		80%,
		100% {
			opacity: 0;
		}
		40% {
			opacity: 1;
		}
	}

	/* LLM 답변 마크다운 */
	.markdown :global(pre) {
		background-color: #f4f4f4;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
	}

	.markdown :global(code) {
		background-color: #f4f4f4;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: monospace;
	}

	.markdown :global(p) {
		margin: 0.5rem 0;
	}

	.markdown :global(ul),
	.markdown :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.markdown :global(blockquote) {
		border-left: 4px solid #ddd;
		margin: 0.5rem 0;
		padding-left: 1rem;
		color: #666;
	}

	@media (max-width: 600px) {
		.message-content {
			max-width: 88%;
		}

		.bot .message-content.wide {
			max-width: 100%;
		}
	}
</style>
