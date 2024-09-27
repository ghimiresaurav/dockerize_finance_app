import { NextFunction, Request, Response } from "express";

export class CustomError extends Error {
  statusCode: number;
  message: string;

  constructor(s: number = 500, m: string = "Something went wrong") {
    super();
    this.statusCode = s;
    this.message = m;
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const error = { ...err } as CustomError;

  res.status(error.statusCode).json({ success: false, message: error.message });
};
