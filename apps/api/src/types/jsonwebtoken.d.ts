declare module "jsonwebtoken" {
  export interface JwtPayload {
    [key: string]: unknown;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }

  export interface SignOptions {
    algorithm?: string;
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    subject?: string;
    issuer?: string;
    jwtid?: string;
    mutatePayload?: boolean;
    noTimestamp?: boolean;
    header?: Record<string, unknown>;
    encoding?: string;
    allowInsecureKeySizes?: boolean;
    allowInvalidAsymmetricKeyTypes?: boolean;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string,
    options?: SignOptions
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string
  ): string | JwtPayload;
}