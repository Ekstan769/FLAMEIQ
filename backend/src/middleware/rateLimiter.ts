import rateLimit from "express-rate-limit";

// General limiter - applies to all routes
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window per IP
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limiter - for login/OTP endpoints specifically, since those are the actual brute-force targets ("intelligents hackers" go straight here)
export const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // only 5 attempts per window per IP
    message: { error: "Too many attempts. Try agin in 10 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});