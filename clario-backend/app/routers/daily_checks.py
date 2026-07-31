"""Daily check-in endpoints — mark steps, query today's state, weekly history."""
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from loguru import logger
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.schema.response import ApiResponse, fail, ok
from app.services import daily_checks_service as svc

daily_checks_router = APIRouter(prefix="/daily-checks", tags=["Daily Checks"])


def _valid_date(value: str) -> date | None:
    """Parse YYYY-MM-DD; returns None on malformed input."""
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


class MarkStepBody(BaseModel):
    step: Literal["morning", "refill", "night"]
    check_date: str   # YYYY-MM-DD in the user's local timezone


@daily_checks_router.post("/mark", response_model=ApiResponse[dict])
def mark_step(body: MarkStepBody, user: dict = Depends(get_current_user)):
    """Mark one of the three daily steps as complete."""
    user_id = user.get("id")
    if not user_id or user_id == "guest":
        return fail("Not authenticated")
    if _valid_date(body.check_date) is None:
        return fail("check_date must be a valid YYYY-MM-DD date")
    try:
        result = svc.mark_step(user_id, body.step, body.check_date)
        return ok("Step marked", result)
    except RuntimeError as e:
        logger.error("mark_step error: {}", e)
        return fail(str(e))


@daily_checks_router.get("/today", response_model=ApiResponse[dict])
def get_today(
    check_date: str = Query(..., description="YYYY-MM-DD in the user's local timezone"),
    user: dict = Depends(get_current_user),
):
    """Today's completion state plus current streak."""
    user_id = user.get("id")
    if not user_id or user_id == "guest":
        return fail("Not authenticated")
    if _valid_date(check_date) is None:
        return fail("check_date must be a valid YYYY-MM-DD date")
    try:
        result = svc.get_today(user_id, check_date)
        return ok("OK", result)
    except RuntimeError as e:
        logger.error("get_today error: {}", e)
        return fail(str(e))


@daily_checks_router.get("/history", response_model=ApiResponse[list])
def get_history(
    days: int = Query(default=7, ge=1, le=90),
    end_date: str = Query(..., description="YYYY-MM-DD — last date to include (usually today)"),
    user: dict = Depends(get_current_user),
):
    """Last N days of check completion for the weekly dots / garden view."""
    user_id = user.get("id")
    if not user_id or user_id == "guest":
        return fail("Not authenticated")
    if _valid_date(end_date) is None:
        return fail("end_date must be a valid YYYY-MM-DD date")
    try:
        result = svc.get_history(user_id, days, end_date)
        return ok("OK", result)
    except RuntimeError as e:
        logger.error("get_history error: {}", e)
        return fail(str(e))
