import { EdenredClient } from "./edenred.js";
import { parseMovements } from "./parser.js";

export { EdenredClient } from "./edenred.js";
export { cleanPayeeName, parseMovements } from "./parser.js";

/**
 * Fetches MyEdenred Portugal transactions formatted for Actual Budget.
 *
 * @param {object} options
 * @param {string} options.token - Valid MyEdenred bearer token
 * @param {Array<{ actualAccountId: string, cardId?: number|null, name?: string }>} options.cards - Card-to-Actual-account mappings
 * @returns {Promise<{ cards: Array<{ cardId: number, cardName: string, actualAccountId: string, balance: number|null, transactions: Array<object> }>, transactions: Array<object> }>}
 */
export async function getTransactions({ token, cards }) {
    if (!token) {
        throw new Error("Edenred token is required.");
    }
    if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error("At least one Edenred card mapping with actualAccountId is required.");
    }

    const client = new EdenredClient(token);
    const remoteCards = await client.getCards();

    const cardResults = [];
    const allTransactions = [];

    for (const [index, card] of remoteCards.entries()) {
        const mapping = cards.find(c => c.cardId === card.id) ||
                        cards.find((c, i) => !c.cardId && i === index);

        if (!mapping || !mapping.actualAccountId) {
            continue;
        }

        const details = await client.getCardDetails(card.id);
        const movements = details?.movementList || [];
        const transactions = parseMovements(movements, card.id, mapping.actualAccountId);

        cardResults.push({
            cardId: card.id,
            cardName: mapping.name || `Card ${card.id}`,
            actualAccountId: mapping.actualAccountId,
            balance: details?.account?.availableBalance ?? null,
            transactions
        });
        allTransactions.push(...transactions);
    }

    return {
        cards: cardResults,
        transactions: allTransactions
    };
}
