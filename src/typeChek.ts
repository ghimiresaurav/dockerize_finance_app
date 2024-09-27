import { NextFunction, Request, Response } from "express";
import { AnyZodObject, z } from "zod";

export const validateInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return (schema: AnyZodObject) => {
    try {
      schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

const transactinType = {
  debit: "debit",
  credit: "credit",
};

const createTransactionSchema = z.object({
  account_id: z.string({ required_error: "Account id is required" }),
  amount: z.number({ required_error: "amount is reuqired" }),
  transaction_type: z.nativeEnum(transactinType),
  description: z.string(),
});

export const createTransactionValidationSchema = z.object({
  body: createTransactionSchema.strict({ message: "invalid fields" }),
});
