import { z } from "zod";

export const registerCylinderSchema = z.object({
    size: z.enum(["KG_3", "KG_6", "KG_12", "KG_12_5", "KG_25"], {
        message: "size must be one of KG_3, KG_6, KG_12, KG_12_5, KG_25"
    }),
    serialNumber: z.string().min(1, "serialNumber is required").optional(),
    nickname: z.string().optional(),
});