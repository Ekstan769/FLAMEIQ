from pathlib import Path
import numpy as np
import pandas as pd

# ============================================================
# CONFIGURATION
# ============================================================

RANDOM_SEED = 42
rng = np.random.default_rng(RANDOM_SEED)

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================
# LOAD RAW DATA
# ============================================================

users = pd.read_csv(RAW_DIR / "users_dim.csv")
orders = pd.read_csv(RAW_DIR / "orders_fact.csv")

# Household-first MVP
households = users.loc[
    users["segment"].eq("Household")
].copy()

household_orders = orders.loc[
    orders["user_id"].isin(households["user_id"])
].copy()

# Number of existing orders becomes an activity anchor
order_counts = (
    household_orders
    .groupby("user_id")
    .size()
    .rename("existing_order_count")
)

households = households.merge(
    order_counts,
    on="user_id",
    how="left"
)

households["existing_order_count"] = (
    households["existing_order_count"]
    .fillna(1)
    .astype(int)
)

# ============================================================
# GENERATE STABLE HOUSEHOLD CHARACTERISTICS
# ============================================================

# Household size depends partly on cylinder size
def generate_household_size(cylinder_size):
    if cylinder_size <= 6:
        return rng.choice(
            [1, 2, 3, 4, 5, 6],
            p=[0.08, 0.22, 0.27, 0.23, 0.13, 0.07]
        )
    else:
        return rng.choice(
            [2, 3, 4, 5, 6, 7, 8],
            p=[0.06, 0.16, 0.25, 0.23, 0.16, 0.09, 0.05]
        )


households["household_size"] = households[
    "cylinder_size_kg"
].apply(generate_household_size)

# Meals per day
households["meals_per_day"] = rng.choice(
    [1, 2, 3],
    size=len(households),
    p=[0.15, 0.55, 0.30]
)

# Cooking days per week
households["cooking_days_per_week"] = rng.choice(
    [4, 5, 6, 7],
    size=len(households),
    p=[0.05, 0.10, 0.20, 0.65]
)

# Whether LPG is the primary fuel
households["lpg_primary_fuel"] = rng.choice(
    [1, 0],
    size=len(households),
    p=[0.84, 0.16]
)

# Some households bake/use gas for additional cooking
households["high_intensity_cooking"] = rng.choice(
    [1, 0],
    size=len(households),
    p=[0.18, 0.82]
)

# Hidden household consumption tendency.
# IMPORTANT: this affects the target but is NOT included as a model feature.
# It creates realistic unexplained variation.
households["latent_usage_factor"] = rng.lognormal(
    mean=0,
    sigma=0.15,
    size=len(households)
)

# ============================================================
# CREATE REFILL CYCLES
# ============================================================

records = []

