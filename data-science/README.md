# FlameIQ Data Science

## Overview

FlameIQ is a household LPG refill prediction and marketplace solution designed to help users estimate when their cooking gas is likely to run out and plan a refill before an unexpected shortage occurs.

The Data Science component focuses on the **Smart Refill Prediction** feature.

Instead of relying on physical cylinder sensors or IoT hardware, the current FlameIQ proof of concept estimates refill-cycle duration from information already available to the platform, including cylinder size, refill quantity, household characteristics, cooking behaviour and previous refill history.

The prediction system uses a progressive personalisation architecture:

```text
New User
   ↓
Cold-Start Prediction
   ↓
Household + Cooking Behaviour
   ↓
Initial Refill Estimate


Returning User
   ↓
Personalised Prediction
   ↓
Household + Cooking Behaviour + Refill History
   ↓
More Personalised Refill Estimate
```

The current implementation is a **machine-learning proof of concept trained and evaluated on labelled synthetic refill-cycle data**. The reported performance metrics demonstrate technical feasibility and must not be interpreted as validated production accuracy.


## Prediction Architecture

FlameIQ uses two prediction pathways.

### 1. Cold-Start Prediction

This pathway is used when the customer has no completed historical refill cycle.

The model uses household, refill and cooking-behaviour information to generate an initial estimate.

Selected model:

**Lasso Regression**

### 2. Personalised Prediction

Once at least one previous refill cycle is available, FlameIQ switches to the personalised pathway.

This model incorporates the customer's historical refill behaviour alongside their current household and cooking characteristics.

Selected model:

**Gradient Boosting Regressor**

The architecture allows FlameIQ to make a useful first estimate while progressively learning the user's refill pattern as additional refill history becomes available.


## Data Sources

The Data Science workspace contains the original analytical datasets supplied for the FlameIQ project:

```text
users_dim.csv
orders_fact.csv
vendors_dim.csv
```

These datasets are primarily used for user, transaction, vendor and marketplace analysis.

The prediction modelling dataset is:

```text
refill_cycles_model.csv
```

### Synthetic Refill-Cycle Dataset

FlameIQ did not have longitudinal production refill history available before the hackathon.

A separate labelled synthetic refill-cycle dataset was therefore created for proof-of-concept model development.

The validated dataset contains:

```text
8,368 refill cycles
1,257 household users
6 kg and 12.5 kg household cylinders
```

The synthetic generation process incorporates realistic relationships between:

- cylinder capacity;
- actual refill quantity;
- household size;
- meals cooked with LPG;
- cooking days per week;
- LPG as the primary cooking fuel;
- recent changes in cooking activity;
- seasonal effects; and
- historical refill behaviour.

The dataset was validated before modelling to ensure that the generated relationships behaved logically.

Only **0.63%** of observations reached the 75-day upper simulation boundary, indicating that the target distribution was not materially dominated by artificial clipping.


## Leakage Control

The original transaction dataset contains several fields that are useful for analytics but inappropriate as training features because they represent prediction outputs, outcomes or post-event information.

Examples include:

```text
actual_consumption_cycle_days
days_remaining
predicted_refill_date
current_gas_level_pct
ai_prediction_confidence_pct
prediction_error_days
```

These variables were not used as predictive inputs.

A separate refill-cycle modelling dataset was created to avoid target leakage and to ensure that model features represent information that FlameIQ could realistically know at prediction time.


## Modelling Scope

The current ML proof of concept focuses on **household users**.

The supplied data showed materially different cylinder-size patterns between household and business users. Household customers primarily use 6 kg and 12.5 kg cylinders, while business users use larger cylinder sizes.

Combining both groups in the initial model could allow cylinder size to function as a proxy for customer segment rather than allowing the model to learn household consumption behaviour properly.

The current scope is therefore aligned with the household-first FlameIQ MVP.


## Prediction Target

The prediction problem is formulated as a regression task.

The target variable is:

```text
actual_cycle_days
```

This represents the total duration of a refill cycle in days.

