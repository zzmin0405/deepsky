<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- src/routes/+layout.svelte -->
<script>
    import './styles.css';
    let showMenu = false;
    
    function toggleMenu(event) {
      event.stopPropagation();
      showMenu = !showMenu;
      if (showMenu) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    }
  
    function closeMenu(event) {
      if (!event.target.closest('.header-ul') && !event.target.closest('.menu-toggle')) {
        showMenu = false;
        document.body.style.overflow = 'auto';
      }
    }
  
    function handleMenuItemClick(event) {
      event.stopPropagation();
      showMenu = false;
      document.body.style.overflow = 'auto';
    }

    function handleNavigation(path) {
      window.location.href = path;
    }
</script>
  
<svelte:head>
  <title>DeepSky - 전국 천문관측 가능 여부 조회 서비스</title>
  <meta name="description" content="DeepSky에서 대한민국 전역의 천문관측 가능 여부를 조회해보세요. 시간대별 상세 날씨 정보와 함께 천문관측에 적합한 날씨인지 확인할 수 있습니다." />
  <meta name="keywords" content="DeepSky, 천문관측, 날씨, 관측 가능 여부, 전국 날씨" />
  <meta name="author" content="DeepSky" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
</svelte:head>
<svelte:window on:click={closeMenu} />
  
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="header-ul-overlay" class:show={showMenu} on:click={() => { showMenu = false; document.body.style.overflow = 'auto'; }}></div>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="app" class:menu-open={showMenu}>
  <div class="content">
    <header class="header">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <nav>
        <!-- <h1><a href="/" on:click|preventDefault={() => handleNavigation('/')}>홈</a></h1> -->
        <div class="menu-toggle" on:click|preventDefault|stopPropagation={toggleMenu}>
          <i class="fas fa-bars"></i>
        </div>
        <ul class="header-ul" class:show={showMenu}>
          <div class="close-menu-toggle" on:click|preventDefault|stopPropagation={toggleMenu}>
            <i class="fas fa-times"></i>
          </div>
          <li><a on:click|preventDefault={() => handleNavigation('/')}>홈</a></li>
          <li><a on:click|preventDefault={() => handleNavigation('/community')}>자유게시판</a></li>
          <li><a on:click|preventDefault={() => handleNavigation('/tip')}>팁 게시판</a></li>
          <li><a on:click|preventDefault={() => handleNavigation('/location')}>장소 게시판</a></li>
          <li><a on:click|preventDefault={() => handleNavigation('/chatbot')}>챗봇</a></li>
          <li><a on:click|preventDefault={() => handleNavigation('/contact')}>문의사항</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <slot />
    </main>
    <footer class="footer">
      &copy; 2024 DeepSky. All rights reserved. 때때로 버그가 있을 수 있습니다.
    </footer>
  </div>
</div>
  
<style>
.app {
  /* background-image: url('/src/123.jpg'); */
  background-color: rgba(189, 231, 255, 0.904);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  width: 100%;
  min-height: 100vh;
  position: relative;  /* fixed에서 relative로 변경 */
  cursor: default;
  color: black;
  overflow-y: auto;  /* 스크롤 허용 */
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
    overflow-y: auto;  /* 스크롤 허용 */
  }
  
  .header {
    color: rgb(211, 156, 241);
    padding: 20px;
    background: linear-gradient(to right, #00000085, #bef7ff00);
  }
  
  .header nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .header ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    display: flex;
  }
  
  .header li {
    margin-left: 20px;
    padding: 10px;
    transition: all 0.3s ease-in-out;
    border-radius: 10px;
    position: relative;
    cursor: pointer;
  }
  
  .header li a {
    color: rgb(255, 255, 255);
    text-decoration: none;
    font-size: 1.3rem;
    padding: 5px 10px;
    transition: all 0.3s ease;
  }
  
  .header li:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  .header li:hover a {
    color: #474747;
    text-shadow: 0 0 10px rgba(129, 129, 129, 0.5);
  }
  
  .footer {
    background-color: rgba(0, 0, 0, 0.8);
    padding: 20px;
    text-align: center;
    font-size: 14px;
    color: #c9c9c9;
  }
  
  main {
    flex: 1;
    padding: 20px;
    min-height: 400px;
  }
  
  .menu-toggle {
    display: none;
    cursor: pointer;
    font-size: 24px;
    color: white;
  }
  
  .header-ul {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  
  .close-menu-toggle {
    display: none;
  }
  
  .app.menu-open {
    pointer-events: none;
  }
  
  .app.menu-open .header,
  .app.menu-open .header-ul,
  .app.menu-open .menu-toggle,
  .app.menu-open .close-menu-toggle,
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
    background-color: rgba(0, 0, 0, 0.5);
    z-index: -1;
    display: none;
    pointer-events: auto;
  }
  
  .header-ul-overlay.show {
    display: block;
  }
  
  @media screen and (max-width: 768px) {
    .header-ul {
      position: fixed;
      top: -100%;
      left: 0;
      width: 100%;
      background-color: #ffffff;
      padding: 60px 20px 20px;
      z-index: 1001;
      transition: top 0.3s ease-in-out;
      flex-direction: column;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  
    .header-ul.show {
      top: 0;
    }
  
    .header li {
      margin: 10px 0;
      width: 100%;
      text-align: center;
      padding: 0;
    }
  
    .header li a {
      color: #1e293b;
      display: block;
      padding: 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
      font-weight: 500;
    }
  
    .header li:hover {
      background-color: transparent;
      transform: none;
    }
  
    .header li:hover a {
      color: #6366f1;
      background-color: #f1f5f9;
      padding-left: 25px;
      text-shadow: none;
    }
  
    .menu-toggle {
      display: block;
      z-index: 1002;
      position: relative;
    }
  
    .close-menu-toggle {
      display: block;
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 24px;
      color: #1e293b;
      cursor: pointer;
      z-index: 1002;
    }
  }
</style>
  