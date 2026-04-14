const jwt: typeof import("jsonwebtoken") = require("jsonwebtoken");
const bcrypt: typeof import("bcryptjs") = require("bcryptjs");

import type { JwtPayload, SignOptions } from "jsonwebtoken";

const JWT_SECRET: string =
  process.env.JWT_SECRET || "dev_secret_change_this_before_production";

const JWT_EXPIRES_IN: string =
  process.env.JWT_EXPIRES_IN || "7d";

type TokenPayload = string | Buffer | Record<string, unknown>;
type VerifiedToken = string | JwtPayload | null;

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

function createToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

function verifyToken(token: string): VerifiedToken {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
};