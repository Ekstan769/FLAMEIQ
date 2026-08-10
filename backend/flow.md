# FLAMEIQ Application Flow

This document outlines the primary user and data flows for the FLAMEIQ backend application.

## 1. New User Registration & Verification

This flow describes how a new user signs up and verifies their account via a One-Time Password (OTP).

1.  **Sign-Up Request**:
    *   The user's client sends a `POST` request to `/api/auth/signup`.
    *   The request body contains the user's `name`, `email`, and `password`.

2.  **Backend Processing (`signUp` controller)**:
    *   The system validates that all required fields are present.
    *   It checks if a non-deleted user with the same email already exists. If so, it returns a `409 Conflict` error.
    *   The user's password is securely hashed using `bcrypt`.
    *   A new `User` record is created in the database.
    *   A 6-digit OTP is generated, hashed, and stored in a new `OtpVerification` record, linked to the new user's ID. This record includes an expiration time (e.g., 10 minutes).
    *   The plain (un-hashed) OTP is sent to the user's email address via the `emailService`.
    *   The backend responds with a `201 Created` status, including a success message and the `userId` of the newly created user.

3.  **OTP Verification Request**:
    *   The user retrieves the OTP from their email.
    *   The client sends a `POST` request to `/api/auth/verify-otp`.
    *   The request body contains the `userId` (from the sign-up response) and the `otp` (from the email).

4.  **Backend Processing (`verifyOtp` controller)**:
    *   The system looks for a valid, un-used, and non-expired `OtpVerification` record matching the `userId`.
    *   It securely compares the provided `otp` with the stored `codeHash` using `bcrypt.compare`.
    *   If the OTP is valid, the `OtpVerification` record is marked as used by setting the `usedAt` timestamp.
    *   A JSON Web Token (JWT) is generated for the user, containing their `id`, `email`, and `role`.
    *   The backend responds with a `200 OK` status, including the JWT, and the user's profile information. The user is now authenticated and can access protected routes.

## 2. Existing User Sign-In

This flow describes how a registered and verified user signs in.

1.  **Sign-In Request**:
    *   The client sends a `POST` request to `/api/auth/signin`.
    *   The request body contains the user's `email` and `password`.

2.  **Backend Processing (`signIn` controller)**:
    *   The system finds the user by their email address.
    *   It securely compares the provided `password` with the user's stored hashed password using `bcrypt.compare`.
    *   If the credentials are valid, a new `LoginHistory` record is created to log the sign-in event with the user's IP address and user agent.
    *   A new JWT is generated for the user.
    *   The backend responds with a `200 OK` status, including the JWT and user profile information.

## 3. Order Creation

This flow describes how an authenticated user places an order.

1.  **Create Order Request**:
    *   An authenticated user's client sends a `POST` request to `/api/orders`.
    *   The request body includes the `vendorId`, an array of `items` (with name, quantity, price), and the order `type` ('STANDARD' or 'QUICK').
    *   The user's ID is typically extracted from their JWT on the backend via the `authenticate` middleware.

2.  **Backend Processing (`createOrder` service)**:
    *   The system calculates the `totalAmount` from the items.
    *   A new `Order` record and its associated `OrderItem` records are created in the database.
    *   A real-time notification is sent to the vendor via the `notificationService` (Server-Sent Events).
    *   The backend responds with a `201 Created` status, returning the newly created order object.