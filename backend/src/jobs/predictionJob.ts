import cron from 'node-cron';
import { config } from '../config/index.js';
import { aiService } from '../services/aiService.js';
import { notificationService } from '../services/notificationService.js';

class PredictionJob {
  public start() {
    // Run every minute (you can adjust this schedule as needed)
    cron.schedule('* * * * *', async () => {
      // 1. Off-switch for easy debugging or pausing
      if (!config.enableCronJob) {
        // eslint-disable-next-line no-console
        console.log('[Cron Job] Skipped - enableCronJob is false in config.');
        return;
      }

      try {
        // eslint-disable-next-line no-console
        console.log('[Cron Job] Running prediction task...');
        
        // 2. Perform actions like querying AI Data (which increments counter)
        const prediction = await aiService.processPrediction({
          id: `cron-${Date.now()}`,
          prediction: 'Market analysis complete (cron)',
        });

        // 3. Trigger a push notification to specific clients
        // TODO: Replace the empty array with the specific client IDs you want to notify.
        notificationService.sendToClients([], {
          title: 'New Automated Prediction',
          message: prediction.prediction,
          type: 'info',
        });

      } catch (error) {
        // 4. Non-blocking: Catch errors so the server doesn't crash if the cron fails
        // eslint-disable-next-line no-console
        console.error('[Cron Job] Error during execution:', error);
      }
    });
  }
}

export const predictionJob = new PredictionJob();
