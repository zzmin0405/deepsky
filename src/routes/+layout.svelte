<!-- src/routes/+layout.svelte -->
<script>
    import './styles.css';
  </script>
  
  <svelte:head>
    <title>DeepSky - 전국 천문관측 가능 여부 조회</title>
    <meta name="description" content="DeepSky에서 대한민국 전역의 천문관측 가능 여부를 조회해보세요. 시간대별 상세 날씨 정보와 함께 천문관측에 적합한 날씨인지 확인할 수 있습니다." />
    <meta name="keywords" content="DeepSky, 천문관측, 날씨, 관측 가능 여부, 전국 날씨" />
    <meta name="author" content="DeepSky" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
  </svelte:head>
  <div class="background-image"></div>
  <div class="content"><header class="header">
    <h1>DeepSky</h1>
  </header>
  <main>
    <slot />
  </main>
  
  <footer class="footer">
    &copy; 2024 DeepSky. All rights reserved.
  </footer>
  </div>
  <style>
  .background-image {
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

.content{
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
  .header {
    background-color: rgb(20, 20, 20);
    color: white;
    padding: 20px;
    text-align: center;
  }

  .header h1 {
    margin: 0;
    font-size: 24px;
  }

  .footer {
    background-color: rgba(244, 244, 244, 0.8);
    padding: 20px;
    text-align: center;
    font-size: 14px;
    color: #666;
    margin-top: auto;
  }

  main {
    flex: 1;
    padding: 20px;
  }
</style>