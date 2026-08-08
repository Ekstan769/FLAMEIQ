/**
 * Smart Counter Service
 * 
 * An in-memory store for keeping track of prediction metrics.
 * Designed to minimize heavy DB queries by caching the counter in memory.
 * You can eventually hook up a periodic DB write operation here.
 */
class CounterService {
  private predictionCount: number = 0;

  constructor() {
    // If you had a DB, you'd load the initial count here during initialization.
    this.predictionCount = 0;
  }

  /**
   * Increments the prediction count by 1.
   * Can be extended to batch updates to the database to reduce load.
   */
  public increment(): number {
    this.predictionCount += 1;
    return this.predictionCount;
  }

  /**
   * Retrieves the current prediction count.
   */
  public getCount(): number {
    return this.predictionCount;
  }
}

export const counterService = new CounterService();
