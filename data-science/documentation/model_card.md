# FlameIQ Refill Prediction Model Card

## Model Overview

**Project:** FlameIQ  
**Component:** Smart Refill Prediction  
**Model Type:** Regression  
**Development Stage:** Proof of Concept  
**Data Basis:** Labelled synthetic refill-cycle data  
**Primary Users:** Household LPG customers  

FlameIQ estimates the expected duration of a household LPG refill cycle without requiring physical gas-level sensors.

The system uses two machine-learning pathways:

1. A cold-start model for users with no previous refill history.
2. A personalised model for users with one or more completed refill cycles.


## Intended Use

The models are intended to support the FlameIQ Smart Refill feature by estimating:

- total refill-cycle duration;
- estimated refill date;
- estimated days remaining;
- an earlier recommended refill window; and
- user-facing personalisation status.

The prediction is intended to help customers plan LPG refills before an unexpected shortage occurs.


## Out-of-Scope Use

The current proof-of-concept models should not be used for:

- physical measurement of gas remaining in a cylinder;
- safety-critical LPG monitoring;
- leakage detection;
- commercial or industrial LPG consumption forecasting;
- 25 kg or 50 kg cylinder prediction;
- production performance claims;
- calibrated probability confidence scores.

The current supported household cylinder sizes are:

```text
6 kg
12.5 kg
```


## Prediction Target

The modelling target is:

```text
actual_cycle_days
```

This represents the total duration, in days, between the start of one refill cycle and the next refill event.


## Data

### Source Data

The project received three analytical datasets:

```text
users_dim.csv
orders_fact.csv
vendors_dim.csv
```

These datasets were used to understand users, transactions and marketplace activity.

### Modelling Dataset

A separate refill-cycle dataset was generated:

```text
refill_cycles_model.csv
```

Validated dataset size:

```text
8,368 refill cycles
1,257 household users
```

The modelling dataset contains 6 kg and 12.5 kg household refill cycles.


## Synthetic Data Disclosure

FlameIQ did not have longitudinal production refill history available before the hackathon.

The refill-cycle modelling dataset was therefore generated synthetically for proof-of-concept development.

Synthetic relationships were designed around household and LPG-use variables including:

- cylinder size;
- actual refill quantity;
- household size;
- meal frequency;
- cooking days per week;
- LPG as primary cooking fuel;
- recent changes in cooking behaviour;
- seasonality; and
- previous refill-cycle behaviour.

The synthetic dataset was validated before model training.

All reported performance metrics in this document refer to synthetic proof-of-concept test data and must not be represented as validated production performance.


## Leakage Controls

Fields representing outcomes, model outputs or post-event information were excluded from predictive inputs.

Examples include:

```text
actual_consumption_cycle_days
days_remaining
predicted_refill_date
current_gas_level_pct
ai_prediction_confidence_pct
prediction_error_days
```

The model was designed to use information that could realistically be available when a refill prediction is requested.


## Cold-Start Model

### Intended User

A household user with:

```text
number_previous_cycles = 0
```

### Selected Algorithm

```text
Lasso Regression
```

### Features

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

### Model Version

```text
flameiq-coldstart-v1
```


## Personalised Model

### Intended User

A household user with:

```text
number_previous_cycles > 0
```

### Selected Algorithm

```text
Gradient Boosting Regressor
```

### Features

The personalised model uses all cold-start features plus:

```text
previous_cycle_days
average_previous_cycle_days
number_previous_cycles
```

### Model Version

```text
flameiq-personalised-v1
```


## Models Evaluated

The following approaches were evaluated for each prediction pathway:

```text
Baseline
Linear Regression
Lasso Regression
Elastic Net
Random Forest Regressor
Gradient Boosting Regressor
```


## Train/Test Methodology

Train/test splitting was performed by:

```text
user_id
```

rather than randomly splitting individual refill-cycle rows.

This reduces the risk of the same household appearing in both the training and test sets and provides a more conservative assessment of generalisation to unseen households.


## Evaluation Metrics

The following metrics were evaluated:

```text
Mean Absolute Error (MAE)
Root Mean Squared Error (RMSE)
R²
Percentage within ±2 days
Percentage within ±5 days
Late-prediction rate
```

MAE was used as the primary model-selection metric because the error can be interpreted directly in days.


## Cold-Start Performance

Selected model:

```text
Lasso Regression
```

Synthetic PoC test performance:

| Metric | Result |
|---|---:|
| MAE | 4.58 days |
| RMSE | 6.02 days |
| R² | 0.75 |
| Within ±2 days | 31.75% |
| Within ±5 days | 65.08% |
| Baseline MAE | 7.52 days |

The selected model reduced MAE by approximately 39% relative to the cold-start baseline.


## Personalised Performance

Selected model:

```text
Gradient Boosting Regressor
```

Synthetic PoC test performance:

| Metric | Result |
|---|---:|
| MAE | 3.32 days |
| RMSE | 4.46 days |
| R² | 0.86 |
| Within ±2 days | 42.62% |
| Within ±5 days | 77.48% |
| Baseline MAE | 5.25 days |

The selected model reduced MAE by approximately 37% relative to the personalised baseline.


## Value of Personalisation

The selected cold-start model produced an MAE of approximately:

```text
4.58 days
```

The personalised model produced an MAE of approximately:

```text
3.32 days
```

This represents an additional reduction in MAE of approximately 27% once refill-history information becomes available.


## Personalisation Stages

Evaluation by refill-history depth produced the following pattern:

