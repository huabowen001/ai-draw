from pydantic import BaseModel
from typing import Optional, Dict, Any


class DrawRequest(BaseModel):
    """绘图请求"""
    prompt: str
    current_xml: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class DrawResponse(BaseModel):
    """绘图响应"""
    success: bool
    message: str
    xml_content: Optional[str] = None
