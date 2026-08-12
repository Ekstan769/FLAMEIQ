# FlameIQ Refill Prediction — Backend Integration Contract

## 1. Purpose

This document defines how the FlameIQ Backend should interact with the Data Science refill prediction component.

The prediction service estimates household LPG refill-cycle duration using one of two machine-learning pathways:

1. **Cold-start prediction** — for users with no previous refill history.
2. **Personalised prediction** — for users with one or more previous refill cycles.

The current implementation is a proof of concept trained and evaluated on labelled synthetic refill-cycle data.

It should therefore be presented as a synthetic-data PoC and not as validated production accuracy.


---

## 2. Prediction Function

The current Data Science entry point is:

```python
from predict import predict_refill