# DeepSky

대한민국의 지역별 날씨와 관측지 데이터를 조합해 별·은하수 관측 가능성을 안내하는 SvelteKit 애플리케이션입니다.

## 주요 기능

- 기상청 예보 기반 시간대별 날씨 조회
- 광해·고도·개방감·접근성을 반영한 관측지 추천
- Gemini 기반 한국어 챗봇과 결정론적 장애 대응 답변
- MySQL/Prisma 기반 커뮤니티, 관측지, 날씨 캐시

## 로컬 실행

```powershell
npm install
Copy-Item .env.example .env
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev -- --host=127.0.0.1
```

`.env`의 `DATABASE_URL`과 외부 API 키는 실제 개발 환경에 맞게 설정합니다.

## 검증

```bash
npm run check
npm run build
```

MySQL 스키마와 운영 방법은 `MYSQL_SCHEMA.md`를 참고합니다.
