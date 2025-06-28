#!/bin/bash

# 백엔드 실행 스크립트
# GitHub Actions와 로컬 환경에서 모두 작동하도록 개선

# 현재 디렉토리 확인 및 backend 디렉토리로 이동 (필요한 경우)
if [ "$(basename $(pwd))" != "backend" ]; then
    if [ -d "backend" ]; then
        cd backend
        echo "Changed to backend directory"
    else
        echo "Error: backend directory not found"
        exit 1
    fi
fi

# Python 명령어 확인 (python3 또는 python)
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "Error: Python not found"
    exit 1
fi

echo "Using Python command: $PYTHON_CMD"

# 의존성 설치
echo "Installing dependencies..."
pip install -r requirements.txt

# FastAPI 서버 시작
echo "Starting backend server on http://localhost:8080..."

# CI 환경 감지
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
    echo "Running in CI environment - starting server in background"
    # CI 환경에서는 백그라운드로 실행하고 PID 저장
    $PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8080 &
    SERVER_PID=$!
    echo "Server started with PID: $SERVER_PID"
    
    # 서버가 시작될 때까지 대기 (최대 30초)
    echo "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8080/ >/dev/null 2>&1; then
            echo "Server is ready!"
            exit 0
        fi
        echo "Waiting... ($i/30)"
        sleep 1
    done
    echo "Warning: Server may not be fully ready"
else
    # 로컬 환경에서는 포그라운드로 실행
    $PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload
fi