For example:

```text
Last refill date:        1 August
Predicted cycle length:  31 days
Estimated refill date:   1 September
```

The model predicts the expected refill-cycle duration. Product recommendation logic is applied separately.


## Model Features

### Cold-Start Features

The cold-start model uses:

```text
cylinder_size_kg
refill_quantity_kg
household_size
meals_per_day
cooking_days_per_week
lpg_primary_fuel
usage_change
festive_period
month_sin
month_cos
```

`month_sin` and `month_cos` provide cyclical month representation.

`festive_period` is derived from the refill date rather than manually entered by the user.


### Personalised Features

The personalised model uses all cold-start features plus:

```text
previous_cycle_days
average_previous_cycle_days
number_previous_cycles
```

Historical fields should normally be calculated automatically from the user's saved refill history rather than entered manually through the frontend.


## Model Development

The following approaches were compared:

```text
Baseline
Linear Regression
Lasso Regression
Elastic Net
Random Forest Regressor
Gradient Boosting Regressor
```

Separate experiments were conducted for the cold-start and personalised pathways.

### Train/Test Strategy

The dataset was split using `user_id` groups rather than a simple random row split.

This prevents the same household from being intentionally represented in both the training and test sets and provides a more conservative estimate of performance on unseen users.


## Evaluation Metrics

Mean Absolute Error was used as the primary selection metric because it expresses prediction error directly in days.

The evaluation also included:

```text
MAE
RMSE
R²
Predictions within ±2 days
Predictions within ±5 days
Late-prediction rate
```

For a refill prediction product, MAE and prediction-window performance are more intuitive than describing regression performance as a generic "accuracy percentage".


## Model Results

| Pathway | Selected Model | Baseline MAE | Model MAE | Within ±5 Days | R² |
|---|---|---:|---:|---:|---:|
| Cold Start | Lasso Regression | 7.52 days | 4.58 days | 65.1% | 0.75 |
| Personalised | Gradient Boosting | 5.25 days | 3.32 days | 77.5% | 0.86 |

### Cold Start

The cold-start Lasso model reduced MAE from:

```text
7.52 days → 4.58 days
```

This represents approximately a **39% reduction in MAE** relative to the cold-start baseline.

### Personalised

The personalised Gradient Boosting model reduced MAE from:

```text
5.25 days → 3.32 days
```

This represents approximately a **37% reduction in MAE** relative to the personalised baseline.

The personalised model also reduces MAE by approximately **27%** relative to the selected cold-start model.

These results support FlameIQ's progressive-personalisation design.

**All performance figures are based on labelled synthetic proof-of-concept data and are not validated production performance claims.**


## Personalisation Stages

Detailed evaluation showed that the largest improvement from refill history occurs once at least two previous refill cycles are available.

The serving layer therefore exposes three user-facing personalisation stages:

```text
0 previous cycles
→ Early Estimate

1 previous cycle
→ Building Personalisation

2+ previous cycles
→ Established Personalisation
```

These labels describe the amount of user-specific history available to the model.

They are **not calibrated probability scores** and should not be presented as numerical confidence percentages.


## Model Interpretation

### Cold-Start Model

The Lasso model produced logically consistent feature directions.

Examples include:

```text
Higher refill quantity
→ longer predicted refill cycle

Larger household
→ shorter predicted refill cycle

More meals cooked with gas
→ shorter predicted refill cycle

LPG as primary cooking fuel
→ shorter predicted refill cycle

Cooking more than usual
→ shorter predicted refill cycle

Cooking less than usual
→ longer predicted refill cycle
```

### Personalised Model

The strongest feature in the personalised Gradient Boosting model was:

```text
average_previous_cycle_days
```

followed by:

```text
refill_quantity_kg
usage_change
lpg_primary_fuel
household_size
meals_per_day
```

This supports the central product hypothesis that predictions become increasingly user-specific once FlameIQ has observed actual refill history.


## Refill Recommendation Safety Buffer

The statistical model prediction is kept separate from the operational refill recommendation.

