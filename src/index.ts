import express, { Request, Response } from "express";
import { CustomError, errorHandler } from "./error.middleware";
import { createTransactionValidationSchema, validateInput } from "./typeChek";
import { PrismaClient } from "@prisma/client";
import redisClient from "./redis";

// import * as controller from "./controllers";
const app = express();
app.use(express.json());
const prisma = new PrismaClient();

const port = 3000;

// const transferFund = async(fromId: string, toId: string, amount: number) => {
//     return prisma.$transaction(async(tx) => {
// const sender = await tx.account.update({
// })
//     })
// }

app.post(
  "/create-transaction",
  //   validateInput(createTransactionValidationSchema),
  async (req: Request, res: Response) => {
    // transact
    const { body } = req;
    console.log(body);
    // return;
    const transactionDetails = {
      amount: body.amount,
      transaction_type: body.transaction_type,
      description: body.description,
      account_id: body.account_id,
    };

    // ensure the account exists
    const account = await prisma.account.findFirst({
      where: { account_id: transactionDetails.account_id },
    });

    if (!account) {
      throw new CustomError(404, "Account not found");
    }

    const def_account = (await redisClient?.get("def_account")) as string;

    let fromAccount = def_account;
    let toAccount = account.account_id;
    if (transactionDetails.transaction_type === "credit") {
      // await transferFund(fromAccount, toAccount, transactionDetails.amount);

      await prisma.account.update({
        where: {
          account_id: transactionDetails.account_id,
        },
        data: {
          balance: {
            increment: transactionDetails.amount,
          },
        },
      });

      await prisma.account.update({
        where: {
          account_id: def_account,
        },
        data: {
          balance: {
            decrement: transactionDetails.amount,
          },
        },
      });
    } else {
      fromAccount = account.account_id;
      toAccount = def_account;

      await prisma.account.update({
        where: {
          account_id: transactionDetails.account_id,
        },
        data: {
          balance: {
            decrement: transactionDetails.amount,
          },
        },
      });

      await prisma.account.update({
        where: {
          account_id: def_account,
        },
        data: {
          balance: {
            increment: transactionDetails.amount,
          },
        },
      });
    }

    await prisma.transaction.create({
      data: {
        from_account_id: fromAccount,
        to_account_id: toAccount as string,
        description: transactionDetails.description as string,
        amount: transactionDetails.amount as number,
        transaction_type: transactionDetails.transaction_type,
      },
    });
    res.json({ success: true });
  }
);

const seedAccount = async () => {
  await prisma.account.create({ data: { balance: 100 } });
};
const seedMainAccount = async () => {
  console.log("seeidng main account");
  const accountExists = await prisma.account.findFirst({});
  if (accountExists) {
    await redisClient?.set("def_account", accountExists.account_id);
  }

  const newAccount = await prisma.account.create({
    data: {
      balance: 10000,
    },
  });

  await redisClient?.set("def_account", newAccount.account_id);
};

app.get("/transactions", async (req: Request, res: Response) => {
  console.log("getting transactions");

  const transactions = await prisma.transaction.findMany({});

  res.json({ transactions });
});

app.get("/accounts", async (req: Request, res: Response) => {
  console.log("getting accounts");

  const mainAccExists = await redisClient?.get("def_account");

  if (!mainAccExists) {
    console.log("seeding accounts");
    await seedMainAccount();

    await seedAccount();
  }

  const accounts = await prisma.account.findMany({});

  res.json({ accounts });
});

app.get("/account/balance/:accountId", async (req: Request, res: Response) => {
  console.log("getting specific accoutn");

  const accountId = req.params.accountId;
  const account = await prisma.account.findFirst({
    where: { account_id: accountId },
  });

  if (!account) {
    throw new CustomError(404, "Account not found");
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [{ from_account_id: accountId }, { to_account_id: accountId }],
    },
    take: 5,
  });

  res.json({ account, transactions });
});

app.use(errorHandler);

app.listen(port, () => console.log(`server started on port ${port}`));
