import { createInterface } from "readline/promises";
import { EdenredClient } from "./edenred.js";

async function promptOtp() {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const code = await rl.question("Enter the confirmation code sent to your email: ");
        return code.trim();
    } finally {
        rl.close();
    }
}

async function main() {
    const email = process.env.EDENRED_EMAIL;
    const password = process.env.EDENRED_PASSWORD;

    if (!email || !password) {
        console.error("EDENRED_EMAIL and EDENRED_PASSWORD must be set in .env or environment.");
        process.exit(1);
    }

    const client = new EdenredClient();
    console.log(`Authenticating with MyEdenred as ${email}...`);
    const challengeId = await client.initiateLogin(email, password);

    if (challengeId) {
        console.log("Confirmation code sent to your email by Edenred.");
        const otpCode = await promptOtp();
        if (!otpCode) {
            throw new Error("Confirmation code cannot be empty.");
        }

        console.log("Validating code with Edenred...");
        const token = await client.completeLogin(email, password, challengeId, otpCode);
        console.log("\nAuthentication successful! Save this to your .env:\n");
        console.log(`EDENRED_TOKEN="${token}"\n`);
    } else {
        console.log("Login completed without OTP challenge.");
    }
}

main().catch((err) => {
    console.error("Authentication failed:", err.message || err);
    process.exit(1);
});
