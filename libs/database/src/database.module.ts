import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { join } from "path";

import { User } from "./entities/user.entity";
import { UserProgress } from "./entities/user-progress.entity";
import { QuizSession } from "./entities/quiz-session.entity";
import { ChatSession } from "./entities/chat-session.entity";
import { ChatMessage } from "./entities/chat-message.entity";
import { XpEvent } from "./entities/xp-event.entity";
import { Badge } from "./entities/badge.entity";
import { UserBadge } from "./entities/user-badge.entity";
import { Certificate } from "./entities/certificate.entity";
import { GalleryProject } from "./entities/gallery-project.entity";
import { ProjectVote } from "./entities/project-vote.entity";
import { BuilderProfile } from "./entities/builder-profile.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const dbUrl = config.get<string>("database.url");
        const ssl = config.get<boolean>("database.ssl");

        const base: Partial<TypeOrmModuleOptions> = {
          type: "postgres",
          ssl: ssl ? { rejectUnauthorized: false } : false,
          entities: [
            User,
            UserProgress,
            QuizSession,
            ChatSession,
            ChatMessage,
            XpEvent,
            Badge,
            UserBadge,
            Certificate,
            GalleryProject,
            ProjectVote,
            BuilderProfile,
          ],
          migrations: [join(__dirname, "migrations/**/*.{ts,js}")],
          synchronize: process.env.NODE_ENV === "test",
          logging: process.env.NODE_ENV === "development",
        };

        if (dbUrl) {
          return { ...base, type: "postgres", url: dbUrl } as TypeOrmModuleOptions;
        }

        return {
          ...base,
          type: "postgres",
          host: config.get<string>("database.host"),
          port: config.get<number>("database.port"),
          username: config.get<string>("database.username"),
          password: config.get<string>("database.password"),
          database: config.get<string>("database.database"),
        } as TypeOrmModuleOptions;
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule { }
