# 智能画图助手

基于 AI 的智能绘图工具，支持通过自然语言描述生成架构图、流程图、时序图等多种图表类型。

## 功能特性

- **AI 智能生成** - 使用自然语言描述即可生成图表
- **图表优化** - 支持对现有图表进行 AI 优化
- **在线编辑** - 集成 Draw.io 编辑器，支持在线编辑和预览
- **文件管理** - 支持读取、保存 `.drawio` 和 `.xml` 文件

## 技术栈

**前端**
- 原生 JavaScript (ES6+)
- Draw.io Embed API

**后端**
- FastAPI
- AgentScope
- OpenAI API (兼容 DeepSeek 等)

## 快速启动

### 方式一：一键启动（推荐）

```bash
./start.sh --llm-api-key your_api_key_here
```

启动参数：
- `--llm-base-url` - LLM API 地址（默认：https://api.deepseek.com/v1）
- `--llm-api-key` - LLM API 密钥
- `--llm-model-name` - LLM 模型名称（默认：deepseek-chat）

### 方式二：手动启动

**1. 配置后端环境**

```bash
cd backend

# 创建虚拟环境
uv venv

# 安装依赖
uv pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API 密钥
```

**2. 启动后端服务**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

**3. 启动前端服务**

```bash
cd frontend
python3 -m http.server 3000
```

**4. 访问应用**

打开浏览器访问：http://localhost:3000

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| LLM_BASE_URL | LLM API 地址 | https://api.deepseek.com/v1 |
| LLM_API_KEY | LLM API 密钥 | - |
| LLM_MODEL_NAME | LLM 模型名称 | deepseek-chat |

## API 文档

启动后端服务后，访问 http://localhost:8080/docs 查看 Swagger API 文档。

### 核心接口

**POST /api/v1/draw**

生成或优化图表

请求体：
```json
{
  "prompt": "生成一个用户登录流程图",
  "current_xml": "可选，现有图表的 XML 内容"
}
```

响应：
```json
{
  "success": true,
  "message": "生成成功",
  "xml_content": "<mxfile>...</mxfile>"
}
```

## 目录结构

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # API 路由
│   │   ├── services/     # 业务逻辑
│   │   ├── skills/       # Agent 技能
│   │   ├── config.py     # 配置管理
│   │   ├── main.py       # 应用入口
│   │   └── models.py     # 数据模型
│   ├── .env.example      # 环境变量示例
│   └── requirements.txt  # Python 依赖
├── frontend/
│   ├── js/
│   │   ├── core/         # 核心模块
│   │   ├── services/     # 服务模块
│   │   ├── ui/           # UI 组件
│   │   ├── utils/        # 工具函数
│   │   ├── app.js        # 应用入口
│   │   └── config.js     # 配置文件
│   └── index.html        # 主页面
├── start.sh              # 一键启动脚本
└── README.md
```

## 依赖要求

- Python 3.10+
- uv (Python 包管理器)
- 现代浏览器（支持 ES6 模块）
