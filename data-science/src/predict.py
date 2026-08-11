from pathlib import Path
from datetime import date, datetime, timedelta

import joblib
import numpy as np
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BASE_DIR / "models"

COLD_MODEL_PATH = (
    MODELS_DIR / "cold_start_model.joblib"
)

PERSONALISED_MODEL_PATH = (
    MODELS_DIR / "personalised_model.joblib"
)


# Household PoC models were trained only on these sizes.
SUPPORTED_CYLINDER_SIZES = {
    6.0,
    12.5,
}


# Model target bounds used during synthetic training.
MIN_CYCLE_DAYS = 6
MAX_CYCLE_DAYS = 75


# Operational recommendation buffers selected
# from Notebook 04 safety-buffer analysis.
COLD_START_BUFFER_DAYS = 4
PERSONALISED_BUFFER_DAYS = 3


# Planning ranges based on PoC error behaviour.
# These are NOT calibrated statistical confidence intervals.
COLD_START_RANGE_DAYS = 5
PERSONALISED_RANGE_DAYS = 4


# ============================================================
# LOAD MODELS
# ============================================================

cold_start_model = joblib.load(
    COLD_MODEL_PATH
)

personalised_model = joblib.load(
    PERSONALISED_MODEL_PATH
)


# ============================================================
# HELPERS
# ============================================================

def parse_date(value, field_name):
    """
    Convert supported date input into a Python date.
    """

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    try:
        return pd.to_datetime(
            value
        ).date()

    except Exception as exc:
        raise ValueError(
            f"{field_name} must be a valid date."
        ) from exc


def normalise_binary(value, field_name):
    """
    Convert Yes/No, True/False or 1/0 into 1 or 0.
    """

    if isinstance(value, bool):
        return int(value)

    if isinstance(value, (int, np.integer)):
        if value in [0, 1]:
            return int(value)

    if isinstance(value, str):

        cleaned = value.strip().lower()

        if cleaned in [
            "yes",
            "y",
            "true",
            "1"
        ]:
            return 1

        if cleaned in [
            "no",
            "n",
            "false",
            "0"
        ]:
            return 0

    raise ValueError(
        f"{field_name} must be Yes/No, "
        f"True/False or 1/0."
    )


def format_date(value):
    """
    Return ISO formatted date.
    """

    return value.isoformat()


def display_date(value):
    """
    Return human-readable date.
    """

    return value.strftime(
        "%d %b %Y"
    )


# ============================================================
# INPUT VALIDATION
# ============================================================

def validate_payload(payload):

    required_fields = [
        "cylinder_size_kg",
        "refill_quantity_kg",
        "household_size",
        "meals_per_day",
        "cooking_days_per_week",
        "lpg_primary_fuel",
        "usage_change",
        "last_refill_date",
    ]

    missing = [
        field
        for field in required_fields
        if field not in payload
    ]

    if missing:
        raise ValueError(
            "Missing required fields: "
            + ", ".join(missing)
        )

    cylinder_size = float(
        payload["cylinder_size_kg"]
    )

    if cylinder_size not in SUPPORTED_CYLINDER_SIZES:

        raise ValueError(
            "The FlameIQ household PoC model currently "
            "supports 6 kg and 12.5 kg cylinders only."
        )

    refill_quantity = float(
        payload["refill_quantity_kg"]
    )

    if refill_quantity <= 0:
        raise ValueError(
            "refill_quantity_kg must be greater than 0."
        )

    if refill_quantity > cylinder_size:
        raise ValueError(
            "refill_quantity_kg cannot exceed "
            "cylinder_size_kg."
        )

    household_size = int(
        payload["household_size"]
    )

    if household_size < 1:
        raise ValueError(
            "household_size must be at least 1."
        )

    meals_per_day = int(
        payload["meals_per_day"]
    )

    if meals_per_day < 1:
        raise ValueError(
            "meals_per_day must be at least 1."
        )

    cooking_days = int(
        payload["cooking_days_per_week"]
    )

    if not 1 <= cooking_days <= 7:
        raise ValueError(
            "cooking_days_per_week must be between 1 and 7."
        )

    usage_change = str(
        payload["usage_change"]
    ).strip().lower()

    if usage_change not in [
        "normal",
        "more",
        "less",
    ]:
        raise ValueError(
            "usage_change must be one of: "
            "normal, more, less."
        )


# ============================================================
# FEATURE PREPARATION
# ============================================================

