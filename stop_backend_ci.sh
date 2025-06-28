#!/bin/bash

# GitHub Actions용 백엔드 서버 종료 스크립트
echo "=== Stopping Backend Server ==="

# PID 파일에서 서버 PID 읽기
if [ -f "backend/server.pid" ]; then
    SERVER_PID=$(cat backend/server.pid)
    echo "Found server PID: $SERVER_PID"
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "Stopping server with PID: $SERVER_PID"
        kill $SERVER_PID
        sleep 2
        
        # 강제 종료가 필요한 경우
        if kill -0 $SERVER_PID 2>/dev/null; then
            echo "Force killing server..."
            kill -9 $SERVER_PID
        fi
        
        echo "Server stopped"
    else
        echo "Server process not running"
    fi
    
    rm -f backend/server.pid
else
    echo "No PID file found, checking for running processes on port 8080..."
    if lsof -i:8080 >/dev/null 2>&1; then
        echo "Killing processes on port 8080..."
        lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    fi
fi

echo "Backend server shutdown complete"
