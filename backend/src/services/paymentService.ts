import crypto from 'crypto';
import { prisma } from '@/db/prisma.js';
import { logger } from '@/utils/logger.js';
import { Prisma, PrismaClient } from '../generated/prisma/client.js';
import { AppError } from '@/utils/errors.js';
import { Order, Payout, PayoutStatus, Transaction, TxStatus, TxType } from '../generated/prisma/client.js';
import { config } from '../config/index.js';

const FLW_SECRET_KEY = config.flutterwaveSecretKey;
const FLW_SECRET_HASH = config.flutterwaveSecretHash;
const FLW_BASE_URL = config.flutterwaveBaseUrl;

/**
 * A helper function for making API calls to Flutterwave.
 * @param endpoint The API endpoint to call.
 * @param method The HTTP method.
 * @param body The request body.
 * @param idempotencyKey Optional key to prevent duplicate requests.
 * @returns The JSON response from the API.
 */
async function flutterwaveApiCall(
  endpoint: string,
  method: 'POST' | 'GET' | 'PUT',
  body?: object,
  idempotencyKey?: string
) {
  const url = `${FLW_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    Authorization: `Bearer ${FLW_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    if (!response.ok) {
      logger.error({
        message: `Flutterwave API error at ${endpoint}`,
        statusCode: response.status,
        // Payment-method responses can contain card-related metadata. Do not
        // place gateway payloads in logs where they could be retained.
        responseData: endpoint === '/payment-methods' ? '[redacted]' : responseData,
      });
      throw new AppError(
        responseData.message || `Flutterwave API request failed: ${response.statusText}`,
        response.status
      );
    }
    return responseData;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Error in flutterwaveApiCall');
    throw new AppError('Failed to communicate with the payment gateway.', 503);
  }
}

/**
 * Retrieves a Flutterwave customer ID for a user, creating one if it doesn't exist.
 * This function is designed to be used within a Prisma transaction.
 * @param tx The Prisma transaction client.
 * @param userId The ID of the user.
 * @returns The Flutterwave customer ID.
 */
