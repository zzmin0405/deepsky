<script>
    const observatories = [
      {
        name: '타임캡슐공원',
        description: '강원도 정선에 위치한 공원으로, 빛공해가 적고 고도가 높은 강원도라서 추천할 만한 장소입니다.',
        locate:'강원특별자치도 정선군 신동읍 엽기소나무길 518-23'
      },     
       {
        name: '안반데기',
        description: '강원도 강릉에 위치한 고랭지 농원으로, 부지가 넓고 차박도 가능해 밤새 별을 여유롭게 볼 수 있는 장소입니다.',
        locate:'강원특별자치도 강릉시 왕산면 안반데기길 428'
      },
      {
      name: '보현산천문대',
      description: '경상북도 영천시에 위치한 천문대로, 경상도에 살고 계시다면 추천할 만한 장소입니다.',
      locate:'경북 영천시 화북면 정각리 산 6-1'

    },
      {
        name: '토함산 수목경관숲',
        description: '경주시에 위치한 풍력발전소 부지로, 차로 쉽게 갈 수 있고 차박도 가능한 장소입니다.',
        locate:'경북 경주시 문무대왕면 장항리 산 599-6'
      },
      {
        name: '군위 화산 산성 전망대',
        description: '대구 군위군에 위치한 전망대로, 대구 근교에 위치해 이쁜 풍차와 함께 사진을 찍을 수 있습니다.',
        locate:'대구 군위군 삼국유사면 화북리 산 243'
      },
      {
      name: '영양 반딧불이천문대',
      description: '경상북도 영양군에 위치한 천문대로, 아시아 최초로 국제밤하늘보호공원으로 지정된 장소입니다.',
      locate:'경북 영양군 수비면 반딧불이로 129'
    },
    {name:'용계의 은행나무',
      description:'경상북도 안동과 청송군 사이에 있는 부지로, 주변에 광해가 없어 별 보기에 좋습니다.',
      locate:'경북 안동시 길안면 용계리 744-1'
    },
    {name:'육백마지기',
      description:'강원도 평창군에 있는 풍력발전단지로, 고도가 높아 미세먼지 걱정 없이 하늘을 볼 수 있는 장소입니다.',
      locate:'강원특별자치도 평창군 미탄면 청옥산길 583-76'
    },
    {name:'황매산',
      description:'경상남도 합천군에 위치한 산으로, 차로 산 정상까지 올라갈 수 있고 오토캠핑장이 있어 캠핑도 할 수 있는 장소입니다.',
      locate:'경남 합천군 가회면 둔내리 산 219'},
      {
        name:'달빛공원',
        description:'',
        locate:'경북 의성군 사곡면 양지리 산 64-2'
      },    
        {
        name:'운여해변',
        description:'',
        locate:'충남 태안군 고남면 장곡리 산 20-1'
      },
      {
        name:'한우산',
        description:'',
        locate:'경남 의령군 대의면 신전리 산 17'
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
        <h2>{observatory.name}</h2>
        <p>{observatory.description}</p>
        <p class="locate">{observatory.locate}</p>
      </div>
    {/each}
  </div>
  
  <style>
.title{
    color: rgb(234, 190, 255);
}
    .observatories {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .observatory h2{
      color: rgb(255, 255, 255);
    }
    .observatory p {
      color: rgb(217, 176, 255);
    }
    .observatory {
      background-color: #0000005e;
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
    /* .observatory img {
      width: 100%;
      height: auto;
      margin-bottom: 10px;
    } */
    .locate{
      font-size: 0.8rem;
    }
  </style>