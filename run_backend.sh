#!/bin/bash

# 백엔드 실행 스크립트
cd backend

# 의존성 설치
echo "Installing dependencies..."
pip install -r requirements.txt

# FastAPI 서버 시작 (uvicorn 사용)
echo "Starting backend server on http://localhost:8080..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload
