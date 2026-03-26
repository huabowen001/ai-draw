# AI Draw Tool Backend

基于 AI 的智能绘图工具后端服务，通过调用 agent 生成和优化 draw.io XML 图表。

## 快速开始

### 1. 安装依赖

使用清华镜像源加速安装：

```bash
cd backend
uv pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key
```

`.env` 文件内容：
```env
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_API_KEY=your_api_key_here
LLM_MODEL_NAME=deepseek-chat
```

### 3. 运行服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000/docs 查看 API 文档

## 核心接口

### POST /api/v1/draw

**请求体：**
```json
{
  "prompt": "请创建一个用户登录流程图",
  "current_xml": null,  // 可选，如果提供则优化现有图表
  "context": {}         // 可选，额外上下文信息
}
```

**响应：**
```json
{
  "success": true,
  "message": "图表生成成功",
  "xml_content": "<mxfile>...</mxfile>"
}
```

## 使用示例

### 创建新图表

```bash
curl -X POST http://localhost:8000/api/v1/draw \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "请创建一个用户注册流程图，包含：填写信息、验证邮箱、创建账号"
  }'
```

### 优化现有图表

```bash
curl -X POST http://localhost:8000/api/v1/draw \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "请添加一个忘记密码的分支",
    "current_xml": "<mxfile>...</mxfile>"
  }'
```

## 技术架构

- **FastAPI**: Web 框架
- **AgentScope**: Agent 框架，使用 ReActAgent
- **Draw.io**: 图表格式标准
- **LLM**: 支持任何 OpenAI 兼容的 API（DeepSeek、OpenAI 等）

## 工作流程

1. 用户发送绘图需求（可选传入现有 XML）
2. Backend 调用 DrawAgent
3. DrawAgent 创建 ReActAgent 实例
4. ReActAgent 调用 LLM 和 drawio-creator skill
5. 生成符合 draw.io 规范的 XML 并返回

## 项目结构

```
backend/
├── app/
│   ├── api/
│   │   └── routes.py          # API 路由
│   ├── services/
│   │   └── draw_agent.py      # Agent 服务
│   ├── __init__.py
│   ├── config.py              # 配置管理
│   ├── main.py                # FastAPI 应用
│   └── models.py              # 数据模型
├── .env                       # 环境变量（不提交）
├── .env.example               # 环境变量示例
├── requirements.txt           # 依赖列表
└── README.md                  # 本文档
```

## 常见问题

### 安装依赖时网络错误

使用清华镜像源：
```bash
uv pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
```

### API Key 配置

支持任何 OpenAI 兼容的 API：
- DeepSeek: `LLM_BASE_URL=https://api.deepseek.com/v1`
- OpenAI: `LLM_BASE_URL=https://api.openai.com/v1`
- 其他兼容服务
