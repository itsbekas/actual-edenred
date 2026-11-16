import { createHash } from "node:crypto";
import dayjs from "dayjs";

function amountToInteger(amount) {
    return Math.round(Number(amount) * 100);
}

/**
 * Normalizes merchant names (e.g., strips "Compra: " and extra whitespace).
 */
export function cleanPayeeName(transactionName) {
    if (!transactionName) return "Desconhecido";
    return transactionName
        .replace(/^Compra:\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Transforms an Edenred card movement list into Actual Budget transaction objects.
 * @param {Array<object>} movements - Raw movements from Edenred API
 * @param {string|number} cardId - Edenred card ID
 * @param {string} actualAccountId - Target Actual Budget account ID
 * @returns {Array<object>} Transactions ready for Actual's importTransactions
 */
export function parseMovements(movements, cardId, actualAccountId) {
    if (!Array.isArray(movements) || movements.length === 0) {
        return [];
    }

    const transactions = [];

    for (const m of movements) {
        if (!m.transactionDate || m.amount === undefined || m.amount === null) {
            continue;
        }

        const date = dayjs(m.transactionDate).format("YYYY-MM-DD");
        const amount = amountToInteger(m.amount);
        const payee_name = cleanPayeeName(m.transactionName);
        const imported_payee = payee_name;
        const notes = null;

        // Deterministic unique hash based on card, exact timestamp, amount, and running balance
        const hashPayload = `${cardId}:${m.transactionDate}:${m.amount}:${m.balance ?? ""}:${m.transactionName || ""}`;
        const imported_id = createHash("sha256").update(hashPayload).digest("hex");

        transactions.push({
            account: actualAccountId,
            date,
            amount,
            payee_name,
            imported_payee,
            notes,
            imported_id,
            cleared: true
        });
    }

    return transactions;
}
