import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { counterService } from './counterService.js';

// --- Refill Prediction Types ---
export interface RefillPredictionInput {
  cooking_days_per_week: number;
  cylinder_size_kg: number;
  household_size: number;
  last_refill_date: string; // YYYY-MM-DD
  lpg_primary_fuel: 'yes' | 'no';
  meals_per_day: number;
  number_previous_cycles: number;
  refill_quantity_kg: number;
  usage_change: 'normal' | 'increased' | 'decreased';
}

export interface RefillPredictionOutput {
  estimated_cycle_days: number;
  estimated_days_remaining: number;
  estimated_refill_date: string; // YYYY-MM-DD
  recommended_action: string;
  confidence: string; // e.g., "Early Estimate"
  [key: string]: any; // Allow other properties
}

// --- Chat Assistant Types ---
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatInput {
  user_message: string;
  conversation_history: ChatMessage[];
  household_profile?: Record<string, any>;
}

export interface ChatOutput {
  reply: string;
}

const AI_BASE_URL = config.aiApiBaseUrl || 'https://flameiq.onrender.com/v1';

class AIService {
  /**
   * Gets a gas refill prediction from the AI model.
   * @param input - The data required for the prediction model.
   * @returns The prediction result from the AI service.
   */
  public async getRefillPrediction(input: RefillPredictionInput): Promise<RefillPredictionOutput> {
    const endpoint = `${AI_BASE_URL}/predictions/refill`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new AppError(`AI service request failed: ${response.status} - ${errorBody}`, response.status);
      }

      const prediction = await response.json() as RefillPredictionOutput;
      const newCount = counterService.increment();
      logger.info(`[AI Service] New refill prediction processed! Total predictions: ${newCount}`);
      return prediction;

    } catch (error) {
      logger.error({ err: error, endpoint, input }, 'Error calling AI refill prediction service');
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to communicate with the AI prediction service.', 503);
    }
  }

  /**
   * Sends a message to the AI chat assistant and gets a reply.
   * @param input - The user's message and conversation context.
   * @returns The assistant's reply.
   */
  public async getChatReply(input: ChatInput): Promise<ChatOutput> {
    const endpoint = `${AI_BASE_URL}/chat/message`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new AppError(`AI chat service request failed: ${response.status} - ${errorBody}`, response.status);
      }

      const reply = await response.json() as ChatOutput;
      logger.info(`[AI Service] Chat reply received.`);
      return reply;

    } catch (error) {
      logger.error({ err: error, endpoint }, 'Error calling AI chat service');
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to communicate with the AI chat service.', 503);
    }
  }
}

export const aiService = new AIService();
