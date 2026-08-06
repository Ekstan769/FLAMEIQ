import nodemailer from "nodemailer";
import axios from "axios";

const mailer = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Gmail app password for the email account
    },
})

async function sendOtpEmail(to: string, otp: string): Promise<void> {
    await mailer.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: "Your GasPoint verification code",
        text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
    });
}

async function sendOtpSms(to: string, otp: string): Promise<void> {
    await axios.post("https://api.ng.termii.com/api/sms/send", {
        api_key: process.env.TERMII_API_KEY,
        to, // e.g. "234812345678"
        from: process.env.TERMII_SENDER_ID,
        sms: `Your GasPoint verification code is ${otp}. It expires in 10 minutes.`,
        type: "plain",
        channel: "dnd", // required for reliable OTP delivery to Nigerian numbers
    });
}

// Single entry point: pick a channel, or send both.
type OtpChannel = "sms" | "email" | "both";

export async function sendOtp(
    channel: OtpChannel,
    otp: string,
    destination: { phone?: string; email?: string }
): Promise<void> {
    if ((channel === "sms" || channel === "both") && destination.phone) {
        await sendOtpSms(destination.phone, otp);
    }
    if ((channel === "email" || channel === "both") && destination.email) {
        await sendOtpEmail(destination.email, otp);
    }
}