#!/bin/bash

# 프론트엔드 실행 스크립트
cd frontend

# 의존성 설치
echo "Installing frontend dependencies..."
npm install

# Next.js 개발 서버 시작
echo "Starting frontend server on http://localhost:3000..."
npm run dev
