# FLAMEIQ - System Improvement TODO

This document lists identified areas for improvement across the FLAMEIQ backend system to enhance robustness, security, and maintainability.

##  Priority 1: Critical Fixes & Security

-   [ ] **Secure Webhook Verification:**
    -   **File:** `paymentController.ts`
    -   **Issue:** The current webhook verification uses a static secret hash comparison (`signature !== secretHash`), which is vulnerable to timing attacks.
    -   **Fix:** Implement a constant-time comparison using `crypto.timingSafeEqual` to prevent timing-based security vulnerabilities.

-   [ ] **Fix Stale Data in `acceptOrder`:**
    -   **File:** `orderService.ts`
    -   **Issue:** The `acceptOrder` method uses `prisma.order.updateMany` (which returns a count) and then returns a stale `order` object with the status manually changed. This can lead to inconsistent data being sent to the client.
    -   **Fix:** Change `prisma.order.updateMany` to `prisma.order.update` to fetch and return the truly updated order object.

-   [ ] **Clarify Order Acceptance Flow:**
    -   **File:** `paymentController.ts`, `orderService.ts`
    -   **Issue:** The webhook in `paymentController` automatically moves an order to `ACCEPTED`. The `acceptOrder` endpoint in `orderService` also tries to move it from `PENDING` to `ACCEPTED`. This creates a confusing and potentially redundant flow.
    -   **Fix:** Redefine the states. The webhook should move the order to a `PAID` or `PROCESSING` status. The vendor's action (`acceptOrder`) should then be the explicit step that moves it to `ACCEPTED`.

## 📈 Priority 2: Robustness & Best Practices

-   [ ] **Add Input Validation:**
    -   **Files:** `orderController.ts`, `reviewController.ts`, etc.
    -   **Issue:** Controller endpoints lack schema-based input validation, relying on downstream services to catch errors. This can lead to poor error messages and unnecessary processing.
    -   **Fix:** Implement a validation library like `zod` with middleware to validate `req.body`, `req.params`, and `req.query` at the route level.

-   [ ] **Centralize Configuration:**
    -   **File:** `orderService.ts`
    -   **Issue:** The `PLATFORM_COMMISSION_RATE` is defined with a fallback directly in the service file.
    -   **Fix:** Create a dedicated `src/config/index.ts` file to load, parse (e.g., `Number(process.env.VAR)`), and export all environment variables. This centralizes configuration and ensures type safety.

-   [ ] **Add Database Indexes:**
    -   **File:** `prisma/schema.prisma`
    -   **Issue:** The `Transaction` model is missing an index on `orderId`, which will be queried frequently. The `Payout` model is missing an index on `vendorId` and `status`, which will be used for processing pending payouts.
    -   **Fix:** Add `@@index([orderId])` to the `Transaction` model and `@@index([vendorId, status])` to the `Payout` model.

-   [ ] **Refactor `getOrders` Logic:**
    -   **File:** `orderController.ts`
    -   **Issue:** The `getOrders` controller contains direct database query logic (`prisma.order.findMany`) instead of using the `orderService`.
    -   **Fix:** Move the vendor-specific order query logic into a new method within `orderService` (e.g., `getOrdersForVendor`) to maintain separation of concerns.

## 📝 Priority 3: Documentation & CI/CD

-   [ ] **Update Application Flow Documentation:**
    -   **File:** `flow.md`
    -   **Issue:** The "Order Creation" section is now outdated. It doesn't mention the creation of `Transaction` and `Payout` records or the role of the payment webhook.
    -   **Fix:** Update the documentation to accurately reflect the current order and payment confirmation flow.

-   [ ] **Add Test Step to Docker CI:**
    -   **File:** `.github/workflows/docker-publish.yml`
    -   **Issue:** The Docker publishing workflow builds and pushes the image without running any tests first. A failing test could result in a broken image being published.
    -   **Fix:** Add steps to install dependencies and run tests (`pnpm test`) before the `docker/build-push-action` step.

-   [ ] **Add `FLUTTERWAVE_SECRET_HASH` to CI:**
    -   **File:** `.github/workflows/backend-ci.yml`
    -   **Issue:** The `backend-ci.yml` workflow is missing the `FLUTTERWAVE_SECRET_HASH` environment variable, which will cause tests related to webhook verification to fail.
    -   **Fix:** Add `FLUTTERWAVE_SECRET_HASH: ${{ secrets.FLUTTERWAVE_SECRET_HASH }}` to the `env` block.

-   [ ] **Unify `pnpm install` in CI:**
    -   **File:** `.github/workflows/backend-ci.yml`
    -   **Issue:** The `pnpm install` command is run without a `working-directory`, but all subsequent commands use `working-directory: backend`. This is slightly inconsistent.
    -   **Fix:** For clarity, either run all commands from the root using `--filter backend` or set a `defaults: { run: { working-directory: backend } }` for the entire job and adjust the install command accordingly. The latter is cleaner if the job is truly only for the backend.

## 💡 Future Enhancements

-   [ ] **Implement a Payout Processing Service:**
    -   **Description:** Implemented a background job using `node-cron` that periodically queries for `Payout` records with `READY_FOR_PROCESSING` status. This job calls the Flutterwave API to process transfers and updates the payout status to `PROCESSING`, `PAID`, or `FAILED` based on gateway responses and webhooks.

-   [ ] **Refactor Notification Service:**
    -   **Description:** The current `notificationService` is a simple in-memory broadcaster. For a production system that needs to handle multiple server instances or guarantee delivery, this should be refactored to use a more robust backend like Redis Pub/Sub.
