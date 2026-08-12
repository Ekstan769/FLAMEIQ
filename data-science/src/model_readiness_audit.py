from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"

users = pd.read_csv(RAW_DIR / "users_dim.csv")
orders = pd.read_csv(RAW_DIR / "orders_fact.csv")

orders["order_timestamp"] = pd.to_datetime(
    orders["order_timestamp"],
    errors="coerce"
)

print("\n========== USER SEGMENTS ==========\n")
print(users["segment"].value_counts(dropna=False))

print("\n========== CYLINDER SIZES ==========\n")
print(users["cylinder_size_kg"].value_counts(dropna=False).sort_index())

print("\n========== CYLINDER SIZE BY SEGMENT ==========\n")
print(
    pd.crosstab(
        users["segment"],
        users["cylinder_size_kg"]
    )
)

print("\n========== ORDERS PER USER ==========\n")
orders_per_user = orders.groupby("user_id").size()

print(orders_per_user.describe())

print("\nUsers with only 1 order:")
print((orders_per_user == 1).sum())

print("\nUsers with 2+ orders:")
print((orders_per_user >= 2).sum())

print("\nUsers with 3+ orders:")
print((orders_per_user >= 3).sum())

print("\n========== ORDER DATE RANGE ==========\n")
print("Earliest:", orders["order_timestamp"].min())
print("Latest:", orders["order_timestamp"].max())

print("\n========== EXISTING TARGET DISTRIBUTION ==========\n")
print(orders["actual_consumption_cycle_days"].describe())

print("\n========== TARGET BY CYLINDER SIZE ==========\n")

merged = orders.merge(
    users[["user_id", "segment", "cylinder_size_kg"]],
    on="user_id",
    how="left"
)

print(
    merged.groupby("cylinder_size_kg")[
        "actual_consumption_cycle_days"
    ].agg(["count", "mean", "median", "std", "min", "max"])
)

print("\n========== TARGET BY SEGMENT ==========\n")
print(
    merged.groupby("segment")[
        "actual_consumption_cycle_days"
    ].agg(["count", "mean", "median", "std", "min", "max"])
)

print("\n========== USER-ID MATCH CHECK ==========\n")
unmatched = orders.loc[
    ~orders["user_id"].isin(users["user_id"]),
    "user_id"
]

print("Orders with unmatched users:", len(unmatched))