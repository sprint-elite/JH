# JH MAKER

커스텀 굿즈 쇼핑몰 · **v1.0**

Next.js 16 기반의 커스텀/기성품 통합 쇼핑몰입니다. Fabric.js 빌더로 에코백·파우치 등을 직접 디자인해 주문할 수 있고, 기성품은 장바구니·위시리스트·리뷰 흐름을 지원합니다.

## 주요 기능

### 고객
- 홈 · 카탈로그 · 상품 상세(PDP)
- 커스텀 빌더(Fabric.js) / 기성품 BUY NOW · 장바구니 · 위시리스트
- 회원가입 · 로그인 · 카카오/구글 OAuth
- 마이페이지(주문, 배송지, 쿠폰, 반품, 위시리스트)
- 2분컷 템플릿 · 제작 가이드 · 상황별 아이디어 콘텐츠
- 1:1 문의 · FAQ · 이용약관 · 개인정보처리방침

### 관리자 (`/admin`)
- 대시보드 · 상품(목업/상세/재고) · 주문 · 회원
- 카테고리 · 컬렉션 · 배너 · 쿠폰 · 리뷰
- 교환/반품 · 1:1 문의 · 소개글 CMS · 리포트 · 사이트 설정

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| DB | MySQL + Prisma |
| Auth | JWT 쿠키, bcrypt |
| UI | Tailwind CSS 4, Lucide |
| Builder | Fabric.js 7 |
| Process | PM2 (프로덕션) |

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수

```bash
cp .env.example .env
```

`.env`에서 `DATABASE_URL`, `AUTH_SECRET` 등을 설정합니다.

### 3. DB 마이그레이션 & 시드

```bash
npm run db:setup
```

시드 후 테스트 계정(개발용):
- 관리자: `admin@hmaker.com` / `JhAdmin!2026`
- 고객: 시드 로그 출력 참고

### 4. 개발 서버

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)

### 5. 프로덕션 빌드

```bash
npm run build
npm run start
# 또는 PM2
pm2 start npm --name jhproject -- start
```

## 프로젝트 구조

```
src/
├── app/              # App Router 페이지·API
├── components/       # UI (home, admin, builder, product …)
├── lib/              # DB, catalog, auth, pricing …
└── types/
prisma/
├── schema.prisma
├── seed.ts
└── seed-content.ts
```

## v1.0 범위

- 커스텀/기성품 카탈로그 및 주문 플로우(결제 연동 제외 운영 가능)
- 관리자 백오피스 전반
- 콘텐츠(가이드·템플릿·아이디어) 및 통합 admin 리스트 UI
- SEO 기초(sitemap, robots, 상품 메타)

## 알려진 제한 (v1.0)

- 이메일 알림: `src/lib/notify.ts` — 로그 스텁 (SMTP 미연동)
- 파일 업로드: 로컬 `public/uploads` (S3 미연동)
- 결제: 토스페이먼츠 SDK 준비, 실키·운영 연동은 별도 작업

## 라이선스

Private — [sprint-elite](https://github.com/sprint-elite)

## 버전

| 버전 | 날짜 | 설명 |
|------|------|------|
| **v1.0** | 2026-08-27 | 최초 릴리스 — 쇼핑몰·빌더·관리자 코어 |
