from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "refill_cycles_model.csv"
)

df = pd.read_csv(DATA_PATH)

print("\n========== BASIC SHAPE ==========\n")
print(df.shape)

print("\n========== TARGET DISTRIBUTION ==========\n")
print(df["actual_cycle_days"].describe())

print("\n========== TARGET BY CYLINDER SIZE ==========\n")
print(
    df.groupby("cylinder_size_kg")["actual_cycle_days"]
    .agg(["count", "mean", "median", "std", "min", "max"])
)

print("\n========== PERCENT AT LIMITS ==========\n")

pct_min = (df["actual_cycle_days"] <= 6).mean() * 100
pct_max = (df["actual_cycle_days"] >= 75).mean() * 100

print(f"At minimum 6 days: {pct_min:.2f}%")
print(f"At maximum 75 days: {pct_max:.2f}%")

print("\n75-day rows by cylinder:")
print(
    df.loc[
        df["actual_cycle_days"] == 75,
        "cylinder_size_kg"
    ].value_counts()
)

print("\n========== TARGET QUANTILES ==========\n")

print(
    df["actual_cycle_days"].quantile(
        [
            0.01,
            0.05,
            0.10,
            0.25,
            0.50,
            0.75,
            0.90,
            0.95,
            0.99
        ]
    )
)

print("\n========== FEATURE CORRELATIONS ==========\n")

numeric_features = [
    "cylinder_size_kg",
    "refill_quantity_kg",
    "household_size",
    "meals_per_day",
    "cooking_days_per_week",
    "lpg_primary_fuel",
    "festive_period",
    "previous_cycle_days",
    "average_previous_cycle_days",
    "number_previous_cycles",
    "actual_cycle_days"
]

corr = (
    df[numeric_features]
    .corr(numeric_only=True)["actual_cycle_days"]
    .sort_values(ascending=False)
)

print(corr)

print("\n========== USAGE CHANGE ==========\n")

print(df["usage_change"].value_counts())

print("\nMean target by usage change:")

print(
    df.groupby("usage_change")["actual_cycle_days"]
    .agg(["count", "mean", "median"])
)

print("\n========== COLD START VS RETURNING ==========\n")

cold = df[df["number_previous_cycles"] == 0]
returning = df[df["number_previous_cycles"] > 0]

print("Cold-start rows:", len(cold))
print("Returning rows:", len(returning))

print("\nCold-start target:")
print(cold["actual_cycle_days"].describe())

print("\nReturning-user target:")
print(returning["actual_cycle_days"].describe())

print("\n========== DUPLICATES ==========\n")

print(
    "Duplicate cycle IDs:",
    df["refill_cycle_id"].duplicated().sum()
)

print("\n========== DATE SEQUENCE CHECK ==========\n")

df["refill_date"] = pd.to_datetime(
    df["refill_date"],
    errors="coerce"
)

bad_sequences = 0

for _, group in (
    df.sort_values(["user_id", "refill_date"])
    .groupby("user_id")
):
    if not group["refill_date"].is_monotonic_increasing:
        bad_sequences += 1

print(
    "Users with invalid date sequence:",
    bad_sequences
)

print("\n========== WITHIN-CYLINDER CORRELATIONS ==========\n")

for size in sorted(df["cylinder_size_kg"].unique()):
    subset = df[df["cylinder_size_kg"] == size]

    print(f"\nCylinder size: {size} kg")

    cols = [
        "household_size",
        "meals_per_day",
        "refill_quantity_kg",
        "actual_cycle_days"
    ]

    print(
        subset[cols]
        .corr(numeric_only=True)["actual_cycle_days"]
        .sort_values(ascending=False)
    )

print("\n========== VALIDATION COMPLETE ==========\n")