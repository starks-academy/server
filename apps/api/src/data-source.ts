import { DataSource } from "typeorm";
import { join } from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: join(__dirname, "../../../.env") });

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
  port: process.env.DATABASE_URL
    ? undefined
    : parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DATABASE_URL ? undefined : process.env.DB_USERNAME,
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : process.env.DB_SSL === "true",
  entities: [
    join(__dirname, "../../../libs/database/src/entities/**/*.entity.{ts,js}"),
  ],
  migrations: [
    join(__dirname, "../../../libs/database/src/migrations/**/*.{ts,js}"),
  ],
});
