import { Request, Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet } from "jose";

export interface DecodedUser {
  email: string;
  role?: string;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      decoded?: DecodedUser;
    }
  }
}

let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!JWKS) {
    const clientUrl = process.env.CLIENT_URL;
    if (!clientUrl) {
      throw new Error("CLIENT_URL is not set in environment variables");
    }
    JWKS = createRemoteJWKSet(new URL(`${clientUrl}/api/auth/jwks`));
  }
  return JWKS;
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  try {
    const { payload } = await jwtVerify(token, getJWKS());
    req.decoded = payload as DecodedUser;
    next();
  } catch (err) {
    return res.status(401).send({ message: "unauthorized access" });
  }
};
