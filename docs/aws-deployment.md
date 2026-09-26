# AWS 운영 배포 준비

DeepSky는 운영 환경에서 다음 구성을 기준으로 배포합니다.

```text
Route 53 / CloudFront(선택)
        ↓
Application Load Balancer
        ↓
ECS Fargate (SvelteKit Node 서버)
        ↓
RDS for MySQL
        ├─ Secrets Manager
        └─ ElastiCache for Redis(분산 캐시 도입 시)
```

ECS Fargate는 컨테이너 서버를 직접 관리하지 않고 실행할 수 있으며, ALB의 상태 확인 경로는 `/api/health`를 사용합니다. 데이터베이스 연결까지 확인하는 `/api/ready`는 배포 확인이나 readiness probe에 사용합니다.

## 애플리케이션 이미지

```powershell
docker build -t deepsky:local .
docker run --rm -p 3000:3000 --env-file .env deepsky:local
```

컨테이너는 `0.0.0.0:3000`에서 실행되며, 기본 실행 명령은 `node build`입니다.

## ECS 배포 순서

1. ECR에 `deepsky` 리포지토리를 생성합니다.
2. Docker 이미지를 빌드해 ECR에 push합니다.
3. ECS Fargate Task Definition에서 컨테이너 포트 `3000`을 등록합니다.
4. ALB Target Group의 Health check path를 `/api/health`로 설정합니다.
5. ECS Task에서 RDS 보안 그룹으로 TCP `3306`만 허용합니다.
6. ECS 서비스의 환경변수와 Secret을 등록합니다.
7. 서비스 업데이트 전에 Prisma migration을 한 번 실행합니다.

## 운영 환경변수

일반 환경변수:

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
ORIGIN=https://실제-도메인
```

민감한 값은 이미지나 Task Definition의 평문 환경변수에 넣지 않고 Secrets Manager에서 주입합니다.

```text
DATABASE_URL
GEMINI_API_KEY
OPENWEATHER_API_KEY
```

Secret을 교체한 뒤에는 새 값이 실행 중인 Task에 자동 반영되지 않으므로 ECS 서비스를 새로 배포해야 합니다.

## Prisma migration

운영 서버가 여러 개일 때 각 컨테이너가 동시에 migration을 실행하지 않도록, 배포 파이프라인에서 별도 migration Task를 먼저 실행합니다.

```powershell
docker build --target migration -t deepsky-migration .
docker run --rm --env-file .env deepsky-migration
```

마이그레이션 성공 후 애플리케이션 ECS 서비스를 새 이미지로 업데이트합니다.

## 운영 전 확인사항

- RDS는 private subnet에 배치하고 ECS 보안 그룹만 접근을 허용합니다.
- RDS 자동 백업과 보존 기간을 설정합니다.
- CloudWatch 로그와 알람을 연결합니다.
- ECS desired count는 최소 2개부터 검토합니다.
- 다중 인스턴스 운영 시 rate limit과 날씨 캐시는 ElastiCache/Redis로 교체합니다.
- `/api/health`는 프로세스 생존, `/api/ready`는 MySQL 연결 상태를 확인합니다.

## 참고

- [Amazon ECS on AWS Fargate 시작하기](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started-fargate.html)
- [ECS에서 Secrets Manager 값을 환경변수로 주입하기](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html)
- [Amazon RDS 자동 백업](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)
- [Amazon ElastiCache 시작하기](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/GettingStarted.html)
