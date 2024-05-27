<script>
    const observatories = [
      {
        // name: '한라산국립공원 성판악 탐방안내소',
        // description: '제주도 한라산 성판악 부근에 위치한 천문대로, 고도가 높고 light pollution이 적어 천체 관측에 최적의 장소입니다.',
        // image: '/path/to/hallasan.jpg',
      },
      {
      name: '보현산천문대',
      description: '경상북도 영천시에 위치한 천문대로, 큰 구경의 망원경을 보유하고 있어 성능이 우수합니다.',
      image: '/path/to/bohyunsan.jpg',
    },
      {
        name: '소백산천문대',
        description: '경상북도 영주시 소백산 자락에 위치한 천문대로, 천체 관측 외에도 음악회 등 다양한 행사가 열립니다.',
        image: '/path/to/sobaeksan.jpg',
      },
      {
        // name: '미원천문대',
        // description: '경기도 남양주시에 위치한 사설 천문대로, 도심 근교에 위치해 접근성이 좋습니다.',
        // image: '/path/to/miwon.jpg',
      },
      {
      name: '경북 청송 주왕산 국립공원',
      description: '경상북도 청송군에 위치한 국립공원으로, 밤하늘이 잘 보이는 전망대와 캠핑장이 마련되어 있습니다.',
      image: '/path/to/juwangsan.jpg',
    },
    ];
  </script>
  
  <svelte:head>
    <title>한국의 유명 천문관측 장소</title>
  </svelte:head>
  
  <h1 class="title">한국의 유명 천문관측 장소</h1>
  
  <div class="observatories">
    {#each observatories as observatory}
      <div class="observatory">
        <img src={observatory.image} alt={observatory.name} />
        <h2>{observatory.name}</h2>
        <p>{observatory.description}</p>
      </div>
    {/each}
  </div>
  
  <style>
.title{
    color: rgb(170, 114, 223);
}
    .observatories {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .observatory {
        background-color: #9672a028;
      border: 1px solid #775580;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      box-shadow: 4px 2px 10px;
      backdrop-filter: blur(10px);
    transition: all 0.5s ease-in-out;
    }
    .observatory:hover {
        transform:scale(1.05);
    }
    .observatory img {
      width: 100%;
      height: auto;
      margin-bottom: 10px;
    }
  </style>