def prepare_features(payload):

    validate_payload(payload)

    last_refill_date = parse_date(
        payload["last_refill_date"],
        "last_refill_date"
    )

    month = last_refill_date.month

    festive_period = int(
        month in [12, 1]
    )

    month_sin = np.sin(
        2 * np.pi * month / 12
    )

    month_cos = np.cos(
        2 * np.pi * month / 12
    )

    number_previous_cycles = int(
        payload.get(
            "number_previous_cycles",
            0
        )
    )

    features = {
        "cylinder_size_kg":
            float(
                payload["cylinder_size_kg"]
            ),

        "refill_quantity_kg":
            float(
                payload["refill_quantity_kg"]
            ),

        "household_size":
            int(
                payload["household_size"]
            ),

        "meals_per_day":
            int(
                payload["meals_per_day"]
            ),

        "cooking_days_per_week":
            int(
                payload[
                    "cooking_days_per_week"
                ]
            ),

        "lpg_primary_fuel":
            normalise_binary(
                payload["lpg_primary_fuel"],
                "lpg_primary_fuel"
            ),

        "usage_change":
            str(
                payload["usage_change"]
            ).strip().lower(),

        "festive_period":
            festive_period,

        "month_sin":
            month_sin,

        "month_cos":
            month_cos,
    }


    # --------------------------------------------------------
    # PERSONALISED HISTORY FEATURES
    # --------------------------------------------------------

    if number_previous_cycles > 0:

        history_fields = [
            "previous_cycle_days",
            "average_previous_cycle_days",
        ]

        missing_history = [
            field
            for field in history_fields
            if field not in payload
        ]

        if missing_history:
            raise ValueError(
                "Returning users require: "
                + ", ".join(missing_history)
            )

        previous_cycle_days = float(
            payload["previous_cycle_days"]
        )

        average_previous_cycle_days = float(
            payload[
                "average_previous_cycle_days"
            ]
        )

        if previous_cycle_days <= 0:
            raise ValueError(
                "previous_cycle_days must be positive."
            )

        if average_previous_cycle_days <= 0:
            raise ValueError(
                "average_previous_cycle_days "
                "must be positive."
            )

        features.update(
            {
                "previous_cycle_days":
                    previous_cycle_days,

                "average_previous_cycle_days":
                    average_previous_cycle_days,

                "number_previous_cycles":
                    number_previous_cycles,
            }
        )

    return (
        pd.DataFrame([features]),
        last_refill_date,
        number_previous_cycles,
    )


# ============================================================
# PERSONALISATION STAGE
# ============================================================

def get_personalisation_stage(
    number_previous_cycles
):

    if number_previous_cycles == 0:

        return "Early Estimate"

    if number_previous_cycles == 1:

        return "Building Personalisation"

    return "Established Personalisation"


# ============================================================
# TOP REASONS / EXPLANATION
# ============================================================

def build_top_reasons(
    payload,
    number_previous_cycles
):

    reasons = []

    # Returning-user history
    if number_previous_cycles > 0:

        average_days = float(
            payload[
                "average_previous_cycle_days"
            ]
        )

        reasons.append(
            f"Your previous refill cycles "
            f"average about {average_days:.0f} days"
        )

    # Refill quantity
    refill_quantity = float(
        payload["refill_quantity_kg"]
    )

    reasons.append(
        f"{refill_quantity:g} kg refill quantity"
    )

    # Recent usage change
    usage_change = str(
        payload["usage_change"]
    ).strip().lower()

    if usage_change == "more":

        reasons.append(
            "You reported cooking more than usual"
        )

    elif usage_change == "less":

        reasons.append(
            "You reported cooking less than usual"
        )

    else:

        household_size = int(
            payload["household_size"]
        )

        reasons.append(
            f"{household_size}-person household"
        )

    # Add meal frequency only if we still have
    # fewer than three explanation points
    if len(reasons) < 3:

        meals_per_day = int(
            payload["meals_per_day"]
        )

        reasons.append(
            f"{meals_per_day} meal"
            f"{'s' if meals_per_day != 1 else ''} "
            f"cooked with gas per day"
        )

    return reasons[:3]


# ============================================================
# MAIN PREDICTION FUNCTION
# ============================================================

