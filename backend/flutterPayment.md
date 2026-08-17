# Flutterwave Payment Integration Guide

This document outlines the sequence of API calls required to process payments using the Flutterwave API. It covers both Card Payments and Bank Transfer payments via virtual accounts.

**Base URL:** `https://developersandbox-api.flutterwave.com`

---
## Card Payments

### 1. Create a Customer
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

### 2. Create a Card Payment Method

Create a payment method using encrypted card details.

> **Note:** Card details must be encrypted on the client-side using the public key provided by Flutterwave. The `encrypted_*` values are placeholders for this output.
>
> **How to encrypt card details:**
> 1.  Fetch your public key from the Flutterwave dashboard or via their API.
> 2.  Use a library (like `node-forge` for JavaScript) to perform RSA encryption on the card details (number, cvv, expiry month/year) using the public key.
> 3.  The `nonce` is a unique, randomly generated string for each encryption request to ensure its uniqueness.

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

### 3. Create a Charge

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

### 4. Complete a Charge

If the previous step required an additional action (like PIN or OTP), you must complete it.

#### 4a. Complete with PIN

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

### 5. Handle Webhook for Verification

After a charge is completed (or fails), Flutterwave sends a webhook to your configured endpoint. **You must verify the webhook's signature to ensure it is a legitimate request from Flutterwave.**

#### 5a. Verify the Signature

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

---

## Pay with Transfer (Virtual Account)

This method allows customers to pay by transferring money to a dynamically generated bank account.

### 1. Create a Customer
First, ensure you have a customer record. If you haven't created one, follow **Step 1** from the [Card Payments](#card-payments) section. A `customer_id` is required to create a virtual account.

---

### 2. Create a Virtual Account
Generate a temporary virtual account where the customer will send the payment.

**Request:**
```bash
curl --request POST \
  --url 'https://developersandbox-api.flutterwave.com/virtual-accounts' \
  --header 'Authorization: Bearer {{FLW_SECRET_KEY}}' \
  --header 'X-Idempotency-Key: {{UNIQUE_IDEMPOTENCY_KEY}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "reference": "your-unique-transaction-ref-456",
    "customer_id": "cus_WWVaC0InrN",
    "expiry": 60,
    "amount": 1500,
    "currency": "NGN",
    "account_type": "dynamic",
    "narration": "Payment for Order XYZ"
  }'
```
-   `reference`: A unique identifier for this transaction from your system.
-   `customer_id`: The ID of the customer making the payment.
-   `expiry`: The time in minutes before the account expires (e.g., `60` for 1 hour).
-   `amount`: The exact amount expected to be paid.
-   `narration`: A short description for the payment.

**Success Response (200 OK):**
This response contains the bank details you must display to the customer.

```json
{
    "status": "success",
    "message": "Virtual account created",
    "data": {
        "id": "van_IZel8kyHKq",
        "amount": 1500.00,
        "account_number": "9059273981",
        "reference": "your-unique-transaction-ref-456",
        "account_bank_name": "Flutterwave MFB",
        "account_type": "dynamic",
        "status": "active",
        "account_expiration_datetime": "2026-06-18T13:05:28.000Z",
        "note": "Please make a bank transfer of NGN 1,500.00 to this account.",
        "customer_id": "cus_WWVaC0InrN",
        "created_datetime": "2026-06-18T13:04:29.863Z",
        "currency": "NGN",
        "narration": "Payment for Order XYZ"
    }
}
```

---

### 3. Customer Completes Bank Transfer
The customer uses their banking app or USSD to transfer the specified `amount` to the `account_number` and `account_bank_name` provided in the response above.

---

