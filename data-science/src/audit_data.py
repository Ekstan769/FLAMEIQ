from pathlib import Path
import pandas as pd

# Project paths
BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"

# Load datasets
users = pd.read_csv(RAW_DIR / "users_dim.csv")
orders = pd.read_csv(RAW_DIR / "orders_fact.csv")
vendors = pd.read_csv(RAW_DIR / "vendors_dim.csv")

print("\n================ DATASET SHAPES ================\n")
print(f"Users:   {users.shape}")
print(f"Orders:  {orders.shape}")
print(f"Vendors: {vendors.shape}")

print("\n================ USERS COLUMNS ================\n")
print(users.columns.tolist())

print("\n================ ORDERS COLUMNS ================\n")
print(orders.columns.tolist())

print("\n================ VENDORS COLUMNS ================\n")
print(vendors.columns.tolist())

print("\n================ USERS SAMPLE ================\n")
print(users.head())

print("\n================ ORDERS SAMPLE ================\n")
print(orders.head())

print("\n================ VENDORS SAMPLE ================\n")
print(vendors.head())

print("\n================ MISSING VALUES ================\n")

print("\nUSERS:")
print(users.isna().sum().sort_values(ascending=False))

print("\nORDERS:")
print(orders.isna().sum().sort_values(ascending=False))

print("\nVENDORS:")
print(vendors.isna().sum().sort_values(ascending=False))

print("\n================ DUPLICATES ================\n")
print(f"Users duplicates:   {users.duplicated().sum()}")
print(f"Orders duplicates:  {orders.duplicated().sum()}")
print(f"Vendors duplicates: {vendors.duplicated().sum()}")

print("\n================ DATA TYPES ================\n")

print("\nUSERS:")
print(users.dtypes)

print("\nORDERS:")
print(orders.dtypes)

print("\nVENDORS:")
print(vendors.dtypes)