import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 3001,
  apiPrefix: process.env.API_PREFIX || "api/v1",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
}));

export const databaseConfig = registerAs("database", () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" || !!process.env.DATABASE_URL,
}));

export const jwtConfig = registerAs("jwt", () => ({
  secret: process.env.JWT_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
}));

export const anthropicConfig = registerAs("anthropic", () => ({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
  maxTokens: 4096,
}));

export const stacksConfig = registerAs("stacks", () => ({
  network: process.env.STACKS_NETWORK || "testnet",
  apiUrl: process.env.STACKS_API_URL || "https://api.testnet.hiro.so",
  adminPrivateKey: process.env.STACKS_ADMIN_PRIVATE_KEY,
  certificateContractAddress: process.env.CERTIFICATE_CONTRACT_ADDRESS,
  certificateContractName:
    process.env.CERTIFICATE_CONTRACT_NAME || "stacks-academy-cert",
  certificateImageUrl:
    process.env.CERTIFICATE_IMAGE_URL ||
    "https://purple-accessible-swift-921.mypinata.cloud/ipfs/bafybeicaa5ezzbru2ji2neiwamgcg4pol2i5c74lwlwvpkdogy6z5glkfm",
}));
