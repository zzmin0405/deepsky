# DeepSky MySQL 스키마

DeepSky의 영속 데이터는 MySQL과 Prisma로 관리합니다. 스키마의 기준 파일은 `prisma/schema.prisma`이며, SQL을 직접 수정한 경우에도 Prisma 모델과 migration을 함께 갱신해야 합니다.

## 환경변수

`.env`에 MySQL 연결 문자열을 설정합니다.

```env
DATABASE_URL="mysql://deepsky:password@127.0.0.1:3306/deepsky"
```

실제 비밀번호가 포함된 `.env`는 커밋하지 않습니다. 저장소에는 `.env.example`만 유지합니다.

## 초기 구성

```sql
create database if not exists deepsky
  character set utf8mb4
  collate utf8mb4_unicode_ci;
```

데이터베이스 생성 후 다음 명령을 실행합니다.

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

개발 중 Prisma 모델을 변경할 때는 `npm run db:migrate`로 migration을 생성합니다.

## 테이블

- `posts`: 커뮤니티 게시글과 scrypt 비밀번호 해시
- `observing_places`: 관측지 위치, 광해, 고도, 개방감, 접근성 데이터
- `weather_cache`: 기상청 예보를 지역·예보일·예보시간 단위로 저장하는 2시간 캐시

관측지 테이블이 비어 있거나 MySQL 연결이 실패하면 `src/lib/server/observingPlaces.js`의 로컬 데이터로 추천 기능을 유지합니다. 날씨 캐시 저장이 실패하더라도 기상청 응답을 직접 사용해 챗봇 답변을 생성합니다.

## 오래된 날씨 캐시 정리

```sql
delete from weather_cache
where fetched_at < date_sub(now(), interval 7 day);
```
