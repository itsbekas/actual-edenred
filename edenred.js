import axios from "axios";

const BASE_URL = "https://www.myedenred.pt/edenred-customer/v2";

export class EdenredClient {
    constructor(token = null) {
        this.token = token;
        this.client = axios.create({
            baseURL: BASE_URL,
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            }
        });
    }

    /**
     * Step 1: Send user credentials.
     * Edenred returns a challenge ID and emails an OTP confirmation code.
     * @param {string} username - User email
     * @param {string} password - User password
     * @returns {Promise<number|string>} challengeId
     */
    async initiateLogin(username, password) {
        try {
            const response = await this.client.post(
                "/authenticate/default",
                {
                    userId: username,
                    password: password
                },
                {
                    params: {
                        appVersion: "1.0",
                        appType: "PORTAL",
                        channel: "WEB"
                    }
                }
            );

            const challengeId = response.data?.data?.challengeId;
            if (!challengeId) {
                // If 2FA was not triggered and a direct token was returned:
                if (response.data?.data?.token) {
                    this.token = response.data.data.token;
                    return null;
                }
                throw new Error("Login failed: no challengeId or token returned by Edenred.");
            }

            return challengeId;
        } catch (error) {
            if (error.response) {
                const msg = error.response.data?.message?.join?.(", ") || error.response.data?.message || JSON.stringify(error.response.data);
                throw new Error(`Edenred login error (HTTP ${error.response.status}): ${msg}`);
            }
            throw error;
        }
    }

    /**
     * Step 2: Submit the email OTP code to complete login.
     * @param {string} username - User email
     * @param {string} password - User password
     * @param {number|string} challengeId - Challenge ID from step 1
     * @param {string} otpCode - Code received in email
     * @returns {Promise<string>} Authentication token
     */
    async completeLogin(username, password, challengeId, otpCode) {
        try {
            const response = await this.client.post(
                "/authenticate/default/challenge",
                {
                    userId: username,
                    password: password,
                    authenticationMfaProcessId: challengeId,
                    token: otpCode
                },
                {
                    params: {
                        appVersion: "1.0",
                        appType: "PORTAL",
                        channel: "WEB"
                    },
                    headers: {
                        Authorization: otpCode
                    }
                }
            );

            const token = response.data?.data?.token;
            if (!token) {
                throw new Error("2FA verification failed: no token returned in response.");
            }

            this.token = token;
            return token;
        } catch (error) {
            if (error.response) {
                const msg = error.response.data?.message?.join?.(", ") || error.response.data?.message || JSON.stringify(error.response.data);
                throw new Error(`Edenred 2FA error (HTTP ${error.response.status}): ${msg}`);
            }
            throw error;
        }
    }

    /**
     * Fetches all cards associated with the authenticated account.
     * @returns {Promise<Array<object>>} List of cards
     */
    async getCards() {
        if (!this.token) {
            throw new Error("Not authenticated. Please log in first.");
        }

        try {
            const response = await this.client.get("/protected/card/list", {
                params: {
                    appVersion: "1.0",
                    appType: "PORTAL",
                    channel: "WEB"
                },
                headers: {
                    Authorization: this.token
                }
            });

            return response.data?.data || [];
        } catch (error) {
            if (error.response) {
                throw new Error(`Failed to list cards (HTTP ${error.response.status})`);
            }
            throw error;
        }
    }

    /**
     * Fetches details and transaction movements for a card.
     * @param {string|number} cardId - Internal card ID
     * @returns {Promise<object>} Account details and movementList
     */
    async getCardDetails(cardId) {
        if (!this.token) {
            throw new Error("Not authenticated. Please log in first.");
        }

        try {
            const response = await this.client.get(`/protected/card/${cardId}/accountmovement`, {
                params: {
                    appVersion: "1.0",
                    appType: "PORTAL",
                    channel: "WEB"
                },
                headers: {
                    Authorization: this.token
                }
            });

            return response.data?.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`Failed to fetch movements for card ${cardId} (HTTP ${error.response.status})`);
            }
            throw error;
        }
    }
}