for _, user in households.iterrows():

    user_id = user["user_id"]
    cylinder_size = float(user["cylinder_size_kg"])
    household_size = int(user["household_size"])
    meals_per_day = int(user["meals_per_day"])
    cooking_days = int(user["cooking_days_per_week"])
    lpg_primary = int(user["lpg_primary_fuel"])
    high_intensity = int(user["high_intensity_cooking"])
    latent_factor = float(user["latent_usage_factor"])

    # Use existing activity level as the number of synthetic cycles,
    # capped to keep histories reasonable.
    n_cycles = int(
        np.clip(
            user["existing_order_count"],
            2,
            12
        )
    )

    # Synthetic history may start before the hackathon year.
    refill_date = pd.Timestamp("2025-01-01") + pd.Timedelta(
        days=int(rng.integers(0, 120))
    )

    previous_cycles = []

    for cycle_number in range(1, n_cycles + 1):

        # ----------------------------------------------------
        # Refill quantity
        # ----------------------------------------------------

        # Most users refill nearly/full cylinder,
        # but partial fills occur.
        if rng.random() < 0.78:
            refill_fraction = rng.uniform(0.92, 1.00)
        else:
            refill_fraction = rng.uniform(0.55, 0.91)

        refill_quantity = cylinder_size * refill_fraction

        # ----------------------------------------------------
        # Cycle-specific behaviour
        # ----------------------------------------------------

        usage_change = rng.choice(
            ["normal", "more", "less"],
            p=[0.81, 0.11, 0.08]
)

        # Mild month/season effect
        month = refill_date.month

        festive_period = int(month in [12, 1])

        # ----------------------------------------------------
        # ESTIMATE DAILY LPG CONSUMPTION
        # ----------------------------------------------------

        # Base household cooking demand
        daily_consumption = (
            0.055
            + (0.020 * household_size)
            + (0.032 * meals_per_day)
            + (0.006 * cooking_days)
        )

        # Primary LPG households use more LPG
        if lpg_primary:
            daily_consumption *= 1.12
        else:
            daily_consumption *= 0.78

        # Additional cooking intensity
        if high_intensity:
            daily_consumption *= 1.15

        # Temporary behavioural events
        if usage_change == "more":
             daily_consumption *= rng.uniform(1.15, 1.35)

        elif usage_change == "less":
             daily_consumption *= rng.uniform(0.70, 0.88)

        if festive_period:
            daily_consumption *= rng.uniform(1.02, 1.10)

        # Persistent household-specific consumption tendency
        daily_consumption *= latent_factor

        # Calibration factor to keep synthetic refill durations
        # within a plausible household range
        daily_consumption *= 1.12

        # Cycle-level random variation
        daily_consumption *= rng.normal(1.0, 0.07)

        # Prevent nonsensical values
        daily_consumption = max(daily_consumption, 0.08)

        # ----------------------------------------------------
        # ACTUAL CYCLE DURATION
        # ----------------------------------------------------

        theoretical_cycle_days = (
            refill_quantity / daily_consumption
        )

        # Add real-world behavioural variation
        cycle_noise = rng.normal(
            loc=0,
            scale=max(1.0, theoretical_cycle_days * 0.06)
        )

        actual_cycle_days = (
            theoretical_cycle_days + cycle_noise
        )

        # Keep within realistic household bounds
        actual_cycle_days = int(
            np.clip(
                round(actual_cycle_days),
                6,
                75
            )
        )

        # ----------------------------------------------------
        # HISTORICAL FEATURES
        # ----------------------------------------------------

        if len(previous_cycles) == 0:
            previous_cycle_days = np.nan
            avg_previous_cycle_days = np.nan

        else:
            previous_cycle_days = previous_cycles[-1]
            avg_previous_cycle_days = float(
                np.mean(previous_cycles)
            )

        number_previous_cycles = len(previous_cycles)

        # ----------------------------------------------------
        # RECORD
        # ----------------------------------------------------

        records.append(
            {
                "user_id": user_id,
                "refill_cycle_id":
                    f"{user_id}_C{cycle_number:02d}",

                "refill_date": refill_date,

                "cylinder_size_kg":
                    cylinder_size,

                "refill_quantity_kg":
                    round(refill_quantity, 2),

                "household_size":
                    household_size,

                "meals_per_day":
                    meals_per_day,

                "cooking_days_per_week":
                    cooking_days,

                "lpg_primary_fuel":
                    lpg_primary,

                
                "usage_change": usage_change,

                "festive_period":
                    festive_period,

                "refill_month":
                    month,

                "previous_cycle_days":
                    previous_cycle_days,

                "average_previous_cycle_days":
                    avg_previous_cycle_days,

                "number_previous_cycles":
                    number_previous_cycles,

                # TARGET
                "actual_cycle_days":
                    actual_cycle_days
            }
        )

        previous_cycles.append(actual_cycle_days)

        # Next refill date follows the cycle duration
        refill_date = refill_date + pd.Timedelta(
            days=actual_cycle_days
        )

# ============================================================
# CREATE DATAFRAME
# ============================================================

model_df = pd.DataFrame(records)

# ============================================================
# BASIC VALIDATION
# ============================================================

print("\n========== GENERATED DATA ==========\n")
print("Shape:", model_df.shape)

print("\nTarget summary:")
print(model_df["actual_cycle_days"].describe())

print("\nCylinder distribution:")
print(model_df["cylinder_size_kg"].value_counts())

print("\nHousehold size:")
print(model_df["household_size"].describe())

print("\nMeals/day:")
print(model_df["meals_per_day"].value_counts())

print("\nMissing historical features:")
print(
    model_df[
        [
            "previous_cycle_days",
            "average_previous_cycle_days"
        ]
    ].isna().sum()
)

print("\nTarget by cylinder size:")
print(
    model_df.groupby(
        "cylinder_size_kg"
    )["actual_cycle_days"].agg(
        ["count", "mean", "median", "std", "min", "max"]
    )
)

# ============================================================
# SAVE
# ============================================================

output_path = (
    PROCESSED_DIR /
    "refill_cycles_model.csv"
)

model_df.to_csv(
    output_path,
    index=False
)

print(
    f"\nSaved modelling dataset to:\n{output_path}"
)