async function _getOrCreateFlutterwaveCustomer(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<string> {
  const profile = await tx.profile.findUnique({ where: { userId }, select: { flutterwaveCustomerId: true, user: { select: { email: true, name: true } } } });

  if (!profile?.user) {
    throw new AppError('User not found for customer creation.', 404);
  }

  if (profile.flutterwaveCustomerId) {
    return profile.flutterwaveCustomerId;
  }

  logger.info(`No Flutterwave customer ID found for user ${userId}. Creating a new one.`);
  const customerData = await flutterwaveApiCall('/customers', 'POST', {
    email: profile.user.email,
    name: profile.user.name,
  });

  const customerId = customerData.data.id as string;

  // Store the new customer ID for future use
  await tx.profile.update({ where: { userId }, data: { flutterwaveCustomerId: customerId } });

  return customerId;
}

/**
 * Creates a virtual account for a given order.
 * @param order The order object from the database.
 * @param transaction The associated transaction object.
 * @returns The virtual account data from Flutterwave.
 */
async function createVirtualAccountForOrder(order: Order, transaction: Transaction) {
  const customerId = await prisma.$transaction(async (tx) => {
    return _getOrCreateFlutterwaveCustomer(tx, order.userId);
  });

  const virtualAccountData = await flutterwaveApiCall(
    '/virtual-accounts',
    'POST',
    {
      reference: transaction.reference,
      customer_id: customerId,
      expiry: 60, // 60 minutes
      amount: order.totalAmount,
      currency: 'NGN',
      narration: `Payment for Order #${order.id.substring(0, 8)}`,
    },
    transaction.reference // Use transaction reference for idempotency
  );

  logger.info(`Virtual account created for order reference: ${transaction.reference}`);
  return virtualAccountData.data;
}

/**
 * Initiates a card payment for a given order.
 * @param order The order object from the database.
 * @param transaction The associated transaction object.
 * @param encryptedCardDetails The client-side encrypted card details.
 * @param redirectUrl The URL to redirect to after payment.
 * @returns The charge data from Flutterwave, which may require further action (e.g., OTP).
 */
async function initiateCardPayment(
  order: Order,
  transaction: Transaction,
  encryptedData: string,
  redirectUrl: string
) {
  const customerId = await prisma.$transaction(async (tx) => {
    return _getOrCreateFlutterwaveCustomer(tx, order.userId);
  });

  const paymentMethodData = await flutterwaveApiCall('/payment-methods', 'POST', {
    type: 'card',
    encrypted_data: encryptedData,
  });
  const payment_method_id = paymentMethodData.data.id;

  // Step 3: Create the Charge.
  const chargeData = await flutterwaveApiCall(
    '/charges',
    'POST',
    {
      amount: order.totalAmount,
      currency: 'NGN',
      reference: transaction.reference,
      customer_id: customerId,
      payment_method_id,
      redirect_url: redirectUrl,
      meta: { order_id: order.id },
    },
    transaction.reference // Add idempotency key
  );

  logger.info(`Card charge initiated for order reference: ${transaction.reference}`);
  return chargeData.data;
}

/**
 * Charges a Flutterwave-issued payment-method token. This is deliberately a
 * one-way flow: FlameIQ never receives or decrypts cardholder data.
 */
async function initiateTokenizedCardPayment(
  order: Order,
  transaction: Transaction,
  paymentMethodId: string,
  redirectUrl: string,
) {
  const customerId = await prisma.$transaction(async (tx) => {
    return _getOrCreateFlutterwaveCustomer(tx, order.userId);
  });

  const chargeData = await flutterwaveApiCall('/charges', 'POST', {
    amount: order.totalAmount,
    currency: 'NGN',
    reference: transaction.reference,
    customer_id: customerId,
    payment_method_id: paymentMethodId,
    redirect_url: redirectUrl,
    meta: { order_id: order.id },
  }, transaction.reference);

  logger.info(`Tokenized card charge initiated for order reference: ${transaction.reference}`);
  return chargeData.data;
}

async function initiateWalletFunding(userId: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Funding amount must be greater than zero.', 400);
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found.', 404);

  const reference = `FLM-WALLET-${userId.slice(0, 8)}-${Date.now()}`;
  await prisma.transaction.create({
    data: {
      userId,
      sourceUserId: userId,
      amount,
      type: TxType.WALLET_FUND,
      status: TxStatus.PENDING,
      reference,
      description: 'Wallet funding',
      gateway: 'flutterwave',
    },
  });

  const response = await flutterwaveApiCall('/payments', 'POST', {
    tx_ref: reference,
    amount,
    currency: 'NGN',
    redirect_url: `${config.apiBaseUrl}/payments/verify/${reference}`,
    customer: { email: user.email, name: user.name },
    customizations: { title: 'FLAMEIQ wallet funding' },
  }, reference);
  return { reference, paymentLink: response.data?.link ?? response.data };
}

/**
 * Verifies the signature of an incoming webhook from Flutterwave.
 * Uses a timing-safe comparison to prevent timing attacks.
 * @param signature The signature from the 'flutterwave-signature' header.
 * @returns True if the signature is valid, false otherwise.
 */
function verifyWebhookSignature(signature: string): boolean {
  if (!FLW_SECRET_HASH || !signature) {
    return false;
  }
  const sigBuffer = Buffer.from(signature);
  const hashBuffer = Buffer.from(FLW_SECRET_HASH);

  // Use crypto.timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(sigBuffer, hashBuffer);
}

/**
 * Processes a 'charge.completed' webhook event.
 * @param eventData The data object from the webhook payload.
 */
async function processSuccessfulCharge(eventData: any) {
  const { reference, status } = eventData;
  if (status !== 'succeeded') {
    logger.warn(`Received charge.completed event but status was '${status}' for ref: ${reference}`);
    return;
  }

  // Use a transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({ where: { reference } });
    if (!transaction) {
      throw new AppError(`Transaction with reference ${reference} not found.`, 404);
    }
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: 'SUCCESS', gatewayReference: eventData.id },
    });

    if (transaction.orderId) {
      await tx.order.update({ where: { id: transaction.orderId }, data: { status: 'PENDING' } });
    } else if (transaction.type === TxType.WALLET_FUND) {
      await tx.profile.update({
        where: { userId: transaction.userId ?? transaction.sourceUserId! },
        data: { walletBalance: { increment: transaction.amount } },
      });
    }
  });

  logger.info(`Successfully processed payment for order via reference: ${reference}`);
  // Here you would also trigger a notification to the vendor.
}

/**
 * Triggers the processing of pending vendor payouts.
 * This function is intended to be called by a background job.
 */
