# FLAMEIQ Frontend Payment Integration Guide

This document provides a step-by-step guide for frontend developers (specifically Flutter) on how to integrate with the FLAMEIQ backend's payment service. It covers the two primary payment methods: Card Payments and Bank Transfers (Virtual Accounts).

## Core Principles

1.  **Client-Side Encryption**: For card payments, sensitive card details (card number, CVV) **must never** be sent to our backend. The frontend is responsible for encrypting this data before transmission. This is critical for PCI-DSS compliance.
2.  **Backend as an Orchestrator**: The backend handles the secure communication with the payment gateway (Flutterwave), but the frontend drives the user-facing flow.
3.  **Real-time Updates**: For asynchronous payments like bank transfers, the frontend should use the real-time notification stream to update the UI, providing a seamless user experience.

---

## Flow 1: Card Payments

This flow is used when the user wants to pay directly with their credit or debit card.

### Step 1: Fetch the Public Key

Before you can encrypt anything, you need the payment gateway's public key.

*   **Action**: Make a `GET` request to the backend.
*   **Endpoint**: `/api/payments/public-key`
*   **Response**: A JSON object containing the PEM-formatted public key.

```json
{
  "success": true,
  "data": {
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMF...QE=\n-----END PUBLIC KEY-----"
  }
}
```

**Flutter Implementation**:
You should fetch and cache this key when your payment screen loads.

### Step 2: Encrypt Card Details (Client-Side)

This is the most critical security step. You will use the public key from Step 1 to encrypt the user's card details directly within the Flutter app.

*   **Action**:
    1.  Collect the card number, CVV, expiry month, and expiry year from the user.
    2.  Create a JSON string from this data.
    3.  Use a Dart cryptography library (like `encrypt` or `pointycastle`) to perform RSA encryption on the JSON string.
    4.  The encryption scheme **must be RSA/OAEP**.
    5.  The final output should be a Base64 encoded string.

**Payload to Encrypt (as a JSON string):**
```json
{
  "card_number": "5532123412341234",
  "cvv": "123",
  "expiry_month": "09",
  "expiry_year": "28"
}
```

**Flutter Implementation (using the `encrypt` package):**

```dart
import 'package:encrypt/encrypt.dart' as encrypt;
import 'dart:convert';

String encryptCardDetails(String publicKeyPem, Map<String, String> cardData) {
  final parser = encrypt.RSAKeyParser();
  final publicKey = parser.parse(publicKeyPem) as encrypt.RSAPublicKey;

  // Use OAEP padding for security
  final encrypter = encrypt.Encrypter(
    encrypt.RSA(publicKey: publicKey, encoding: encrypt.RSAEncoding.OAEP),
  );

  final payload = json.encode(cardData);
  final encrypted = encrypter.encrypt(payload);

  // Return the Base64 encoded string
  return encrypted.base64;
}
```

### Step 3: Initiate the Payment

Send the encrypted data to the backend to start the payment process.

*   **Action**: Make a `POST` request to the backend.
*   **Endpoint**: `/api/payments/pay-with-card`
*   **Headers**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <user_jwt_token>`
*   **Request Body**:

```json
{
  "orderId": "clx...",
  "encryptedData": "Abc...xyz==",
  "redirectUrl": "https://flameiq.app/payment-complete"
}
```

*   `encryptedData`: The Base64 string from Step 2.
*   `redirectUrl`: A URL within your app that you can intercept to know when the payment process is finished.

### Step 4: Handle 3D Secure Authentication

If the user's bank requires 3D Secure (e.g., an OTP), the backend will respond with a URL for authentication.

*   **Backend Response**:

```json
{
  "success": true,
  "data": {
    "id": "chg_...",
    "status": "pending",
    "authorization": {
      "type": "redirect",
      "redirect": "https://checkout.flutterwave.com/..."
    }
  }
}
```

*   **Frontend Action**:
    1.  Check if `data.authorization.redirect` exists in the response.
    2.  If it does, open this URL in a webview (e.g., using `flutter_inappwebview`).
    3.  The user will complete the authentication inside this webview.

### Step 5: Handle Payment Completion

After the user authenticates (or if no authentication was needed), the webview will navigate to the `redirectUrl` you provided in Step 3. You must listen for this navigation event.

*   **Action**:
    1.  In your webview controller, monitor the URL. When it matches your `redirectUrl`, the process is complete.
    2.  The redirect URL will contain query parameters like `status` and `tx_ref`.
    3.  Close the webview.
    4.  Make a final `POST` request to the backend's verification endpoint to get the definitive status of the transaction and update your UI (e.g., show a success or failure screen).
*   **Verification Endpoint**: `/api/payments/verify`
*   **Request Body**:

```json
{
  "transactionReference": "FLM-ORD-..."
}
```

---

## Flow 2: Bank Transfer (Virtual Account)

This flow allows the user to pay by transferring money to a temporary bank account generated for their order.

### Step 1: Request a Virtual Account

*   **Action**: Make a `POST` request to the backend.
*   **Endpoint**: `/api/payments/pay-with-transfer`
*   **Headers**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <user_jwt_token>`
*   **Request Body**:

```json
{
  "orderId": "clx..."
}
```

### Step 2: Display Account Details

The backend will respond with the bank account details for the user to pay into.

*   **Backend Response**:

```json
{
  "success": true,
  "data": {
    "account_number": "9059273981",
    "account_bank_name": "Flutterwave MFB",
    "amount": 1500.00,
    "note": "Please make a bank transfer of NGN 1,500.00 to this account."
  }
}
```

*   **Frontend Action**: Display these details clearly to the user. Include a "Copy" button for the account number to make it easy for them.

### Step 3: Await Payment Confirmation (Real-time)

The user will switch to their banking app to make the payment. This is an asynchronous process. The best way to update your UI is to listen for real-time events from the backend.

*   **Action**:
    1.  Connect to the backend's Server-Sent Events (SSE) stream.
    2.  The backend will automatically send a notification when it receives the payment confirmation webhook from Flutterwave.
*   **SSE Endpoint**: `/api/notifications/stream`
*   **Event Payload**: When payment is confirmed, you will receive an event like this:

```json
{
  "title": "Payment Received!",
  "message": "Your payment for order #ABC12345 has been confirmed.",
  "type": "success"
}
```

*   **Frontend Action**: Upon receiving this event, you can confidently update the UI to show that the payment was successful and navigate the user to the order tracking screen. This is far superior to manual polling.