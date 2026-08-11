from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import (
    ElasticNet,
    Lasso,
    LinearRegression,
)
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# ============================================================
# CONFIGURATION
# ============================================================

RANDOM_SEED = 42

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "refill_cycles_model.csv"
)

MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(DATA_PATH)

df["refill_date"] = pd.to_datetime(
    df["refill_date"],
    errors="coerce"
)

# Cyclical month encoding
df["month_sin"] = np.sin(
    2 * np.pi * df["refill_month"] / 12
)

df["month_cos"] = np.cos(
    2 * np.pi * df["refill_month"] / 12
)

TARGET = "actual_cycle_days"


# ============================================================
# FEATURE DEFINITIONS
# ============================================================

# Available even for brand-new users
COLD_START_FEATURES = [
    "cylinder_size_kg",
    "refill_quantity_kg",
    "household_size",
    "meals_per_day",
    "cooking_days_per_week",
    "lpg_primary_fuel",
    "usage_change",
    "festive_period",
    "month_sin",
    "month_cos",
]

# Returning users also have historical refill behaviour
PERSONALISED_FEATURES = (
    COLD_START_FEATURES
    + [
        "previous_cycle_days",
        "average_previous_cycle_days",
        "number_previous_cycles",
    ]
)


# ============================================================
# SPLIT DATA BY USER
# ============================================================

def group_split(data):
    """
    Split by user_id so the same household does not
    appear in both train and test sets.
    """

    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.20,
        random_state=RANDOM_SEED,
    )

    train_idx, test_idx = next(
        splitter.split(
            data,
            groups=data["user_id"]
        )
    )

    train = data.iloc[train_idx].copy()
    test = data.iloc[test_idx].copy()

    return train, test


# Cold-start = first cycle for each household
cold_data = df.loc[
    df["number_previous_cycles"] == 0
].copy()

# Personalised = at least one previous cycle exists
personalised_data = df.loc[
    df["number_previous_cycles"] > 0
].copy()

cold_train, cold_test = group_split(cold_data)

personal_train, personal_test = group_split(
    personalised_data
)


# ============================================================
# PREPROCESSING
# ============================================================

def build_preprocessor(features):

    categorical_features = [
        feature
        for feature in features
        if feature == "usage_change"
    ]

    numerical_features = [
        feature
        for feature in features
        if feature not in categorical_features
    ]

    numerical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),
            (
                "scaler",
                StandardScaler()
            ),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="most_frequent"
                )
            ),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False
                )
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                numerical_pipeline,
                numerical_features,
            ),
            (
                "categorical",
                categorical_pipeline,
                categorical_features,
            ),
        ]
    )

    return preprocessor


# ============================================================
# METRICS
# ============================================================

def calculate_metrics(y_true, y_pred):

    error = np.abs(y_true - y_pred)

    mae = mean_absolute_error(
        y_true,
        y_pred
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_true,
            y_pred
        )
    )

    r2 = r2_score(
        y_true,
        y_pred
    )

    within_2 = (
        (error <= 2).mean() * 100
    )

    within_5 = (
        (error <= 5).mean() * 100
    )

    # Predicted depletion later than actual depletion
    # = user may run out before warning
    late_rate = (
        (y_pred > y_true).mean() * 100
    )

    return {
        "MAE_days": round(mae, 3),
        "RMSE_days": round(rmse, 3),
        "R2": round(r2, 3),
        "Within_2_days_pct": round(
            within_2,
            2
        ),
        "Within_5_days_pct": round(
            within_5,
            2
        ),
        "Late_prediction_pct": round(
            late_rate,
            2
        ),
    }


# ============================================================
# MODELS
# ============================================================

MODELS = {
    "Linear Regression": LinearRegression(),

    "Lasso": Lasso(
        alpha=0.05,
        max_iter=10000,
    ),

    "Elastic Net": ElasticNet(
        alpha=0.05,
        l1_ratio=0.5,
        max_iter=10000,
        random_state=RANDOM_SEED,
    ),

    "Random Forest": RandomForestRegressor(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=3,
        random_state=RANDOM_SEED,
        n_jobs=-1,
    ),

    "Gradient Boosting": GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=3,
        random_state=RANDOM_SEED,
    ),
}


# ============================================================
# TRAINING FUNCTION
# ============================================================

