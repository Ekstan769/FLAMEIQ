import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { paymentService } from '../services/paymentService.js';
import { config } from '../config/index.js';

class PayoutJob {
  public start() {
    // Schedule to run every 5 minutes (adjust as needed)
    // In a production environment, you might want a more sophisticated scheduler
    // or a queue-based system for critical tasks like payouts.
    cron.schedule('*/5 * * * *', async () => {
      if (!config.enablePayoutJob) {
        logger.info('[Payout Job] Skipped - enablePayoutJob is false in config.');
        return;
      }

      try {
        logger.info('[Payout Job] Starting scheduled payout processing...');
        await paymentService.processPendingPayouts();

        logger.info('[Payout Job] Finished scheduled payout processing.');
      } catch (error) {
        logger.error({ err: error }, '[Payout Job] Error during execution');
      }
    });
  }
}

export const payoutJob = new PayoutJob();