The model estimates the expected refill-cycle duration.

FlameIQ then recommends action slightly earlier to reduce the risk of the customer reaching the estimated depletion point before ordering another refill.

Synthetic PoC error analysis resulted in the following recommendation buffers:

```text
Cold Start
→ 4 days before the estimated refill date

Personalised
→ 3 days before the estimated refill date
```

Example:

```text
Predicted refill/depletion date:
31 August

Cold-start recommendation:
27 August

Personalised recommendation:
28 August
```

The safety buffer does not alter the underlying ML prediction. It belongs to the product recommendation layer.

These buffers should be re-evaluated using real production refill data.


## Prediction Status

The prediction service can return the following statuses:

```text
okay
refill_soon
refill_now
overdue
```

### `okay`

The recommended refill date is more than three days away.

### `refill_soon`

The recommendation window begins within the next three days.

### `refill_now`

The user has reached the recommended refill period but has not yet passed the estimated refill/depletion date.

### `overdue`

The model's estimated refill/depletion date has already passed.


## Low Gas Indicator

The serving layer returns:

```text
low_gas
```

as a boolean field.

This is **prediction-based** and does not represent a physical measurement of LPG remaining in the cylinder.

The current FlameIQ PoC does not use a gas-level sensor.

The UI should therefore avoid presenting model output as an exact physical gas percentage.


## Project Structure

```text
data-science/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── synthetic/
│
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_synthetic_data_validation.ipynb
│   ├── 03_model_experiments.ipynb
│   └── 04_model_evaluation.ipynb
│
├── src/
│   ├── audit_data.py
│   ├── model_readiness_audit.py
│   ├── generate_refill_cycles.py
│   ├── validate_refill_cycles.py
│   ├── train_models.py
│   ├── predict.py
│   └── test_predict.py
│
├── models/
│   ├── cold_start_model.joblib
│   └── personalised_model.joblib
│
├── reports/
│   ├── model_comparison.csv
│   ├── cold_start_test_predictions.csv
│   └── personalised_test_predictions.csv
│
├── documentation/
│   └── backend_prediction_contract.md
│
└── README.md
```


## Notebooks

### `01_data_exploration.ipynb`

Explores the supplied datasets, identifies the household modelling scope and documents leakage risks.

### `02_synthetic_data_validation.ipynb`

Validates target distributions, household behaviour relationships, refill sequencing, cold-start cases and historical refill structure.

### `03_model_experiments.ipynb`

Documents model experimentation, baseline comparisons and selection of Lasso and Gradient Boosting.

### `04_model_evaluation.ipynb`

Provides detailed model evaluation including:

```text
error analysis
subgroup performance
Lasso coefficients
Gradient Boosting feature importance
large-error analysis
safety-buffer analysis
performance by refill-history depth
```


## Reproducible Scripts

The analytical workflow is also implemented as Python scripts so the project can be reproduced without manually executing notebook cells.

### Audit Source Data

```bash
python data-science/src/audit_data.py
```

### Assess Model Readiness

```bash
python data-science/src/model_readiness_audit.py
```

### Generate Synthetic Refill Cycles

```bash
python data-science/src/generate_refill_cycles.py
```

### Validate Generated Dataset

```bash
python data-science/src/validate_refill_cycles.py
```

### Train and Compare Models

```bash
python data-science/src/train_models.py
```

### Run Prediction Demo

```bash
python data-science/src/predict.py
```

### Run Prediction Tests

```bash
python data-science/src/test_predict.py
```


## Environment Setup

From the repository root, install the project dependencies:

```bash
pip install -r requirements.txt
```

Activate the project virtual environment where applicable before running the Data Science scripts.


## Prediction Service

The serving entry point is:

```python
from predict import predict_refill
```

Example:

```python
payload = {
    "cylinder_size_kg": 12.5,
    "refill_quantity_kg": 12.5,
    "household_size": 4,
    "meals_per_day": 2,
    "cooking_days_per_week": 7,
    "lpg_primary_fuel": "yes",
    "usage_change": "normal",
    "last_refill_date": "2026-08-01",
    "number_previous_cycles": 0
}

result = predict_refill(payload)
```

