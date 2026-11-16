# actual-edenred

Library for fetching MyEdenred Portugal card movements in [Actual Budget](https://actualbudget.org/) transaction format.

## Usage

```js
import { getTransactions } from "actual-edenred";

const { cards, transactions } = await getTransactions({
  token: process.env.EDENRED_TOKEN,
  cards: [
    { name: "Edenred Refeição", actualAccountId: "<actual-account-id>" },
    { name: "Edenred Flexível", actualAccountId: "<actual-account-id>" },
  ],
});
```

### Generating `EDENRED_TOKEN`

Set `EDENRED_EMAIL` and `EDENRED_PASSWORD` in `.env` and run:

```bash
npm run auth
```

Follow the email OTP prompt to obtain a fresh `EDENRED_TOKEN`.
