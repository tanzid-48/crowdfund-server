import { Request, Response, NextFunction } from "express";

export const verifyRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.decoded?.role;
    if (!userRole || !allowedRoles.includes(userRole as string)) {
      return res.status(403).send({ message: "forbidden access" });
    }
    next();
  };
};