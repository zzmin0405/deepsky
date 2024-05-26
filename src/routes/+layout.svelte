<!-- src/routes/+layout.svelte -->
<script>
  import './styles.css';
  import {page} from '$app/stores';
  let isMainPage = false;
  $:{
    isMainPage= $page.url.pathname === '/';
  }
</script>

<svelte:head>
  <title>DeepSky - 전국 천문관측 가능 여부 조회</title>
  <meta name="description" content="DeepSky에서 대한민국 전역의 천문관측 가능 여부를 조회해보세요. 시간대별 상세 날씨 정보와 함께 천문관측에 적합한 날씨인지 확인할 수 있습니다." />
  <meta name="keywords" content="DeepSky, 천문관측, 날씨, 관측 가능 여부, 전국 날씨" />
  <meta name="author" content="DeepSky" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
</svelte:head>


<div class="app">
<div class="content">
  <header class="header">
    <nav>
      <h1><a href="/">DeepSky</a></h1>
      <ul class="header-ul">
        <li><a href="/community">자유게시판</a></li>
        <li><a href="/tip">팁 게시판</a></li>
        <li><a href="/contact">문의사항</a></li>
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

  .app{
    background-image: url('https://img.artguru-cdn.com/image/aigc/2cb03433b91fca7af8ade9dbc3aef563_1024_1024.webp');
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-position: no-repeat;
    background-size:cover;
    background-position: center;
    background-attachment: fixed;
    z-index: -1;
    min-height: 100vh;
  }
  :global(body) {
    margin: 0;
    padding: 0;
  }

  /* .background-image {
    background-color: black;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('https://img.artguru-cdn.com/image/aigc/2cb03433b91fca7af8ade9dbc3aef563_1024_1024.webp');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    z-index: -1;
  }
   */
.content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  color: rgb(211, 156, 241);
  padding: 20px 35px;
  background: linear-gradient(to right,#322336f1,#ca7af1c2);
  /* background-color: rgba(173, 173, 173, 0.322); */
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
}

.header a {
  color: rgb(100, 50, 150);
  text-decoration: none;
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
</style>