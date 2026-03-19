import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";

import { ConfigModule } from "@app/config";
import { DatabaseModule } from "@app/database";
import { GlobalExceptionFilter } from "@app/common/filters/global-exception.filter";
import { TransformInterceptor } from "@app/common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "@app/common/interceptors/logging.interceptor";
import { JwtAuthGuard } from "@app/common/guards/jwt-auth.guard";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { AssessmentsModule } from "./modules/assessments/assessments.module";
import { AiTutorModule } from "./modules/ai-tutor/ai-tutor.module";
import { GamificationModule } from "./modules/gamification/gamification.module";
import { CertificatesModule } from "./modules/certificates/certificates.module";
import { GalleryModule } from "./modules/gallery/gallery.module";
import { BuildersModule } from "./modules/builders/builders.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    // Config first (others depend on it)
    ConfigModule,

    // Structured logging
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || "info",
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined,
      },
    }),

    // Database
    DatabaseModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    AssessmentsModule,
    AiTutorModule,
    GamificationModule,
    CertificatesModule,
    GalleryModule,
    BuildersModule,
  ],
  providers: [
    // Global exception filter — consistent error shapes
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },

    // Global JWT guard — all routes are authenticated by default
    // Use @Public() decorator to opt out
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // Global response envelope: { success, data, meta }
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    // Global request/response logging
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule { }
