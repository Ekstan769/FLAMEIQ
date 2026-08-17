import { z } from "zod";

export const createReviewSchema = z.object({
    orderId: z.string().min(1, "orderId is required"),
    rating: z.number().min(1, "rating must be at least 1").max(5, "rating must be at most 5"),
    comment: z.string().optional(),
});