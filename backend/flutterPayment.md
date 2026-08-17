# Flutterwave Card Payment Integration Guide

This document outlines the sequence of API calls required to process a card payment using the Flutterwave API.

**Base URL:** `https://developersandbox-api.flutterwave.com`

---

## 1. Create a Customer

First, create a customer record to associate with the payment.

**Request:**
```bash
curl --request POST \
  --url 'https://developersandbox-api.flutterwave.com/customers' \
  --header 'Authorization: Bearer {{FLW_SECRET_KEY}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "james@example.com",
    "name": { "first": "King", "last": "James" },
    "phone": { "country_code": "1", "number": "6313958745" }
  }'
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Customer created",
  "data": {
    "id": "cus_X0yJv3ZMpL",
    "email": "james@example.com",
    "name": { "first": "King", "last": "James" },
    "phone": { "country_code": "1", "number": "6313958745" },
    "created_datetime": "2025-01-29T12:44:53.049Z"
  }
}
```

---

## 2. Create a Card Payment Method

Create a payment method using encrypted card details.

> **Note:** Card details must be encrypted on the client-side using the public key provided by Flutterwave. The `encrypted_*` values are placeholders for this output.

**Request:**
```bash
curl --request POST \
  --url 'https://developersandbox-api.flutterwave.com/payment-methods' \
  --header 'Authorization: Bearer {{FLW_SECRET_KEY}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "type": "card",
    "card": {
        "encrypted_card_number": "{{encrypted_card_number}}",
        "encrypted_expiry_month": "{{encrypted_expiry_month}}",
        "encrypted_expiry_year": "{{encrypted_expiry_year}}",
        "encrypted_cvv": "{{encrypted_cvv}}",
        "nonce": "{{randomly_generated_nonce}}"
    }
  }'
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Payment method created",
  "data": {
    "id": "pmd_wlVhaYmkl2",
    "type": "card",
    "card": {
      "network": "mastercard",
      "first6": "123412",
      "last4": "2222",
      "expiry_month": 8,
      "expiry_year": 32
    },
    "created_datetime": "2024-12-03T14:29:26.650Z"
  }
}
```

---

## 3. Create a Charge

Initiate a charge using the `customer_id` and `payment_method_id`.

**Request:**
```bash
curl --request POST \
  --url 'https://developersandbox-api.flutterwave.com/charges' \
  --header 'Authorization: Bearer {{FLW_SECRET_KEY}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "amount": 2500,
    "currency": "NGN",
    "reference": "unique-transaction-ref-123",
    "customer_id": "cus_X0yJv3ZMpL",
    "payment_method_id": "pmd_wlVhaYmkl2",
    "redirect_url": "https://your-app.com/payment-callback",
    "meta": { "order_id": "order-abc-123" }
  }'
```

**Success Response (Pending Action):**
The response will indicate the next action required, such as `requires_pin` or `requires_otp`.

```json
{
  "status": "success",
  "message": "Charge created",
  "data": {
    "id": "chg_VoUhmFMhmF",
    "status": "pending",
    "next_action": {
      "type": "requires_pin",
      "requires_pin": {}
    }
  }
}
```

---

## 4. Complete a Charge

If the previous step required an additional action (like PIN or OTP), you must complete it.

### 4a. Complete with PIN

**Request:**
```bash
curl --request PUT \
  --url 'https://developersandbox-api.flutterwave.com/charges/chg_VoUhmFMhmF' \
  --header 'Authorization: Bearer {{FLW_SECRET_KEY}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "authorization": {
        "type": "pin",
        "pin": {
            "nonce": "{{randomly_generated_nonce}}",
            "encrypted_pin": "{{encrypted_pin}}"
        }
    }
  }'
```

### 4b. Complete with OTP

**Request:**
```bash
curl --request PUT \
  --url 'https://developersandbox-api.flutterwave.com/charges/chg_VoUhmFMhmF' \
  --header 'Authorization: Bearer {{FLW_SECRET_KEY}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "authorization": {
        "type": "otp",
        "otp": { "code": "123456" }
    }
  }'
```

---

## 5. Handle Webhook for Verification

After a charge is completed (or fails), Flutterwave sends a webhook to your configured endpoint. **You must verify the webhook's signature to ensure it is a legitimate request from Flutterwave.**

### 5a. Verify the Signature

1.  Get the `flutterwave-signature` value from the request headers.
2.  Get the raw request body (as a string).
3.  Compare the `flutterwave-signature` with your `FLUTTERWAVE_SECRET_HASH` from your environment variables.
4.  If they do not match, **do not process the webhook**. Respond with a `401 Unauthorized` status.
5.  If they match, proceed to process the event and respond with a `200 OK`.

**Example (Express.js):**
```javascript
const webhookSecret = process.env.FLUTTERWAVE_SECRET_HASH;
const signature = req.headers['flutterwave-signature'];

if (signature !== webhookSecret) {
  // This request isn't from Flutterwave. Don't process it.
  return res.status(401).send('Invalid signature');
}

// Signature is valid, process the event.
const event = req.body;
// ... find order, update status, etc. ...

res.status(200).send('Received');
```

### 5b. Sample `charge.completed` Webhook Payload

Once verified, you can use the payload to update your system's records.

```json
{
  "webhook_id": "wbk_yXvsB4LzWSwhUCpAPCBR",
  "timestamp": 1739456704200,
  "type": "charge.completed",
  "data": {
    "id": "chg_zam88NgLb7",
    "amount": 2500,
    "currency": "NGN",
    "reference": "unique-transaction-ref-123",
    "status": "succeeded",
    "customer": { "id": "cus_dc0FUyBpd0", "email": "james@example.com" },
    "meta": { "order_id": "order-abc-123" },
    "processor_response": { "type": "approved", "code": "00" },
    "created_datetime": "2025-02-13T14:24:43.133Z"
  }
}
```