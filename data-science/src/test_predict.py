from predict import predict_refill


def run_test(name, payload, current_date="2026-08-11"):

    print(f"\n{'=' * 60}")
    print(name)
    print("=" * 60)

    try:
        result = predict_refill(
            payload,
            current_date=current_date
        )

        print("PASS")
        print(result)

    except Exception as error:
        print("ERROR CAUGHT")
        print(type(error).__name__, "-", error)


# ============================================================
# 1. VALID COLD START
# ============================================================

run_test(
    "VALID COLD START",
    {
        "cylinder_size_kg": 6,
        "refill_quantity_kg": 6,
        "household_size": 3,
        "meals_per_day": 2,
        "cooking_days_per_week": 6,
        "lpg_primary_fuel": "yes",
        "usage_change": "normal",
        "last_refill_date": "2026-08-05",
        "number_previous_cycles": 0,
    }
)


# ============================================================
# 2. ONE PREVIOUS CYCLE
# ============================================================

run_test(
    "BUILDING PERSONALISATION",
    {
        "cylinder_size_kg": 12.5,
        "refill_quantity_kg": 12.5,
        "household_size": 4,
        "meals_per_day": 2,
        "cooking_days_per_week": 7,
        "lpg_primary_fuel": "yes",
        "usage_change": "normal",
        "last_refill_date": "2026-08-01",
        "number_previous_cycles": 1,
        "previous_cycle_days": 34,
        "average_previous_cycle_days": 34,
    }
)


# ============================================================
# 3. ESTABLISHED PERSONALISATION
# ============================================================

run_test(
    "ESTABLISHED PERSONALISATION",
    {
        "cylinder_size_kg": 12.5,
        "refill_quantity_kg": 10,
        "household_size": 5,
        "meals_per_day": 3,
        "cooking_days_per_week": 7,
        "lpg_primary_fuel": "yes",
        "usage_change": "more",
        "last_refill_date": "2026-07-25",
        "number_previous_cycles": 4,
        "previous_cycle_days": 27,
        "average_previous_cycle_days": 29,
    }
)


# ============================================================
# 4. PARTIAL REFILL
# ============================================================

run_test(
    "PARTIAL REFILL",
    {
        "cylinder_size_kg": 12.5,
        "refill_quantity_kg": 7.5,
        "household_size": 3,
        "meals_per_day": 2,
        "cooking_days_per_week": 6,
        "lpg_primary_fuel": "yes",
        "usage_change": "normal",
        "last_refill_date": "2026-08-03",
        "number_previous_cycles": 0,
    }
)


# ============================================================
# 5. COOKING LESS THAN USUAL
# ============================================================

run_test(
    "COOKING LESS",
    {
        "cylinder_size_kg": 6,
        "refill_quantity_kg": 6,
        "household_size": 2,
        "meals_per_day": 1,
        "cooking_days_per_week": 5,
        "lpg_primary_fuel": "no",
        "usage_change": "less",
        "last_refill_date": "2026-08-01",
        "number_previous_cycles": 0,
    }
)


# ============================================================
# 6. UNSUPPORTED CYLINDER
# Should fail safely
# ============================================================

run_test(
    "UNSUPPORTED 25 KG CYLINDER",
    {
        "cylinder_size_kg": 25,
        "refill_quantity_kg": 25,
        "household_size": 5,
        "meals_per_day": 3,
        "cooking_days_per_week": 7,
        "lpg_primary_fuel": "yes",
        "usage_change": "normal",
        "last_refill_date": "2026-08-01",
        "number_previous_cycles": 0,
    }
)


# ============================================================
# 7. REFILL QUANTITY > CYLINDER SIZE
# Should fail safely
# ============================================================

run_test(
    "INVALID REFILL QUANTITY",
    {
        "cylinder_size_kg": 6,
        "refill_quantity_kg": 8,
        "household_size": 3,
        "meals_per_day": 2,
        "cooking_days_per_week": 7,
        "lpg_primary_fuel": "yes",
        "usage_change": "normal",
        "last_refill_date": "2026-08-01",
        "number_previous_cycles": 0,
    }
)


# ============================================================
# 8. FUTURE REFILL DATE
# Should fail safely
# ============================================================

run_test(
    "FUTURE REFILL DATE",
    {
        "cylinder_size_kg": 6,
        "refill_quantity_kg": 6,
        "household_size": 3,
        "meals_per_day": 2,
        "cooking_days_per_week": 7,
        "lpg_primary_fuel": "yes",
        "usage_change": "normal",
        "last_refill_date": "2026-09-01",
        "number_previous_cycles": 0,
    }
)


# ============================================================
# 9. RETURNING USER WITHOUT HISTORY VALUES
# Should fail safely
# ============================================================

run_test(
    "MISSING RETURNING-USER HISTORY",
    {
        "cylinder_size_kg": 12.5,
        "refill_quantity_kg": 12.5,
        "household_size": 4,
        "meals_per_day": 2,
        "cooking_days_per_week": 7,
        "lpg_primary_fuel": "yes",
        "usage_change": "normal",
        "last_refill_date": "2026-08-01",
        "number_previous_cycles": 2,
    }
)

# ============================================================
# 10. REFILL NOW STATUS
# ============================================================

run_test(
    "REFILL NOW STATUS",
    {
        "cylinder_size_kg": 6,
        "refill_quantity_kg": 6,
        "household_size": 4,
        "meals_per_day": 3,
        "cooking_days_per_week": 7,
        "lpg_primary_fuel": "yes",
        "usage_change": "more",
        "last_refill_date": "2026-07-20",
        "number_previous_cycles": 0,
    },
    current_date="2026-07-24"
)


# ============================================================
# 11. OVERDUE STATUS
# ============================================================

run_test(
    "OVERDUE STATUS",
    {
        "cylinder_size_kg": 6,
        "refill_quantity_kg": 6,
        "household_size": 5,
        "meals_per_day": 3,
        "cooking_days_per_week": 7,
        "lpg_primary_fuel": "yes",
        "usage_change": "more",
        "last_refill_date": "2026-07-01",
        "number_previous_cycles": 0,
    },
    current_date="2026-08-11"
)