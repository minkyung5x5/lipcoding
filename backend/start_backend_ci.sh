#!/bin/bash

# GitHub Actions용 백엔드 실행 스크립트
set -e  # 에러 발생 시 스크립트 중단

echo "=== Starting Backend Server for GitHub Actions ==="

# 현재 위치 확인
echo "Current directory: $(pwd)"
ls -la

# backend 디렉토리로 이동
if [ -d "backend" ]; then
    cd backend
    echo "Changed to backend directory"
    ls -la
else
    echo "Error: backend directory not found"
    exit 1
fi

# Python 버전 확인
echo "Python version:"
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    python3 --version
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    python --version
else
    echo "Error: Python not found"
    exit 1
fi

# pip 업그레이드
echo "Upgrading pip..."
$PYTHON_CMD -m pip install --upgrade pip

# 의존성 설치
echo "Installing dependencies..."
pip install -r requirements.txt

# 서버 시작 전 포트 확인
echo "Checking if port 8080 is available..."
if lsof -i:8080 >/dev/null 2>&1; then
    echo "Port 8080 is already in use, killing existing process..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# FastAPI 서버 백그라운드 시작
echo "Starting FastAPI server in background..."
$PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8080 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# PID 파일에 저장 (테스트 후 서버 종료용)
echo $SERVER_PID > server.pid

# 서버 시작 대기
echo "Waiting for server to be ready..."
MAX_WAIT=60
WAIT_COUNT=0

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s http://localhost:8080/ >/dev/null 2>&1; then
        echo "✅ Server is ready! (took ${WAIT_COUNT} seconds)"
        
        # 서버 상태 확인
        echo "Testing server response:"
        curl -s http://localhost:8080/ | head -c 200
        echo ""
        
        exit 0
    fi
    
    # 프로세스가 살아있는지 확인
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "❌ Server process died unexpectedly"
        exit 1
    fi
    
    echo "Waiting... ($((WAIT_COUNT + 1))/$MAX_WAIT)"
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

echo "❌ Server failed to start within $MAX_WAIT seconds"
echo "Checking server logs..."
kill $SERVER_PID 2>/dev/null || true
exit 1