### 4. Handle Webhook for Payment Confirmation
When Flutterwave receives the payment, it will send a `charge.completed` webhook to your configured endpoint. You **must** verify the webhook signature to ensure its authenticity, as described in **Step 5a** of the [Card Payments](#card-payments) section.

**Sample `charge.completed` Webhook for Bank Transfer:**
```json
{
  "webhook_id": "wbk_xCBGoxP44NzL74hcCJiV",
  "timestamp": 1748850422635,
  "type": "charge.completed",
  "data": {
    "id": "chg_zH0BLoNltt",
    "amount": 1500,
    "currency": "NGN",
    "reference": "your-unique-transaction-ref-456",
    "status": "succeeded",
    "customer": {
      "id": "cus_WWVaC0InrN",
      "email": "customer@example.com"
    },
    "payment_method": {
      "type": "bank_transfer"
    },
    "processor_response": {
      "type": "approved",
      "code": "00"
    },
    "created_datetime": "2025-06-02T07:47:02.537Z"
  }
}
```
Upon receiving and verifying this webhook, you can safely credit the customer's account or fulfill their order.

---

### 5. (Optional) Verify Charge Status Manually
If needed, you can also verify the status of a charge by its `id` (from the webhook) or your `reference`.

**Request:**
```bash
curl --request GET \
  --url 'https://developersandbox-api.flutterwave.com/charges/chg_zH0BLoNltt' \
  --header 'Authorization: Bearer {{FLW_SECRET_KEY}}'
```
*You can also query by reference: `GET /charges?reference=your-unique-transaction-ref-456`*

**Success Response (200 OK):**
This confirms the charge was successful.
```json
{
    "status": "success",
    "message": "Charge fetched",
    "data": {
        "id": "chg_zH0BLoNltt",
        "amount": 1500,
        "currency": "NGN",
        "customer_id": "cus_WWVaC0InrN",
        "reference": "your-unique-transaction-ref-456",
        "status": "succeeded",
        "payment_method_details": {
            "type": "bank_transfer"
        },
        "processor_response": {
            "type": "approved",
            "code": "00"
        },
        "created_datetime": "2025-06-02T07:47:02.945Z"
    }
}
```

---

## Vendor Payout

Vendor payouts are automatically processed after a customer confirms the delivery of an order. The flow is designed to be secure and transparent, ensuring vendors are paid promptly upon successful order completion.

### Vendor Payout Lifecycle

The payout process is tied directly to the `Order` and `Payout` models in the database and follows a clear state-driven lifecycle.

#### 1. Order Creation & Payout Record
-   **Action**: A customer places an order with a vendor.
-   **System Behavior**:
    -   The system calculates the total order amount, the platform's commission (e.g., 10%), and the final net amount due to the vendor.
    -   A `Payout` database record is created and linked to the order.
    -   The initial status of this `Payout` record is set to `PENDING`. This signifies that the order is active, but the conditions for the payout have not yet been met.

#### 2. Delivery Confirmation
-   **Action**: The customer receives their order and confirms its delivery through the app.
-   **System Behavior**:
    -   The `Order` status is updated to `CONFIRMED`. This is the primary trigger for the payout process.
    -   The system asynchronously initiates the vendor payout process to avoid blocking the user-facing confirmation action.

#### 3. Payout Initiation
-   **Action**: The system begins the process of transferring funds to the vendor.
-   **System Behavior**:
    -   The `Payout` record's status is updated to `PROCESSING`.
    -   A `Transaction` record with the type `PAYOUT` is created to log the outgoing payment.
    -   The system makes an API call to the payment gateway (e.g., Flutterwave) to initiate a direct transfer to the vendor's registered bank account.

**API Request to Initiate Transfer (Example):**
```bash
curl --request POST \
--url 'https://developersandbox-api.flutterwave.com/direct-transfers' \
--header 'Authorization: Bearer {{FLW_SECRET_KEY}}' \
--header 'Content-Type: application/json' \
--data '{
  "action": "instant",
  "type": "bank",
  "callback_url": "https://yourapi.com/webhooks/payouts",
  "narration": "Payout for Order #ORD-12345",
  "reference": "PAYOUT-ORD-12345-TIMESTAMP",
  "payment_instruction": {
    "amount": { "value": 4500 }, 
    "destination_currency": "NGN",
    "recipient": {
      "bank": {
        "code": "044", 
        "account_number": "0690000031" 
      }
    }
  }
}'
```

#### 4. Handling Payout Completion (Webhook)
-   **Action**: The payment gateway processes the transfer and sends a webhook to notify our system of the outcome.
-   **System Behavior**:
    -   The system verifies the webhook's signature to ensure it's a legitimate request from the gateway.
    -   The webhook payload contains the final status of the transfer (`SUCCESSFUL` or `FAILED`).

**Sample `transfer.disburse` Webhook Payload:**
```json
{
  "webhook_id": "wbk_rp0bjKyAWA52ViM8xlZ0",
  "timestamp": 1739877172874,
  "type": "transfer.disburse",
  "data": {
    "id": "trf_yMZATJ11yVPNkZ",
    "reference": "PAYOUT-ORD-12345-TIMESTAMP",
    "status": "SUCCESSFUL",
    "amount": 4500,
    "bank": {
      "account_number": "0690000031",
      "code": "044"
    }
  }
}
```

#### 5. Final Status Update
-   **Action**: The system processes the verified webhook.
-   **System Behavior**:
    -   If the transfer was `SUCCESSFUL`, the `Payout` record status is updated to `PAID`. The vendor receives a notification confirming the payout.
    -   If the transfer `FAILED`, the `Payout` record status is updated to `FAILED`. The system logs the error, and an internal alert is triggered for the administrative team to investigate and resolve the issue manually. The vendor may also be notified to check their payout information.

This automated flow ensures reliable and trackable payments to vendors, forming a critical part of the platform's trust and safety mechanism.