def predict_refill(
    payload,
    current_date=None
):

    """
    Generate a FlameIQ refill prediction.

    Parameters
    ----------
    payload : dict
        User/refill information.

    current_date : optional
        Useful for testing. Defaults to today's date.

    Returns
    -------
    dict
        Backend-ready prediction response.
    """

    (
        X,
        last_refill_date,
        number_previous_cycles,
    ) = prepare_features(payload)


    # --------------------------------------------------------
    # CURRENT DATE
    # --------------------------------------------------------

    if current_date is None:
        current_date = date.today()

    else:
        current_date = parse_date(
            current_date,
            "current_date"
        )

    if last_refill_date > current_date:

        raise ValueError(
            "last_refill_date cannot be "
            "later than current_date."
        )


    # --------------------------------------------------------
    # SELECT PREDICTION PATHWAY
    # --------------------------------------------------------

    if number_previous_cycles == 0:

        model = cold_start_model

        pathway = "cold_start"

        safety_buffer = (
            COLD_START_BUFFER_DAYS
        )

        range_margin = (
            COLD_START_RANGE_DAYS
        )

        model_version = (
            "flameiq-coldstart-v1"
        )

    else:

        model = personalised_model

        pathway = "personalised"

        safety_buffer = (
            PERSONALISED_BUFFER_DAYS
        )

        range_margin = (
            PERSONALISED_RANGE_DAYS
        )

        model_version = (
            "flameiq-personalised-v1"
        )


    # --------------------------------------------------------
    # MODEL PREDICTION
    # --------------------------------------------------------

    predicted_cycle_days = float(
        model.predict(X)[0]
    )


    # PoC guardrail matching synthetic
    # target range used for training.
    predicted_cycle_days = float(
        np.clip(
            predicted_cycle_days,
            MIN_CYCLE_DAYS,
            MAX_CYCLE_DAYS
        )
    )

    estimated_cycle_days = int(
        round(predicted_cycle_days)
    )


    # --------------------------------------------------------
    # DATES
    # --------------------------------------------------------

    estimated_refill_date = (
        last_refill_date
        + timedelta(
            days=estimated_cycle_days
        )
    )

    recommended_refill_date = (
        estimated_refill_date
        - timedelta(
            days=safety_buffer
        )
    )

    recommended_window_end = (
        estimated_refill_date
        - timedelta(days=1)
    )

    prediction_range_start = (
        estimated_refill_date
        - timedelta(
            days=range_margin
        )
    )

    prediction_range_end = (
        estimated_refill_date
        + timedelta(
            days=range_margin
        )
    )


    # --------------------------------------------------------
    # DAYS REMAINING
    # --------------------------------------------------------

    raw_days_remaining = (
        estimated_refill_date
        - current_date
    ).days

    estimated_days_remaining = max(
        0,
        raw_days_remaining
    )

    days_overdue = max(
        0,
        -raw_days_remaining
    )

    days_until_recommendation = (
        recommended_refill_date
        - current_date
    ).days


    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    if raw_days_remaining < 0:

        status = "overdue"

        recommended_action = (
            "The estimated refill point "
            "has passed. Refill now."
        )

    elif days_until_recommendation <= 0:

        status = "refill_now"

        recommended_action = (
            "You are within your recommended "
            "refill window. Plan a refill now."
        )

    elif days_until_recommendation <= 3:

        status = "refill_soon"

        recommended_action = (
            "Your recommended refill window "
            f"starts on "
            f"{display_date(recommended_refill_date)}."
        )

    else:

        status = "okay"

        recommended_action = (
            "Plan your next refill from "
            f"{display_date(recommended_refill_date)}."
        )


    # --------------------------------------------------------
    # PERSONALISATION / EXPLANATION
    # --------------------------------------------------------

    personalisation_stage = (
        get_personalisation_stage(
            number_previous_cycles
        )
    )

    top_reasons = build_top_reasons(
        payload,
        number_previous_cycles
    )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    response = {

        "estimated_cycle_days":
            estimated_cycle_days,

        "estimated_days_remaining":
            estimated_days_remaining,

        "days_overdue":
            days_overdue,

        "estimated_refill_date":
            format_date(
                estimated_refill_date
            ),

        "prediction_range": {
            "start":
                format_date(
                    prediction_range_start
                ),

            "end":
                format_date(
                    prediction_range_end
                ),

            "basis":
                "synthetic_poc_error_margin",
        },

        "recommended_refill_date":
            format_date(
                recommended_refill_date
            ),

        "recommended_refill_window": {
            "start":
                format_date(
                    recommended_refill_date
                ),

            "end":
                format_date(
                    recommended_window_end
                ),
        },

        "status":
            status,

        "low_gas":
            days_until_recommendation <= 0,

        "personalization_stage":
            personalisation_stage,

        "confidence":
            personalisation_stage,

        "confidence_note":
            (
                "Based on refill-history depth; "
                "not a calibrated probability."
            ),

        "top_reasons":
            top_reasons,

        "recommended_action":
            recommended_action,

        "predictor_type":
            "ml_poc",

        "prediction_pathway":
            pathway,

        "model_version":
            model_version,

        "data_basis":
            "synthetic_poc",

        "safety_buffer_days":
            safety_buffer,

        "degraded":
            False,
    }

    return response


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    import json

    print(
        "\n========== COLD-START TEST ==========\n"
    )

    cold_example = {
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

    cold_result = predict_refill(
        cold_example,
        current_date="2026-08-11"
    )

    print(
        json.dumps(
            cold_result,
            indent=2
        )
    )


    print(
        "\n========== PERSONALISED TEST ==========\n"
    )

    personal_example = {
        "cylinder_size_kg": 12.5,
        "refill_quantity_kg": 12.5,
        "household_size": 4,
        "meals_per_day": 2,
        "cooking_days_per_week": 7,
        "lpg_primary_fuel": "yes",
        "usage_change": "normal",
        "last_refill_date": "2026-08-01",

        "number_previous_cycles": 3,
        "previous_cycle_days": 31,
        "average_previous_cycle_days": 30.5,
    }

    personal_result = predict_refill(
        personal_example,
        current_date="2026-08-11"
    )

    print(
        json.dumps(
            personal_result,
            indent=2
        )
    )