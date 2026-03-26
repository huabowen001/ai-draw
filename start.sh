#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
DEFAULT_BACKEND_PORT=8080
DEFAULT_LLM_BASE_URL="https://api.deepseek.com/v1"
DEFAULT_LLM_MODEL_NAME="deepseek-chat"

show_usage() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --llm-base-url URL       LLM API 地址 (默认: https://api.deepseek.com/v1)"
    echo "  --llm-api-key KEY        LLM API 密钥"
    echo "  --llm-model-name NAME    LLM 模型名称 (默认: deepseek-chat)"
    echo "  -h, --help               显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                       # 使用默认配置"
    echo "  $0 --llm-api-key sk-xxx  # 配置 API 密钥"
    echo ""
    echo "环境变量:"
    echo "  LLM_BASE_URL    LLM API 地址"
    echo "  LLM_API_KEY     LLM API 密钥"
    echo "  LLM_MODEL_NAME  LLM 模型名称"
    exit 0
}

BACKEND_PORT=$DEFAULT_BACKEND_PORT
FRONTEND_PORT=3000
LLM_BASE_URL="${LLM_BASE_URL:-$DEFAULT_LLM_BASE_URL}"
LLM_API_KEY="${LLM_API_KEY:-}"
LLM_MODEL_NAME="${LLM_MODEL_NAME:-$DEFAULT_LLM_MODEL_NAME}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --llm-base-url)
            LLM_BASE_URL="$2"
            shift 2
            ;;
        --llm-api-key)
            LLM_API_KEY="$2"
            shift 2
            ;;
        --llm-model-name)
            LLM_MODEL_NAME="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            echo "未知参数: $1"
            show_usage
            ;;
    esac
done

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
    
    export LLM_BASE_URL="$LLM_BASE_URL"
    export LLM_API_KEY="$LLM_API_KEY"
    export LLM_MODEL_NAME="$LLM_MODEL_NAME"
    
    echo "  LLM_BASE_URL: $LLM_BASE_URL"
    echo "  LLM_MODEL_NAME: $LLM_MODEL_NAME"
    if [ -n "$LLM_API_KEY" ]; then
        echo "  LLM_API_KEY: 已配置"
    else
        echo "  LLM_API_KEY: 未配置"
    fi
    
    uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload &
    BACKEND_PID=$!
    echo "  后端服务已启动 (PID: $BACKEND_PID)"
    echo ""
}

start_frontend() {
    echo ">>> 启动前端服务 (端口: $FRONTEND_PORT)..."
    cd "$FRONTEND_DIR"
    
    echo "  前端 API 地址: http://localhost:${BACKEND_PORT}/api/v1"
    
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