| Refill History | MAE |
|---|---:|
| 1 previous cycle | 4.03 days |
| 2 previous cycles | 3.20 days |
| 3–4 previous cycles | 3.15 days |
| 5+ previous cycles | 3.17 days |

The largest improvement occurs once at least two previous refill cycles are available.

The serving layer therefore uses:

```text
0 previous cycles
→ Early Estimate

1 previous cycle
→ Building Personalisation

2+ previous cycles
→ Established Personalisation
```

These labels describe historical data availability and are not calibrated statistical probabilities.


## Model Interpretation

### Cold-Start Lasso

The model produced logically consistent relationships.

Examples include:

```text
Higher refill quantity
→ longer predicted refill cycle

Larger household
→ shorter predicted refill cycle

More meals per day
→ shorter predicted refill cycle

LPG as primary fuel
→ shorter predicted refill cycle

Cooking more than usual
→ shorter predicted refill cycle

Cooking less than usual
→ longer predicted refill cycle
```

### Personalised Gradient Boosting

The strongest feature was:

```text
average_previous_cycle_days
```

with approximately 69.7% of fitted feature importance.

Other important variables included:

```text
refill_quantity_kg
usage_change
lpg_primary_fuel
household_size
meals_per_day
```

This supports the use of historical refill behaviour as the central source of personalisation.


## Recommendation Safety Buffer

The model prediction and product recommendation are deliberately separated.

The model estimates expected refill-cycle duration.

FlameIQ then recommends action slightly before the predicted refill point.

### Cold Start

```text
4-day safety buffer
```

### Personalised

```text
3-day safety buffer
```

Synthetic safety-buffer analysis showed:

### Cold Start

At a 4-day buffer:

```text
75.0% of recommendations occurred on or before the actual cycle endpoint.
25.0% remained late.
```

### Personalised

At a 3-day buffer:

```text
77.7% of recommendations occurred on or before the actual cycle endpoint.
22.3% remained late.
```

These buffers are product-risk decisions and do not modify the underlying model estimate.

They should be reassessed using real production data.


## Prediction Range

The serving layer currently provides planning ranges around the estimated refill date.

These ranges are based on proof-of-concept error behaviour.

They are not:

```text
95% confidence intervals
```

and should not be represented as statistically calibrated uncertainty.


## Low-Gas Indicator

The serving layer can return:

```text
low_gas = true
```

when a user reaches the recommended refill period.

This does not mean that FlameIQ has physically measured the cylinder.

The current system does not contain a gas-level sensor.

`low_gas` is therefore a prediction-driven product status rather than a physical gas-level measurement.


## Validation and Testing

The prediction service was tested against:

- valid cold-start prediction;
- one-cycle personalisation;
- established personalisation;
- partial refills;
- increased cooking behaviour;
- reduced cooking behaviour;
- unsupported cylinder sizes;
- refill quantities greater than cylinder capacity;
- future refill dates;
- missing historical values;
- refill-now status; and
- overdue status.

Invalid inputs are rejected with explicit validation errors rather than silently generating predictions.


## Known Limitations

The most important limitation is the use of synthetic modelling data.

Real LPG consumption may be influenced by factors that are not fully represented in the current simulation, including:

- appliance and burner efficiency;
- gas leakage;
- shared cylinders;
- household visitors;
- travel;
- unusual events;
- unlogged external refills;
- inaccurate refill quantities;
- changing household composition;
- changes in cooking appliances;
- inconsistent user reporting.

The current proof of concept also excludes business users and larger commercial cylinders.


## Fairness and User Impact

Prediction performance may differ between household types if real user behaviour differs from the synthetic assumptions.

The system should therefore avoid presenting estimates as guarantees.

User-facing communication should use language such as:

```text
Estimated refill date
Recommended refill window
Early Estimate
Building Personalisation
Established Personalisation
```

rather than presenting artificial certainty.


## Production Requirements

Before production validation, FlameIQ should:

1. Collect real refill events.
2. Capture outside-platform refill events where possible.
3. Reconstruct actual longitudinal refill cycles.
4. Monitor data quality.
5. Evaluate prediction performance against real outcomes.
6. Compare performance across relevant user groups.
7. Retrain models using real refill data.
8. Re-evaluate safety buffers.
9. Develop calibrated uncertainty where required.
10. Monitor model drift.
11. Version future model releases.


## Model Artifacts

Current saved model files:

```text
data-science/models/cold_start_model.joblib
data-science/models/personalised_model.joblib
```

Prediction service:

```text
data-science/src/predict.py
```

Prediction tests:

```text
data-science/src/test_predict.py
```

Backend integration contract:

```text
data-science/documentation/backend_prediction_contract.md
```


## Model Status

```text
Development Stage: Proof of Concept
Data Basis: Synthetic
Production Validated: No
Physical Sensor Required: No
Household Prediction: Supported
6 kg Prediction: Supported
12.5 kg Prediction: Supported
25 kg / 50 kg Prediction: Not Supported
Business Prediction: Not Supported
```

## Summary

The FlameIQ proof of concept demonstrates a progressive LPG refill-prediction architecture in which a useful first estimate can be generated without historical data and subsequently improved using the customer's actual refill behaviour.

The selected models are:

```text
Cold Start
→ Lasso Regression
→ MAE ≈ 4.58 days

Personalised
→ Gradient Boosting Regressor
→ MAE ≈ 3.32 days
```

These results demonstrate technical feasibility on labelled synthetic data.

Real longitudinal refill data is required before production accuracy, reliability or confidence claims can be established.