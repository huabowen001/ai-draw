import asyncio
import os
from pathlib import Path
from typing import Dict, Any, Optional
import sys
from agentscope.formatter import DeepSeekChatFormatter

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "agent"))

from agentscope.agent import ReActAgent
from agentscope.memory import InMemoryMemory
from agentscope.model import OpenAIChatModel
from agentscope.tool import Toolkit
from agentscope.message import Msg
from app.config import settings


class DrawAgent:
    """绘图Agent - 调用真正的 ReActAgent"""
    
    def __init__(self):
        self.toolkit = Toolkit()
        skill_dir = Path(__file__).parent.parent / "agent" / "skills" / "drawio-creator"
        if skill_dir.exists():
            self.toolkit.register_agent_skill(str(skill_dir))
        
        self.llm_config = {
            "base_url": settings.llm_base_url,
            "api_key": settings.llm_api_key,
            "model_name": settings.llm_model_name
        }
    
    def _create_agent(self) -> ReActAgent:
        """创建 ReActAgent 实例"""
        return ReActAgent(
            name="DrawAgent",
            sys_prompt="你是一个专业的绘图助手，能够根据用户需求生成和优化 draw.io XML 图表。你需要：\n1. 理解用户的绘图需求\n2. 分析需要创建的图表类型（流程图、架构图、时序图等）\n3. 生成符合 draw.io 规范的 XML 内容\n4. 如果用户提供了现有的 XML，则进行优化和修改\n\n请始终输出完整的、格式正确的 draw.io XML 内容。",
            model=OpenAIChatModel(
                model_name=self.llm_config["model_name"],
                api_key=self.llm_config["api_key"],
                client_kwargs={
                    "base_url": self.llm_config["base_url"],
                },
            ),
            memory=InMemoryMemory(),
            toolkit=self.toolkit,
            formatter=DeepSeekChatFormatter(),
        )
    
    async def process_request(
        self, 
        prompt: str, 
        current_xml: Optional[str] = None
    ) -> Dict[str, Any]:
        """处理用户请求，调用 agent 生成或优化 XML"""
        try:
            agent = self._create_agent()
            
            if current_xml:
                full_prompt = f"""请根据以下需求优化现有的图表：

用户需求：{prompt}

现有图表 XML：
```xml
{current_xml}
```

请分析现有图表，并根据用户需求进行修改和优化。输出完整的、格式正确的 draw.io XML 内容。"""
            else:
                full_prompt = f"""请根据以下需求创建图表：

{prompt}

请生成符合 draw.io 规范的完整 XML 内容。"""
            
            msg = Msg(
                name="user",
                content=full_prompt,
                role="user",
            )
            
            response = await agent(msg)
            
            print(f"DEBUG: response type = {type(response)}")
            print(f"DEBUG: response = {response}")
            if hasattr(response, 'content'):
                print(f"DEBUG: response.content type = {type(response.content)}")
                print(f"DEBUG: response.content = {response.content}")
            
            response_text = self._get_response_text(response)
            print(f"DEBUG: response_text = {response_text[:500] if response_text else 'None'}")
            
            xml_content = self._extract_xml_from_response(response_text)
            
            if xml_content:
                return {
                    "success": True,
                    "xml_content": xml_content,
                    "message": "图表生成成功" if not current_xml else "图表优化成功"
                }
            else:
                return {
                    "success": False,
                    "message": "无法从 agent 响应中提取有效的 XML 内容"
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"处理请求时发生错误: {str(e)}"
            }
    
    def _get_response_text(self, response) -> str:
        """从响应对象中提取文本内容"""
        if hasattr(response, 'content'):
            content = response.content
            if isinstance(content, str):
                return content
            elif isinstance(content, list):
                text_parts = []
                for item in content:
                    if isinstance(item, dict) and 'text' in item:
                        text_parts.append(item['text'])
                    elif isinstance(item, str):
                        text_parts.append(item)
                return '\n'.join(text_parts)
            else:
                return str(content)
        return str(response)
    
    def _extract_xml_from_response(self, response_content: str) -> Optional[str]:
        """从响应内容中提取 XML"""
        if not response_content:
            return None
        
        xml_start = response_content.find('<mxfile')
        if xml_start == -1:
            xml_start = response_content.find('<?xml')
        
        if xml_start == -1:
            return None
        
        xml_end = response_content.find('</mxfile>', xml_start)
        if xml_end == -1:
            return None
        
        xml_end += len('</mxfile>')
        xml_content = response_content[xml_start:xml_end]
        
        return xml_content
    
    def update_config(self, base_url: str, api_key: str, model_name: str):
        """更新 LLM 配置"""
        self.llm_config = {
            "base_url": base_url,
            "api_key": api_key,
            "model_name": model_name
        }
