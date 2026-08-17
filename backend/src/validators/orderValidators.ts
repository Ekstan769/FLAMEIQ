import { z} from "zod";

export const createOrderSchema = z.object({
    vendorId: z.string().min(1, "vendorId is required"),
    cylinderId: z.string().optional(),
    type: z.enum(["STANDARD", "QUICK"], {
        message: "type must be either STANDARD or QUICK",
    }),
    items: z.array(
        z.object({
            name: z.string().min(1, "Item name is required"),
            quantity: z.number().int().positive("quantity must be a positive number"),
            price: z.number().nonnegative("price cannot be negative"),
        })
    ).min(1, "at least one item is required"),
});