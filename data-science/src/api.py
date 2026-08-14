"""
FlameIQ Prediction API
=======================
Thin HTTP wrapper around Didi's predict.py (predict_refill) for
Backend/Frontend integration.

Run locally:
    uvicorn api:app --host 0.0.0.0 --port 8000

Endpoint:
    POST /v1/predictions/refill
"""

from __future__ import annotations

from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from predict import predict_refill

app = FastAPI(
    title="FlameIQ Prediction Service",
    description="Smart Refill Prediction — cold-start and personalised LPG refill estimates.",
    version="0.2.0",
)

# Allow the FlameIQ frontend/chatbot to call this during hackathon dev.
# Tighten allow_origins before any real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RefillPredictionRequest(BaseModel):
    cylinder_size_kg: float = Field(..., description="6 or 12.5 (household PoC scope only)")
    refill_quantity_kg: float
    household_size: int
    meals_per_day: int
    cooking_days_per_week: int
    lpg_primary_fuel: str = Field(..., description="Yes/No, True/False, or 1/0")
    usage_change: str = Field(..., description="'less', 'normal', or 'more'")
    last_refill_date: str = Field(..., description="ISO date, e.g. 2026-08-01")
    number_previous_cycles: int = 0
    previous_cycle_days: Optional[float] = None
    average_previous_cycle_days: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "cylinder_size_kg": 12.5,
                "refill_quantity_kg": 12.5,
                "household_size": 4,
                "meals_per_day": 2,
                "cooking_days_per_week": 7,
                "lpg_primary_fuel": "yes",
                "usage_change": "normal",
                "last_refill_date": "2026-08-01",
                "number_previous_cycles": 0,
            }
        }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/v1/predictions/refill")
def predict_refill_endpoint(payload: RefillPredictionRequest) -> dict:
    try:
        return predict_refill(payload.model_dump(exclude_none=True))
    except ValueError as exc:
        # predict.py raises plain ValueError for all input/validation problems.
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Prediction service error: {exc}") from exc
