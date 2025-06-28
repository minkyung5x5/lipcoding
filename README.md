# 멘토-멘티 매칭 앱

멘토와 멘티를 연결하는 웹 애플리케이션입니다.

## 기술 스택

### Backend
- **FastAPI**: Python 웹 프레임워크
- **SQLAlchemy**: ORM
- **SQLite**: 데이터베이스
- **JWT**: 인증
- **Pillow**: 이미지 처리

### Frontend
- **Next.js 14**: React 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **React Hook Form**: 폼 관리
- **Axios**: HTTP 클라이언트

## 실행 방법

### 1. 백엔드 실행
```bash
cd backend
pip install -r requirements.txt
python3 main.py
```

또는 스크립트 사용:
```bash
./run_backend.sh
```

### 2. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

또는 스크립트 사용:
```bash
./run_frontend.sh
```

## 접속 정보

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/docs
- **OpenAPI JSON**: http://localhost:8080/openapi.json

## 주요 기능

### 인증 시스템
- 회원가입 (멘토/멘티 선택)
- JWT 기반 로그인/로그아웃
- 역할 기반 접근 제어

### 프로필 관리
- 프로필 이미지 업로드 (Base64)
- 기본 정보 수정
- 멘토: 기술 스택 관리

### 멘토 매칭
- 멘토 목록 조회 (멘티 전용)
- 기술 스택으로 검색/필터링
- 이름/기술순 정렬

### 매칭 요청 시스템
- 매칭 요청 보내기 (멘티)
- 요청 수락/거절 (멘토)
- 요청 취소 (멘티)
- 요청 상태 관리

## API 문서

- Swagger UI: http://localhost:8080/docs
- OpenAPI Specification: http://localhost:8080/openapi.json

## 데이터베이스

SQLite 데이터베이스가 자동으로 생성됩니다 (`mentor_mentee.db`)

## 보안 기능

- SQL 인젝션 방지 (SQLAlchemy ORM)
- XSS 방지 (React 기본 보호)
- JWT 토큰 기반 인증
- 파일 업로드 검증
- CORS 설정