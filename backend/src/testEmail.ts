// temporary delete after testing
import "dotenv/config";
import { sendOtp } from "./lib/otpSender.js";

const testEmail = "fnHt2@example.com"; 

sendOtp("email", "123456", { email: testEmail })
    .then(() => console.log("OTP email sent successfully"))
    .catch((error) => console.error("Failed to send:", error));
