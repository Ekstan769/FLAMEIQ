import cron from 'node-cron';
import { config } from '../config/index.js';
import { counterService } from '../services/counterService.js';
import { notificationService } from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

class PredictionJob {
  public start() {
    // Run every minute (you can adjust this schedule as needed)
    cron.schedule('* * * * *', async () => {
      // Off-switch for easy debugging or pausing
      if (!config.enablePredictionJob) {
        logger.info('[Cron Job] Skipped - enablePredictionJob is false in config.');
        return;
      }

      try {
        logger.info('[Cron Job] Running prediction task...');

        // 2. Perform a system-wide action. For example, get the current prediction count.
        // The original call to getRefillPrediction was incorrect as it requires user-specific data.
        const count = counterService.getCount();

        // 3. Trigger a push notification to specific clients
        notificationService.broadcast({
          title: 'System Status Update',
          message: `A total of ${count} refill predictions have been made so far.`,
          type: 'info',
        });

      } catch (error) {
        // 4. Non-blocking: Catch errors so the server doesn't crash if the cron fails
        logger.error({ err: error }, '[Cron Job] Error during execution');
      }
    });
  }
}

export const predictionJob = new PredictionJob();
