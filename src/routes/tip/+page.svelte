<!-- +page.svelte -->
<script>
	import { isPast } from "date-fns";

    const tips = [
      {
        title: '관측 장소 선택',
        description: '인공조명이 적은 어두운 장소를 선택하세요. 시야를 가리는 장애물이 없는 개방된 공간이 좋습니다. 대기 조건이 안정적인 곳을 찾으세요.',
        image: 'path/to/image1.jpg',
        smalldes:'장소 게시판을 통해 본인에게 맞는 관측 장소를 찾으세요.'
      },
      {
        title: '장비 준비',
        description: '관측 대상과 목적에 맞는 적절한 망원경이나 쌍안경을 준비하세요. 삼각대를 사용하여 장비를 안정적으로 고정하세요. 필요한 경우 기타 액세서리(접안렌즈, 바로우렌즈, 필터 등)도 준비하세요.',
        image: 'path/to/image2.jpg',
        smalldes:'스마트폰과 삼각대만 있어도 충분히 좋은 사진을 찍을 수 있어요 !'

      },
      {
        title: '관측 계획 세우기',
        description: '관측하고자 하는 천체의 위치와 시간을 미리 파악하세요. 천문 관측 앱이나 소프트웨어를 활용하면 도움이 됩니다. 계절과 시간에 따른 별자리의 위치를 숙지하세요.',
        image: 'path/to/image3.jpg',
        smalldes:'별자리를 쉽게 찾고 싶다면 stellarium 앱을 통해 확인하면 편하답니다.'
      },
      {
        title: '시력 적응',
        description: '관측 전 약 20-30분 정도 어둠에 눈을 적응시키세요. 붉은색 조명을 사용하면 야간 시력 유지에 도움이 됩니다. 관측 중 스마트폰이나 밝은 조명을 피하세요.',
        image: 'path/to/image4.jpg',
        smalldes:'별을 보기 위한 장소에 도착했다면 휴대폰 밝기는 최대한 낮추고 가급적 휴대폰을 켜지 않도록 해주세요 !'
      },
      {
        title: '천체 찾기',
        description: '별자리를 이용하여 목표 천체의 위치를 파악하세요. 넓은 시야의 접안렌즈로 시작하여 점차 고배율로 바꾸어가며 관측하세요. 천체의 움직임을 고려하여 천천히 추적하세요.',

        smalldes:'3번과 같이 stellarium 앱을 통해 보고 싶은 천체를 쉽게 찾을 수 있어요.'
      },
      // {
      //   title: '기록 및 스케치',
      //   description: '관측일지를 작성하여 관측 내용을 기록하세요. 스케치를 통해 관측한 천체의 모습을 그려보세요. 사진 촬영을 하는 경우 장비의 설정을 적절히 조절하세요.',
      //   image: 'path/to/image6.jpg',
      //   smalldes:''
      // },
      // {
      //   title: '동료와 함께 관측',
      //   description: '천문 동호회나 클럽에 참여하여 경험을 공유하세요. 함께 관측하면 더 많은 것을 볼 수 있고 즐거움도 배가 됩니다. 서로의 지식과 경험을 나누며 배울 수 있습니다.',
      //   image: 'path/to/image7.jpg',
      //   smalldes:''
      // },
      {
        title: '인내심 갖기',
        description: '천체 관측은 인내심이 필요한 활동입니다. 구름이나 대기 조건 등 변수가 많으므로 여유를 가지세요. 한 번에 모든 것을 보려 하기보다는 천천히 즐기는 마음가짐이 중요합니다.',
        smalldes:''
      },
      {
        title: '안전 유의사항',
        description: '밤에는 추운 날씨에 대비하여 따뜻한 옷을 준비하세요. 어두운 곳에서 이동할 때는 헤드램프나 손전등을 사용하세요. 관측 장비를 다룰 때는 안전에 유의하세요.',

        smalldes:''
      },
      {
        title: '지속적인 학습',
        description: '천문학 서적이나 온라인 자료를 통해 꾸준히 공부하세요. 새로운 관측 기술과 정보를 습득하려 노력하세요. 모르는 것이 있다면 전문가나 동호인들에게 질문하세요.',

        smalldes:'여려번 시도해보고 경험하는게 제일 도움됩니다. 실패해도 좌절하지말고 꾸준히 도전하세요!'
      },
    ];
  </script>
  
  <svelte:head>
    <title>천문관측 팁</title>
  </svelte:head>
  
  <div class="container">
    <h1>천문관측을 위한 10가지 유용한 팁 🌠</h1>
  
    {#each tips as tip, index}
      <section class="sections">
        <h2>{index + 1}. {tip.title}</h2>
        <!-- <img src={tip.image} alt={tip.title} /> -->
        <p>{tip.description}</p>
        <div class="small-description">{tip.smalldes}</div>
      </section>
    {/each}
  </div>
  
  <style>
    .container {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      padding: 2rem;
    }
  
    section {
      margin-bottom: 3rem;
    }
  
    h1 {
      font-size: 2.5rem;
      color: #ffffff;
      text-align: center;
      margin-bottom: 2rem;
    }
  
    h2 {
      font-size: 1.8rem;
      color: #ffffff;
      margin-bottom: 1rem;
      margin-top:-5px;
    }
  .sections{
    padding: 20px;
    border: 1px solid 4b3f72;
    border-radius: 20px;
    backdrop-filter: blur(10px);
    background-color: rgba(92, 58, 112, 0.356);
    box-shadow: 4px 2px 10px;
  }
    /* img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1.5rem auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
   */
    p {
      font-size: 1.1rem;
      line-height: 1.6;
      color: #f0f0f0;
      text-align: justify;
    }
  .small-description
  {
    font-size: 0.9rem;
    line-height: 0.001;
    margin-bottom: 10px;
    /* text-align: justify; */
    color: #dbdbdbd3;

  }
    @media screen and (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }
  
      h2 {
        font-size: 1.5rem;
      }
  
      p {
        font-size: 1rem;
      }
    }
  </style>