def train_pathway(
    pathway_name,
    train_data,
    test_data,
    features,
):

    print(
        f"\n{'=' * 60}"
        f"\n{pathway_name.upper()}"
        f"\n{'=' * 60}\n"
    )

    X_train = train_data[features]
    y_train = train_data[TARGET]

    X_test = test_data[features]
    y_test = test_data[TARGET]

    results = []
    fitted_models = {}

    # --------------------------------------------------------
    # BASELINE
    # --------------------------------------------------------

    if pathway_name == "Cold Start":

        # Median duration for each cylinder size,
        # estimated from training data only
        cylinder_medians = (
            train_data
            .groupby("cylinder_size_kg")[TARGET]
            .median()
        )

        overall_median = train_data[
            TARGET
        ].median()

        baseline_pred = (
            test_data["cylinder_size_kg"]
            .map(cylinder_medians)
            .fillna(overall_median)
            .to_numpy()
        )

    else:

        # Returning user baseline:
        # predict the user's historical average
        baseline_pred = (
            test_data[
                "average_previous_cycle_days"
            ]
            .fillna(
                train_data[TARGET].median()
            )
            .to_numpy()
        )

    baseline_metrics = calculate_metrics(
        y_test.to_numpy(),
        baseline_pred
    )

    baseline_metrics.update(
        {
            "Pathway": pathway_name,
            "Model": "Baseline",
        }
    )

    results.append(baseline_metrics)

    print("Baseline:")
    print(baseline_metrics)

    # --------------------------------------------------------
    # ML MODELS
    # --------------------------------------------------------

    for model_name, estimator in MODELS.items():

        pipeline = Pipeline(
            steps=[
                (
                    "preprocessor",
                    build_preprocessor(features)
                ),
                (
                    "model",
                    estimator
                ),
            ]
        )

        pipeline.fit(
            X_train,
            y_train
        )

        predictions = pipeline.predict(
            X_test
        )

        metrics = calculate_metrics(
            y_test.to_numpy(),
            predictions
        )

        metrics.update(
            {
                "Pathway": pathway_name,
                "Model": model_name,
            }
        )

        results.append(metrics)

        fitted_models[
            model_name
        ] = pipeline

        print(f"\n{model_name}:")
        print(metrics)

    # --------------------------------------------------------
    # SELECT BEST ML MODEL BY MAE
    # --------------------------------------------------------

    model_results = [
        row
        for row in results
        if row["Model"] != "Baseline"
    ]

    best_result = min(
        model_results,
        key=lambda x: x["MAE_days"]
    )

    best_name = best_result["Model"]
    best_model = fitted_models[best_name]

    print(
        f"\nBEST {pathway_name.upper()} MODEL:"
        f" {best_name}"
    )

    print(
        f"MAE: "
        f"{best_result['MAE_days']} days"
    )

    # --------------------------------------------------------
    # SAVE BEST MODEL
    # --------------------------------------------------------

    filename = (
        pathway_name
        .lower()
        .replace(" ", "_")
        + "_model.joblib"
    )

    model_path = (
        MODELS_DIR / filename
    )

    joblib.dump(
        best_model,
        model_path
    )

    print(
        f"Saved model to:\n{model_path}"
    )

    # --------------------------------------------------------
    # SAVE TEST PREDICTIONS
    # --------------------------------------------------------

    best_predictions = best_model.predict(
        X_test
    )

    prediction_output = pd.DataFrame(
        {
            "user_id":
                test_data["user_id"].values,

            "refill_cycle_id":
                test_data[
                    "refill_cycle_id"
                ].values,

            "actual_cycle_days":
                y_test.values,

            "predicted_cycle_days":
                np.round(
                    best_predictions,
                    2
                ),

            "absolute_error_days":
                np.round(
                    np.abs(
                        y_test.values
                        - best_predictions
                    ),
                    2
                ),
        }
    )

    prediction_filename = (
        pathway_name
        .lower()
        .replace(" ", "_")
        + "_test_predictions.csv"
    )

    prediction_output.to_csv(
        REPORTS_DIR
        / prediction_filename,
        index=False
    )

    return results, best_result


# ============================================================
# TRAIN BOTH PATHWAYS
# ============================================================

cold_results, cold_best = train_pathway(
    pathway_name="Cold Start",
    train_data=cold_train,
    test_data=cold_test,
    features=COLD_START_FEATURES,
)

personal_results, personal_best = train_pathway(
    pathway_name="Personalised",
    train_data=personal_train,
    test_data=personal_test,
    features=PERSONALISED_FEATURES,
)


# ============================================================
# COMBINE RESULTS
# ============================================================

all_results = (
    cold_results
    + personal_results
)

results_df = pd.DataFrame(
    all_results
)

column_order = [
    "Pathway",
    "Model",
    "MAE_days",
    "RMSE_days",
    "R2",
    "Within_2_days_pct",
    "Within_5_days_pct",
    "Late_prediction_pct",
]

results_df = results_df[
    column_order
]

results_df = results_df.sort_values(
    ["Pathway", "MAE_days"]
)

print(
    "\n========== FINAL MODEL COMPARISON ==========\n"
)

print(
    results_df.to_string(
        index=False
    )
)

results_path = (
    REPORTS_DIR
    / "model_comparison.csv"
)

results_df.to_csv(
    results_path,
    index=False
)

print(
    f"\nSaved comparison report to:\n"
    f"{results_path}"
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print(
    "\n========== SELECTED MODELS ==========\n"
)

print(
    "Cold Start:",
    cold_best["Model"],
    "| MAE:",
    cold_best["MAE_days"],
    "days"
)

print(
    "Personalised:",
    personal_best["Model"],
    "| MAE:",
    personal_best["MAE_days"],
    "days"
)

print(
    "\nTraining complete."
)