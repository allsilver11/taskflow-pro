import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import Base, engine
from routers import tasks

logging.basicConfig(level=logging.INFO)

# 앱 기동 시 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskFlow Pro",
    version="1.0.0",
    description="팀 업무 관리 API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Pydantic 검증 오류를 스펙 형식의 400으로 변환"""
    errors = exc.errors()
    first = errors[0] if errors else {}
    # body 이후 경로만 추출 (예: ["body", "title"] → "title")
    loc = first.get("loc", [])
    field = ".".join(str(p) for p in loc if p != "body") or None
    return JSONResponse(
        status_code=400,
        content={
            "error": "VALIDATION_ERROR",
            "message": first.get("msg", "입력값이 올바르지 않습니다."),
            "field": field,
        },
    )


app.include_router(tasks.router, prefix="/api/v1")
