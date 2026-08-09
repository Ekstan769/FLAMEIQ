// temporary delete after testing
import "dotenv/config";
import { sendOtp } from "./lib/otpSender.js";

const testEmail = "ekestanley1234@gmail.com"; 

sendOtp("email", "123456", { email: testEmail })
    .then(() => console.log("OTP email sent successfully"))
    .catch((error) => console.error("Failed to send:", error));