async function processPendingPayouts() {
  logger.info('Starting to process pending payouts...');

  const payoutsToProcess = await prisma.payout.findMany({
    where: {
      status: PayoutStatus.READY_FOR_PROCESSING,
    },
    include: {
      vendor: {
        include: {
          profile: true, // Assuming vendor bank details are in the profile
        },
      },
      order: true, // To get order details for narration, etc.
    },
  });

  if (payoutsToProcess.length === 0) {
    logger.info('No pending payouts to process.');
    return;
  }

  for (const payout of payoutsToProcess) {
    // Use a transaction for each payout to ensure atomicity
    await prisma.$transaction(async (tx) => {
      try {
        // 1. Update Payout status to PROCESSING
        await tx.payout.update({
          where: { id: payout.id },
          data: { status: PayoutStatus.PROCESSING },
        });

        // 2. Fetch vendor bank details
        const vendorProfile = payout.vendor?.profile;
        if (!vendorProfile || !vendorProfile.bankCode || !vendorProfile.bankAccountNumber) {
          logger.error(`Vendor ${payout.vendorId} for payout ${payout.id} is missing bank details.`);
          await tx.payout.update({
            where: { id: payout.id },
            data: { status: PayoutStatus.FAILED, failureReason: 'Missing vendor bank details' },
          });
          // Also update the corresponding transaction to FAILED
          await tx.transaction.update({
            where: { reference: payout.reference },
            data: { status: TxStatus.FAILED, description: 'Payout failed: Missing vendor bank details' },
          });
          return; // Skip to next payout
        }

        // 3. Create a Transaction record for the payout (if not already created)
        // The payout record is created when the order is created, but the transaction for the payout itself
        // is created here, or updated if it was already created as PENDING.
        let payoutTransaction = await tx.transaction.findUnique({
          where: { reference: payout.reference },
        });

        if (!payoutTransaction) {
          payoutTransaction = await tx.transaction.create({
            data: {
              orderId: payout.orderId,
              sourceUserId: payout.vendorId, // Vendor is the recipient of the payout
              amount: payout.amount,
              type: TxType.PAYOUT,
              status: TxStatus.PENDING, // PENDING until Flutterwave confirms via webhook
              reference: payout.reference,
              description: `Payout for Order #${payout.orderId.substring(0, 8)}`,
              gateway: 'flutterwave',
            },
          });
        }

        // 4. Initiate transfer with Flutterwave
        const bankDetails = {
          code: vendorProfile.bankCode,
          accountNumber: vendorProfile.bankAccountNumber,
        };
        const flutterwaveResponse = await _initiateVendorPayout(payout, bankDetails);

        // Store gateway's transfer ID. Status will be updated by webhook.
        await tx.transaction.update({
          where: { id: payoutTransaction.id },
          data: { gatewayReference: flutterwaveResponse.data?.id },
        });

        logger.info(`Payout initiated with Flutterwave for reference: ${payout.reference}. Gateway response: ${JSON.stringify(flutterwaveResponse)}`);
      } catch (error) {
        logger.error({ err: error, payoutId: payout.id }, 'Error processing payout');
        // Mark payout and transaction as FAILED if an error occurs during initiation
        await tx.payout.update({
          where: { id: payout.id },
          data: { status: PayoutStatus.FAILED, failureReason: (error instanceof AppError) ? error.message : 'Internal error during initiation' },
        });
        await tx.transaction.update({
          where: { reference: payout.reference },
          data: { status: TxStatus.FAILED, description: `Payout failed: ${(error instanceof AppError) ? error.message : 'Internal error'}` },
        });
      }
    });
  }
  logger.info('Finished processing pending payouts.');
}

/**
 * Processes a 'transfer.disburse' webhook event for vendor payouts.
 * @param eventData The data object from the webhook payload.
 */
async function processPayoutDisbursement(eventData: any) {
  const { reference, status, id: gatewayReference } = eventData;

  const statusMap = {
    SUCCESSFUL: { payout: PayoutStatus.PAID, transaction: TxStatus.SUCCESS },
    FAILED: { payout: PayoutStatus.FAILED, transaction: TxStatus.FAILED },
  };

  const newStatuses = statusMap[status as keyof typeof statusMap] ?? statusMap.FAILED;


  await prisma.$transaction(async (tx) => {
    // Find the payout by its unique reference
    const payout = await tx.payout.findUnique({
      where: { reference },
    }); // Payout and its Transaction share a reference

    if (!payout) {
      throw new AppError(`Payout with reference ${reference} not found.`, 404);
    }

    // Update the Payout status
    await tx.payout.update({
      where: { id: payout.id },
      data: { status: newStatuses.payout },
    });

    // Update the corresponding PAYOUT Transaction status
    await tx.transaction.update({
      where: { reference }, // Payout and its Transaction share a reference
      data: { status: newStatuses.transaction, gatewayReference },
    });
  });

  if (newStatuses.payout === PayoutStatus.PAID) {
    logger.info(`Successfully processed payout for reference: ${reference}`);
  } else {
    logger.error(`Processing FAILED payout for reference: ${reference}. Manual investigation required.`);
  }
}
/**
 * Initiates a payout transfer to a vendor.
 * @param payout The payout record from the database.
 * @param bankDetails The vendor's bank details.
 */
async function _initiateVendorPayout(payout: Payout, bankDetails: { code: string; accountNumber: string }) {
  const { reference, amount } = payout;
  const payload = {
    action: 'instant',
    type: 'bank',
    callback_url: `${config.apiBaseUrl}/api/payments/webhook`,
    narration: `Payout for Order #${payout.orderId.substring(0, 8)}`,
    reference,
    payment_instruction: {
      amount: { value: amount },
      destination_currency: 'NGN',
      recipient: {
        bank: { code: bankDetails.code, account_number: bankDetails.accountNumber },
      },
    },
  };

  return flutterwaveApiCall('/direct-transfers', 'POST', payload, reference);
}

export const paymentService = {
  // _getOrCreateFlutterwaveCustomer is internal and not exported
  createVirtualAccountForOrder,
  initiateCardPayment,
  initiateTokenizedCardPayment,
  initiateWalletFunding,
  verifyWebhookSignature,
  processSuccessfulCharge,  
  processPendingPayouts,
  processPayoutDisbursement,
};
