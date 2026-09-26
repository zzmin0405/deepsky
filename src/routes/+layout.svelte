<!-- src/routes/+layout.svelte -->
<script>
  import './styles.css';

  /** @type {{ children: import('svelte').Snippet }} */
  let { children } = $props();
  let showMenu = $state(false);

  // 모바일 메뉴가 열려 있는 동안에는 뒤 페이지가 스크롤되지 않게 막습니다.
  function setMenu(open) {
    showMenu = open;
    document.body.style.overflow = open ? 'hidden' : 'auto';
  }

  function toggleMenu(event) {
    event.stopPropagation();
    setMenu(!showMenu);
  }

  function closeMenu(event) {
    if (!event.target.closest('.header-ul') && !event.target.closest('.menu-toggle')) {
      setMenu(false);
    }
  }
</script>
  
<svelte:head>
  <title>DeepSky</title>
  <meta name="description" content="DeepSky에서 대한민국 전역의 천문관측 가능 여부를 조회해보세요. 시간대별 상세 날씨 정보와 함께 천문관측에 적합한 날씨인지 확인할 수 있습니다." />
  <meta name="keywords" content="DeepSky, 천문관측, 날씨, 관측 가능 여부, 전국 날씨" />
  <meta name="author" content="DeepSky" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
</svelte:head>
<svelte:window onclick={closeMenu} />

<div class="app" class:menu-open={showMenu}>
  <div class="content">
    <button class="header-ul-overlay" class:show={showMenu} type="button" aria-label="메뉴 닫기" onclick={() => setMenu(false)}></button>
    <header class="header">
      <nav>
        <a class="brand" href="/" onclick={() => setMenu(false)}>
          <span class="brand-mark">DS</span>
          <span class="brand-text">DeepSky</span>
        </a>
        <button
          class="menu-toggle"
          type="button"
          aria-label={showMenu ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={showMenu}
          aria-controls="main-navigation"
          onclick={toggleMenu}
        >
          <span class="menu-icon" class:open={showMenu} aria-hidden="true"></span>
        </button>
        <ul id="main-navigation" class="header-ul" class:show={showMenu}>
          <li><a href="/" onclick={() => setMenu(false)}>홈</a></li>
          <!-- <li><a on:click|preventDefault={() => handleNavigation('/community')}>자유게시판</a></li> -->
          <li><a href="/tip" onclick={() => setMenu(false)}>팁 게시판</a></li>
          <li><a href="/location" onclick={() => setMenu(false)}>장소 게시판</a></li>
          <li><a href="/chatbot" onclick={() => setMenu(false)}>챗봇</a></li>
        </ul>
      </nav>
    </header>
    <main>
      {@render children()}
    </main>
    <footer class="footer">
      &copy; 2024 DeepSky. All rights reserved. 때때로 버그가 있을 수 있습니다.
    </footer>
  </div>
</div>
  
<style>
.app {
  background:
    linear-gradient(rgba(8, 17, 31, 0.82), rgba(8, 17, 31, 0.88)),
    url('/deepsky-bg.JPG');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  width: 100%;
  min-height: 100vh;
  position: relative;
  cursor: default;
  color: var(--text);
  overflow-y: auto;
}
  
  :global(body) {
    margin: 0;
    padding: 0;
  }
  
  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow-y: auto;
  }
  
  .header {
    position: sticky;
    top: 0;
    z-index: 1000;
    height: 73px;
    box-sizing: border-box;
    padding: 14px clamp(16px, 4vw, 42px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(8, 17, 31, 0.82);
    backdrop-filter: blur(18px);
  }
  
  .header nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 44px;
    max-width: 1180px;
    margin: 0 auto;
    gap: 18px;
  }
  
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #f8fafc;
    text-decoration: none;
    font-weight: 800;
  }

  .brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 50%;
    background: linear-gradient(135deg, #60a5fa, #14b8a6);
    color: #ffffff;
    font-size: 0.78rem;
    letter-spacing: 0;
  }

  .brand-text {
    font-size: 1.15rem;
  }
  
  .header ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    display: flex;
  }
  
  .header li {
    margin: 0;
    padding: 0;
    transition: all 0.3s ease-in-out;
    border-radius: 8px;
    position: relative;
  }
  
  .header li a {
    display: block;
    color: #cbd5e1;
    text-decoration: none;
    font-size: 0.98rem;
    font-weight: 700;
    padding: 9px 12px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  .header li:hover a {
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.12);
  }
  
  .footer {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(8, 17, 31, 0.86);
    padding: 22px;
    text-align: center;
    font-size: 14px;
    color: #94a3b8;
  }
  
  main {
    flex: 1;
    padding: clamp(24px, 4vw, 48px) clamp(16px, 4vw, 32px);
    min-height: 400px;
  }
  
  .menu-toggle {
    display: none;
    width: 44px;
    height: 44px;
    padding: 0;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .menu-icon,
  .menu-icon::before,
  .menu-icon::after {
    display: block;
    width: 20px;
    height: 2px;
    border-radius: 999px;
    background: currentColor;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .menu-icon {
    position: relative;
  }

  .menu-icon::before,
  .menu-icon::after {
    position: absolute;
    left: 0;
    content: '';
  }

  .menu-icon::before {
    transform: translateY(-7px);
  }

  .menu-icon::after {
    transform: translateY(7px);
  }

  .menu-icon.open {
    background: transparent;
  }

  .menu-icon.open::before {
    transform: rotate(45deg);
  }

  .menu-icon.open::after {
    transform: rotate(-45deg);
  }
  
  .header-ul {
    display: flex;
    flex-direction: row;
    align-items: center;
    transition: none;
  }
  
  .app.menu-open {
    pointer-events: none;
  }
  
  .app.menu-open .header,
  .app.menu-open .header-ul,
  .app.menu-open .menu-toggle,
  .app.menu-open .header a,
  .app.menu-open .header li {
    pointer-events: auto;
  }
  
  .header-ul-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    display: none;
    pointer-events: auto;
  }
  
  .header-ul-overlay.show {
    display: block;
  }
  
  @media screen and (max-width: 768px) {
    .header-ul {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      box-sizing: border-box;
      width: 100%;
      background: rgba(8, 17, 31, 0.98);
      padding: 14px 20px 22px;
      z-index: 1001;
      box-shadow: 0 18px 30px rgba(0, 0, 0, 0.26);
      transform: translateY(calc(-100% - 73px));
      flex-direction: column;
    }
  
    .header-ul.show {
      transform: translateY(0);
    }
  
    .header li {
      margin: 2px 0;
      width: 100%;
      text-align: left;
      padding: 0;
    }
  
    .header li a {
      color: #cbd5e1;
      display: block;
      padding: 13px 14px;
      border-radius: 8px;
      transition: all 0.2s ease;
      font-weight: 600;
    }
  
    .header li:hover {
      background-color: transparent;
      transform: none;
    }
  
    .header li:hover a {
      color: #ffffff;
      background-color: rgba(255, 255, 255, 0.12);
      padding-left: 18px;
      text-shadow: none;
    }
  
    .menu-toggle {
      display: inline-flex;
      z-index: 1002;
      position: relative;
    }
  }
</style>
