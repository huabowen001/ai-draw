#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
DEFAULT_BACKEND_PORT=8001
DEFAULT_FRONTEND_PORT=3000

show_usage() {
    echo "用法: $0 [后端端口] [前端端口]"
    echo ""
    echo "示例:"
    echo "  $0              # 使用默认端口 (后端: 8001, 前端: 3000)"
    echo "  $0 9000         # 后端端口 9000, 前端默认 3000"
    echo "  $0 9000 8080    # 后端端口 9000, 前端端口 8080"
    exit 1
}

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_usage
fi

BACKEND_PORT=${1:-$DEFAULT_BACKEND_PORT}
FRONTEND_PORT=${2:-$DEFAULT_FRONTEND_PORT}

if ! [[ "$BACKEND_PORT" =~ ^[0-9]+$ ]] || ! [[ "$FRONTEND_PORT" =~ ^[0-9]+$ ]]; then
    echo "错误: 端口必须是数字"
    show_usage
fi

echo "=========================================="
echo "  智能画图助手 - 一键启动脚本"
echo "=========================================="
echo ""

setup_backend() {
    echo ">>> 设置后端环境..."
    cd "$BACKEND_DIR"
    
    if [ ! -d ".venv" ]; then
        echo "  创建 uv 虚拟环境..."
        uv venv
    else
        echo "  虚拟环境已存在，跳过创建"
    fi
    
    echo "  安装依赖..."
    uv pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
    
    echo "  后端环境设置完成!"
    echo ""
}

start_backend() {
    echo ">>> 启动后端服务 (端口: $BACKEND_PORT)..."
    cd "$BACKEND_DIR"
    
    source .venv/bin/activate
    
    uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload &
    BACKEND_PID=$!
    echo "  后端服务已启动 (PID: $BACKEND_PID)"
    echo ""
}

start_frontend() {
    echo ">>> 启动前端服务 (端口: $FRONTEND_PORT)..."
    cd "$FRONTEND_DIR"
    
    API_URL="http://localhost:${BACKEND_PORT}/api/v1"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|http://localhost:[0-9]*/api/v1|${API_URL}|g" app.js
    else
        sed -i "s|http://localhost:[0-9]*/api/v1|${API_URL}|g" app.js
    fi
    
    echo "  前端 API 地址已配置为: $API_URL"
    
    python3 -m http.server "$FRONTEND_PORT" --directory "$FRONTEND_DIR" &
    FRONTEND_PID=$!
    echo "  前端服务已启动 (PID: $FRONTEND_PID)"
    echo ""
}

print_info() {
    echo "=========================================="
    echo "  服务启动完成!"
    echo "=========================================="
    echo ""
    echo "  前端地址: http://localhost:${FRONTEND_PORT}"
    echo "  后端地址: http://localhost:${BACKEND_PORT}"
    echo "  API 文档: http://localhost:${BACKEND_PORT}/docs"
    echo ""
    echo "  按 Ctrl+C 停止所有服务"
    echo ""
}

cleanup() {
    echo ""
    echo ">>> 停止服务..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo "  服务已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "后端端口: $BACKEND_PORT"
echo "前端端口: $FRONTEND_PORT"
echo ""

setup_backend
start_backend

sleep 2

start_frontend
print_info

wait
