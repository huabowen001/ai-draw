from fastapi import APIRouter, HTTPException
from app.models import DrawRequest, DrawResponse
from app.services import DrawAgent

router = APIRouter()
draw_agent = DrawAgent()


@router.post("/draw", response_model=DrawResponse)
async def draw_diagram(request: DrawRequest):
    """
    核心接口：调用 agent 生成或优化 draw.io XML 图表
    
    - 如果提供了 current_xml，则优化现有图表
    - 如果没有提供 current_xml，则创建新图表
    """
    try:
        result = await draw_agent.process_request(request.prompt, request.current_xml)
        
        return DrawResponse(
            success=result['success'],
            message=result.get('message', '处理失败'),
            xml_content=result.get('xml_content')
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
