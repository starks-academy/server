import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  anthropicConfig,
  stacksConfig,
} from "./app.config";

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        anthropicConfig,
        stacksConfig,
      ],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid("development", "production", "test")
          .default("development"),
        PORT: Joi.number().default(3001),
        API_PREFIX: Joi.string().default("api/v1"),
        DB_HOST: Joi.string().when("DATABASE_URL", {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.string().required(),
        }),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().when("DATABASE_URL", {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.string().required(),
        }),
        DB_PASSWORD: Joi.string().when("DATABASE_URL", {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.string().required(),
        }),
        DB_NAME: Joi.string().when("DATABASE_URL", {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.string().required(),
        }),
        DB_SSL: Joi.boolean().default(false),
        DATABASE_URL: Joi.string().uri().optional(),
        JWT_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
        ANTHROPIC_API_KEY: Joi.string().required(),
        ANTHROPIC_MODEL: Joi.string().default("claude-haiku-4-5-20251001"),
        STACKS_NETWORK: Joi.string()
          .valid("testnet", "mainnet")
          .default("testnet"),
        STACKS_API_URL: Joi.string().uri().required(),
        LOG_LEVEL: Joi.string()
          .valid("debug", "info", "warn", "error")
          .default("info"),
      }),
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