The function automatically determines whether the cold-start or personalised pathway should be used.


## Example Prediction Output

```json
{
  "estimated_cycle_days": 35,
  "estimated_days_remaining": 25,
  "days_overdue": 0,
  "estimated_refill_date": "2026-09-05",
  "recommended_refill_date": "2026-09-02",
  "recommended_refill_window": {
    "start": "2026-09-02",
    "end": "2026-09-04"
  },
  "status": "okay",
  "low_gas": false,
  "personalization_stage": "Established Personalisation",
  "top_reasons": [
    "Your previous refill cycles average about 30 days",
    "12.5 kg refill quantity",
    "4-person household"
  ],
  "recommended_action": "Plan your next refill from 02 Sep 2026.",
  "predictor_type": "ml_poc",
  "prediction_pathway": "personalised",
  "model_version": "flameiq-personalised-v1",
  "data_basis": "synthetic_poc",
  "safety_buffer_days": 3,
  "degraded": false
}
```


## Backend Integration

The detailed Backend request/response contract is available at:

```text
data-science/documentation/backend_prediction_contract.md
```

Backend should derive historical refill variables from stored refill events rather than asking users to manually provide historical statistics.


## Current PoC Scope

The current prediction system supports:

```text
Household users
6 kg cylinders
12.5 kg cylinders
Full refills
Partial refills
Cold-start prediction
Personalised prediction
```

The current system does not support:

```text
25 kg or 50 kg ML predictions
Commercial/business LPG prediction
Physical cylinder gas-level measurement
Sensor-based gas monitoring
Production-calibrated probability confidence
Validated production performance claims
```


## Important Limitations

The current models were trained on synthetic refill-cycle data.

Although the synthetic dataset was designed and validated to reproduce logical household LPG consumption relationships, synthetic data cannot capture every behavioural, operational or market factor present in real customer activity.

The model should therefore be treated as a technical proof of concept.

Potential real-world factors not fully represented may include:

```text
changes in burner efficiency
shared cylinders
unrecorded external refills
travel periods
household visitors
gas leakage
unusual cooking events
differences in appliance efficiency
incorrect refill quantity records
changing household composition
```

Real refill outcomes should be collected after launch and used to validate or replace synthetic assumptions.


## Model Versioning

Current proof-of-concept model versions:

```text
flameiq-coldstart-v1
flameiq-personalised-v1
```

Current data basis:

```text
synthetic_poc
```

These values are returned in every prediction response to support traceability.


## Next Steps

The transition from proof of concept to production should include:

1. Collect real refill events and actual refill dates.
2. Reconstruct longitudinal user refill cycles.
3. Monitor missing, inconsistent and externally completed refill records.
4. Compare PoC predictions with real observed refill outcomes.
5. Retrain the prediction models using real longitudinal data.
6. Re-evaluate model features and user segments.
7. Reassess the 3-day and 4-day recommendation buffers.
8. Develop calibrated uncertainty estimates if required.
9. Expand modelling to additional cylinder sizes where sufficient data exists.
10. Evaluate the business/commercial LPG segment separately.
11. Monitor model drift and prediction performance after deployment.
12. Version and document future production models.


## Proof-of-Concept Summary

The FlameIQ Data Science workstream demonstrates that an LPG refill prediction system can be built without physical cylinder sensors by combining household behaviour, refill information and historical usage patterns.

The proof of concept produced two complementary prediction pathways:

```text
Cold Start
Lasso Regression
MAE ≈ 4.58 days

Personalised
Gradient Boosting
MAE ≈ 3.32 days
```

The improvement observed after refill history becomes available supports FlameIQ's core progressive-personalisation concept:

> Start with a useful estimate, learn from each refill, and progressively personalise the next refill prediction.

All reported model performance remains explicitly labelled as synthetic proof-of-concept performance until validated against real longitudinal FlameIQ refill data.