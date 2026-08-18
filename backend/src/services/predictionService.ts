import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
//import { AppError } from '../utils/errors.js';
import { aiService, RefillPredictionInput } from './aiService.js';
import { notificationService } from './notificationService.js';
import { Cylinder, Profile, User } from '../generated/prisma/client.js';

class PredictionService {
  /**
   * Generates the first "cold-start" gas refill prediction for a user.
   * This should be triggered after a user provides their initial household
   * data and registers their first cylinder.
   *
   * @param user - The user object.
   * @param profile - The user's profile containing household data.
   * @param cylinder - The user's newly registered cylinder.
   */
  public async generateInitialPrediction(
    user: User,
    profile: Profile | null,
    cylinder: Cylinder
  ): Promise<void> {
    logger.info(`[Prediction] Attempting to generate initial prediction for user ${user.id}`);

    // 1. Pre-flight checks: Ensure we have the necessary data.
    if (!profile || !cylinder) {
      logger.warn(
        `[Prediction] Skipping for user ${user.id} due to missing profile or cylinder data.`
      );
      return;
    }

    // 2. Check if a prediction already exists to avoid duplicates.
    const existingPrediction = await prisma.gasPrediction.findFirst({
      where: { userId: user.id },
    });

    if (existingPrediction) {
      logger.info(`[Prediction] User ${user.id} already has a prediction. Skipping.`);
      return;
    }

    // 3. Assemble the payload for the AI service from user and cylinder data.
    // The `last_refill_date` is assumed to be today for the first prediction.
    const predictionInput: RefillPredictionInput = {
      household_size:  1,
      meals_per_day:  2,
      cooking_days_per_week:  7,
      lpg_primary_fuel:  'no',
      cylinder_size_kg: Number(cylinder.size.replace('KG_', '').replace('_', '.')),
      refill_quantity_kg: Number(cylinder.size.replace('KG_', '').replace('_', '.')), // Assume full refill
      last_refill_date: new Date().toISOString().split('T')[0],
      usage_change: 'normal',
      number_previous_cycles: 0, // This is a cold-start prediction
    };

    try {
      // 4. Call the AI service to get the prediction.
      const predictionResult = await aiService.getRefillPrediction(predictionInput);

      // 5. Save the prediction to the database.
      await prisma.gasPrediction.create({
        data: {
          userId: user.id,
          cylinderId: cylinder.id,
          estimatedCycleDays: predictionResult.estimated_cycle_days,
          estimatedRefillDate: new Date(predictionResult.estimated_refill_date),
          confidence: predictionResult.confidence,
          // Store the input for future reference/auditing
          predictionInput: JSON.stringify(predictionInput),
        },
      });

      // 6. Notify the user about their new prediction.
      await notificationService.sendToUser(user.id, {
        title: 'Your First Gas Prediction is Ready!',
        message: predictionResult.recommended_action,
        type: 'success',
      });

      logger.info(`[Prediction] Successfully generated and saved initial prediction for user ${user.id}.`);
    } catch (error) {
      logger.error({ err: error, userId: user.id }, 'Failed to generate initial prediction.');
      // We don't re-throw the error because failing to create a prediction
      // shouldn't block the primary action (e.g., cylinder registration).
    }
  }
}

export const predictionService = new PredictionService();