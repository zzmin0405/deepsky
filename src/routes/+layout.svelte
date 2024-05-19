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
  
  <header class="header">
    <h1>DeepSky</h1>
  </header>
  
  <main>
    <slot />
  </main>
  
  <footer class="footer">
    &copy; 2023 DeepSky. All rights reserved.
  </footer>