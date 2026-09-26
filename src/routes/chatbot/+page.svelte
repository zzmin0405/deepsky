<script>
  import { onMount, tick } from 'svelte';
  import DOMPurify from 'dompurify';
  import { marked } from 'marked';
  let messages = [];
  let newMessage = '';
  let chatContainer;
  let isLoading = false;
  let browserLocation = null;
  let locationRequest = null;

  const suggestedQuestions = [
      '오늘 별 관측 장소 추천해줘',
      '내일 은하수 관측하기 좋은 지역 알려줘',
      '오늘 어둡고 탁 트인 곳 어디야?',
      '모레 강릉에서 별 관측 가능해?'
  ];

  const verdictLabels = {
      good: '관측 유리',
      mixed: '일부 시간 유리',
      bad: '관측 불리'
  };

  async function sendMessage(messageOverride = null) {
      const userMessage = typeof messageOverride === 'string' ? messageOverride : newMessage;
      if (!userMessage.trim() || isLoading) return;

      
      messages = [...messages, { text: userMessage, isUser: true }];
      newMessage = '';
      isLoading = true;
      
      try {
          await scrollToBottom();
          const userLocation = await getBrowserLocation();
          const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  message: userMessage,
                  userLocation
              })
          });
          
          const data = await response.json();
          
          if (!response.ok || data.error || typeof data.response !== 'string') {
              throw new Error(data.message || '챗봇 응답을 가져오지 못했습니다.');
          }
          
          messages = [
              ...messages,
              {
                  text: data.response,
                  isUser: false,
                  weatherCard: data.weatherCard,
                  recommendationCard: data.recommendationCard,
                  fallback: data.fallback
              }
          ];
          
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

  async function scrollToBottom() {
      await tick();
      if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
      }
  }

  function formatMarkdown(text) {
      return DOMPurify.sanitize(marked.parse(text, { async: false }), {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'del', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'a', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
          ALLOWED_ATTR: ['href', 'title']
      });
  }

  function formatTime(time) {
      return `${String(time).slice(0, 2)}시`;
  }

  function formatOptional(value, suffix = '') {
      return value === null || value === undefined ? '-' : `${value}${suffix}`;
  }

  function getBrowserLocation() {
      if (browserLocation) return Promise.resolve(browserLocation);
      const storedLocation = readStoredBrowserLocation();
      if (storedLocation) {
          browserLocation = storedLocation;
          return Promise.resolve(browserLocation);
      }
      if (locationRequest) return locationRequest;
      if (typeof window === 'undefined' || !navigator.geolocation) return Promise.resolve(null);

      locationRequest = new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  browserLocation = {
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude
                  };
                  resolve(browserLocation);
              },
              () => resolve(null),
              {
                  enableHighAccuracy: false,
                  timeout: 5000,
                  maximumAge: 5 * 60 * 1000
              }
          );
      });

      return locationRequest;
  }

  function readStoredBrowserLocation() {
      try {
          const stored = JSON.parse(localStorage.getItem('deepsky:user-location') || 'null');
          const isFresh = stored?.updatedAt && Date.now() - stored.updatedAt < 30 * 60 * 1000;
          const latitude = Number(stored?.latitude);
          const longitude = Number(stored?.longitude);
          if (!isFresh || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
          if (latitude < 33 || latitude > 39 || longitude < 124 || longitude > 132) return null;
          return { latitude, longitude };
      } catch {
          return null;
      }
  }

  onMount(() => {
      getBrowserLocation();
      messages = [{
          text: '안녕하세요! 천문학 전문 AI 어시스턴트입니다. "내일 강릉에서 별 보기 괜찮아?"처럼 지역과 시간을 넣어 물어보면 날씨 예보를 반영해서 답변해드릴게요.',
          isUser: false
      }];
  });
</script>

<div class="page-container">
    <div class="chat-header">
        <h1>DeepSky 천문학 챗봇</h1>
        <p>지역과 시간을 말하면 예보를 참고해 관측 가능성을 정리해드립니다.</p>
        <div class="suggested-questions" aria-label="추천 질문">
            {#each suggestedQuestions as question}
                <button
                    type="button"
                    class="suggestion-chip"
                    on:click={() => sendMessage(question)}
                    disabled={isLoading}
                >
                    {question}
                </button>
            {/each}
        </div>
    </div>
    
    <div class="chat-container">
        <div class="chat-box" bind:this={chatContainer}>
            {#each messages as message}
                <div class="message {message.isUser ? 'user' : 'bot'}">
                    <div class="message-content">
                        {#if message.isUser}
                            {message.text}
                        {:else}
                            {#if message.weatherCard}
                                <div class="weather-answer-card">
                                    <div class="weather-answer-top">
                                        <div>
                                            <div class="weather-answer-kicker">예보 기반 관측 판단</div>
                                            <div class="weather-answer-title">
                                                {message.weatherCard.location}
                                                <span>{message.weatherCard.targetDate}</span>
                                            </div>
                                        </div>
                                        <span class="verdict-badge {message.weatherCard.verdict}">
                                            {verdictLabels[message.weatherCard.verdict]}
                                        </span>
                                    </div>

                                    <p class="weather-answer-summary">{message.weatherCard.summary}</p>

                                    {#if message.weatherCard.recommendedTimes.length}
                                        <div class="recommended-times">
                                            <span>추천 시간</span>
                                            <div>
                                                {#each message.weatherCard.recommendedTimes as time}
                                                    <strong>{formatTime(time)}</strong>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}

                                    <div class="weather-answer-grid">
                                        {#each message.weatherCard.rows as row}
                                            <div class="weather-answer-row" class:observable={row.observable}>
                                                <div class="row-time">
                                                    <strong>{formatTime(row.time)}</strong>
                                                    <span>{row.observable ? '유리' : '불리'}</span>
                                                </div>
                                                <div class="row-metrics">
                                                    <span>하늘 {row.sky}</span>
                                                    <span>강수 {row.precipitation}</span>
                                                    <span>확률 {formatOptional(row.precipitationProbability, '%')}</span>
                                                    <span>습도 {formatOptional(row.humidity, '%')}</span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>

                                    {#if !message.weatherCard.matched}
                                        <p class="match-warning">지역명을 정확히 찾지 못해 기본 지역 기준으로 계산했어요.</p>
                                    {/if}
                                </div>
                            {/if}
                            {#if message.recommendationCard}
                                <div class="recommendation-card">
                                    <div class="recommendation-hero">
                                        <div>
                                            <div class="weather-answer-kicker">오늘의 관측지 추천</div>
                                            <div class="recommendation-title">
                                                {message.recommendationCard.targetDate}
                                                <span>{message.recommendationCard.candidateCount}개 관측 장소 비교</span>
                                            </div>
                                        </div>
                                        <span class="time-pill">
                                            {message.recommendationCard.targetTimes.map(formatTime).join(' · ')}
                                        </span>
                                    </div>

                                    <p class="weather-answer-summary">{message.recommendationCard.summary}</p>

                                    <div class="recommendation-list">
                                        {#each message.recommendationCard.locations as location}
                                            <article class="recommendation-item">
                                                <div class="recommendation-rank">
                                                    <strong>{location.rank}</strong>
                                                    <span>{verdictLabels[location.verdict]}</span>
                                                </div>
                                                <div class="recommendation-body">
                                                    <div class="recommendation-name-row">
                                                        <h3>{location.location}</h3>
                                                        <span class="score-badge">점수 {location.score}</span>
                                                    </div>
                                                    {#if location.weatherRegion}
                                                        <div class="weather-region">예보 기준: {location.weatherRegion}</div>
                                                    {/if}
                                                    {#if location.tags?.length}
                                                        <div class="place-tags">
                                                            {#each location.tags as tag}
                                                                <span>{tag}</span>
                                                            {/each}
                                                        </div>
                                                    {/if}
                                                    <div class="place-score-grid">
                                                        {#if location.distanceKm !== null && location.distanceKm !== undefined}
                                                            <span>거리 <strong>{location.distanceKm}km</strong></span>
                                                        {/if}
                                                        {#if location.elevationM}
                                                            <span>고도 <strong>{location.elevationM}m</strong></span>
                                                        {/if}
                                                        {#if location.lightPollutionScore}
                                                            <span>광해 <strong>{location.lightPollutionScore}/10</strong></span>
                                                        {/if}
                                                        {#if location.bortleClass}
                                                            <span>Bortle <strong>{location.bortleClass}</strong></span>
                                                        {/if}
                                                        {#if location.sqmMagArcsec2}
                                                            <span>SQM <strong>{location.sqmMagArcsec2}</strong></span>
                                                        {/if}
                                                        {#if location.opennessScore}
                                                            <span>개방감 <strong>{location.opennessScore}/10</strong></span>
                                                        {/if}
                                                        {#if location.accessScore}
                                                            <span>접근성 <strong>{location.accessScore}/10</strong></span>
                                                        {/if}
                                                    </div>
                                                    {#if location.description}
                                                        <p>{location.description}</p>
                                                    {/if}
                                                    <p>{location.summary}</p>

                                                    {#if location.recommendedTimes.length}
                                                        <div class="recommended-times compact">
                                                            <span>추천 시간</span>
                                                            <div>
                                                                {#each location.recommendedTimes as time}
                                                                    <strong>{formatTime(time)}</strong>
                                                                {/each}
                                                            </div>
                                                        </div>
                                                    {/if}

                                                    <div class="mini-weather-grid">
                                                        {#each location.rows as row}
                                                            <div class="mini-weather-row" class:observable={row.observable}>
                                                                <strong>{formatTime(row.time)}</strong>
                                                                <span>{row.sky}</span>
                                                                <span>강수 {formatOptional(row.precipitationProbability, '%')}</span>
                                                                <span>습도 {formatOptional(row.humidity, '%')}</span>
                                                            </div>
                                                        {/each}
                                                    </div>
                                                </div>
                                            </article>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
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
                placeholder="예: 오늘 제주 서귀포에서 은하수 관측 가능해?"
                aria-label="챗봇 질문"
                on:keydown={(e) => e.key === 'Enter' && !e.isComposing && sendMessage()}
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
        background:
            linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%);
    }

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

    .bot .message-content:has(.weather-answer-card) {
        width: min(100%, 680px);
        max-width: min(92%, 680px);
        padding: 12px;
    }

    .bot .message-content:has(.recommendation-card) {
        width: min(100%, 720px);
        max-width: min(94%, 720px);
        padding: 12px;
    }

    .weather-answer-card,
    .recommendation-card {
        display: grid;
        gap: 12px;
        margin-bottom: 12px;
    }

    .weather-answer-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        padding: 14px;
        border-radius: var(--radius);
        background: var(--surface-tint);
    }

    .weather-answer-kicker {
        margin-bottom: 4px;
        color: var(--primary-strong);
        font-size: 0.78rem;
        font-weight: 800;
    }

    .weather-answer-title {
        color: var(--text);
        font-size: 1.05rem;
        font-weight: 800;
    }

    .weather-answer-title span {
        display: block;
        margin-top: 2px;
        color: var(--muted);
        font-size: 0.86rem;
        font-weight: 700;
    }

    .verdict-badge {
        flex: 0 0 auto;
        padding: 7px 10px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 900;
        white-space: nowrap;
    }

    .verdict-badge.good {
        background: var(--accent-soft);
        color: var(--accent);
    }

    .verdict-badge.mixed {
        background: #fef3c7;
        color: #92400e;
    }

    .verdict-badge.bad {
        background: #fee2e2;
        color: var(--danger);
    }

    .weather-answer-summary {
        margin: 0;
        padding: 0 4px;
        color: var(--text);
        font-weight: 700;
    }

    .recommendation-hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        padding: 15px;
        border-radius: var(--radius);
        background: linear-gradient(135deg, #eef6ff 0%, #f0fdfa 100%);
        border: 1px solid #dbeafe;
    }

    .recommendation-title {
        color: var(--text);
        font-size: 1.08rem;
        font-weight: 900;
    }

    .recommendation-title span {
        display: block;
        margin-top: 2px;
        color: var(--muted);
        font-size: 0.84rem;
        font-weight: 800;
    }

    .time-pill {
        flex: 0 0 auto;
        max-width: 220px;
        padding: 8px 10px;
        border-radius: 999px;
        background: #ffffff;
        color: var(--primary-strong);
        border: 1px solid #bfdbfe;
        font-size: 0.78rem;
        font-weight: 900;
        line-height: 1.35;
        text-align: center;
    }

    .recommendation-list {
        display: grid;
        gap: 10px;
    }

    .recommendation-item {
        display: grid;
        grid-template-columns: 70px minmax(0, 1fr);
        gap: 12px;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: #ffffff;
    }

    .recommendation-rank {
        display: grid;
        align-content: start;
        justify-items: center;
        gap: 6px;
    }

    .recommendation-rank strong {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: var(--primary);
        color: #ffffff;
        font-size: 1.05rem;
        font-weight: 900;
    }

    .recommendation-rank span {
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 900;
        text-align: center;
    }

    .recommendation-body {
        min-width: 0;
        display: grid;
        gap: 9px;
    }

    .recommendation-name-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .recommendation-name-row h3 {
        margin: 0;
        color: var(--text);
        font-size: 1rem;
        line-height: 1.25;
    }

    .score-badge {
        flex: 0 0 auto;
        padding: 5px 8px;
        border-radius: 999px;
        background: #eff6ff;
        color: var(--primary-strong);
        font-size: 0.76rem;
        font-weight: 900;
    }

    .weather-region {
        width: fit-content;
        padding: 5px 8px;
        border-radius: 8px;
        background: #f8fafc;
        color: var(--muted);
        border: 1px solid var(--line);
        font-size: 0.76rem;
        font-weight: 900;
    }

    .place-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }

    .place-tags span {
        padding: 4px 7px;
        border-radius: 999px;
        background: #ecfeff;
        color: #0e7490;
        border: 1px solid #a5f3fc;
        font-size: 0.72rem;
        font-weight: 900;
    }

    .place-score-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px;
    }

    .place-score-grid span {
        display: grid;
        gap: 2px;
        padding: 7px 8px;
        border-radius: 8px;
        background: #f8fafc;
        color: var(--muted);
        border: 1px solid var(--line);
        font-size: 0.72rem;
        font-weight: 800;
    }

    .place-score-grid strong {
        color: var(--text);
        font-size: 0.78rem;
    }

    .recommendation-body p {
        margin: 0;
        color: var(--muted-strong);
        font-size: 0.86rem;
        font-weight: 700;
        line-height: 1.5;
    }

    .recommended-times {
        display: grid;
        gap: 8px;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: #ffffff;
    }

    .recommended-times > span {
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 800;
    }

    .recommended-times div {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .recommended-times strong {
        padding: 5px 9px;
        border-radius: 999px;
        background: var(--primary);
        color: #ffffff;
        font-size: 0.82rem;
    }

    .recommended-times.compact {
        padding: 9px;
    }

    .recommended-times.compact strong {
        padding: 4px 8px;
        font-size: 0.78rem;
    }

    .mini-weather-grid {
        display: grid;
        gap: 6px;
    }

    .mini-weather-row {
        display: grid;
        grid-template-columns: 44px repeat(3, minmax(0, 1fr));
        gap: 6px;
        align-items: center;
        padding: 7px 8px;
        border-radius: 8px;
        background: #f8fafc;
        color: var(--muted-strong);
        font-size: 0.76rem;
        font-weight: 800;
    }

    .mini-weather-row.observable {
        background: #ecfdf5;
        color: #047857;
    }

    .mini-weather-row strong {
        color: var(--text);
        font-size: 0.78rem;
    }

    .weather-answer-grid {
        display: grid;
        gap: 8px;
    }

    .weather-answer-row {
        display: grid;
        grid-template-columns: 86px minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        padding: 10px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: #ffffff;
    }

    .weather-answer-row.observable {
        border-color: rgba(15, 118, 110, 0.32);
        background: #f0fdfa;
    }

    .row-time {
        display: grid;
        gap: 2px;
    }

    .row-time strong {
        color: var(--text);
        font-size: 1rem;
    }

    .row-time span {
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 800;
    }

    .weather-answer-row.observable .row-time span {
        color: var(--accent);
    }

    .row-metrics {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 4px 8px;
        color: var(--muted-strong);
        font-size: 0.82rem;
        font-weight: 700;
    }

    .match-warning {
        margin: 0;
        padding: 10px 12px;
        border-radius: var(--radius);
        background: #fff7ed;
        color: #9a3412;
        font-size: 0.86rem;
        font-weight: 700;
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

        .message-content {
            max-width: 88%;
        }

        .bot .message-content:has(.weather-answer-card) {
            max-width: 100%;
        }

        .weather-answer-top {
            display: grid;
        }

        .recommendation-hero {
            display: grid;
        }

        .time-pill {
            max-width: none;
            text-align: left;
        }

        .recommendation-item {
            grid-template-columns: 1fr;
        }

        .recommendation-rank {
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }

        .weather-answer-row {
            grid-template-columns: 1fr;
        }

        .row-metrics {
            grid-template-columns: 1fr;
        }

        .mini-weather-row {
            grid-template-columns: 40px repeat(2, minmax(0, 1fr));
        }

        .mini-weather-row span:first-of-type {
            grid-column: span 2;
        }

        .place-score-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .input-container {
            flex-direction: column;
        }

        button {
            width: 100%;
        }
    }

    /* 마크다운 스타일링 */
    :global(.message.bot pre) {
        background-color: #f4f4f4;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
    }

    :global(.message.bot code) {
        background-color: #f4f4f4;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-family: monospace;
    }

    :global(.message.bot p) {
        margin: 0.5rem 0;
    }

    :global(.message.bot ul, .message.bot ol) {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }

    :global(.message.bot blockquote) {
        border-left: 4px solid #ddd;
        margin: 0.5rem 0;
        padding-left: 1rem;
        color: #666;
    }
</style>
