import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enums
    await queryRunner.query(
      `CREATE TYPE "user_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "step_state_enum" AS ENUM('locked', 'in_progress', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "quiz_format_enum" AS ENUM('multi_choice', 'open_ended', 'mixed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "message_role_enum" AS ENUM('user', 'assistant')`,
    );
    await queryRunner.query(
      `CREATE TYPE "project_category_enum" AS ENUM('DeFi', 'NFTs', 'DAOs', 'Tooling', 'Other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "moderation_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "builder_category_enum" AS ENUM('Ecosystem', 'DeFi', 'NFTs', 'Tooling', 'Education')`,
    );

    // users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"               uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"       TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP         NOT NULL DEFAULT now(),
        "wallet_address"   character varying(100) NOT NULL,
        "display_name"     character varying(100),
        "avatar_url"       character varying,
        "bio"              text,
        "xp_total"         integer           NOT NULL DEFAULT 0,
        "level"            integer           NOT NULL DEFAULT 1,
        "streak_days"      integer           NOT NULL DEFAULT 0,
        "longest_streak"   integer           NOT NULL DEFAULT 0,
        "last_activity_at" TIMESTAMP,
        "role"             "user_role_enum"  NOT NULL DEFAULT 'user',
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_wallet_address" ON "users" ("wallet_address")`,
    );

    // badges
    await queryRunner.query(`
      CREATE TABLE "badges" (
        "id"                serial            NOT NULL,
        "slug"              character varying(100) NOT NULL,
        "name"              character varying(100) NOT NULL,
        "description"       text              NOT NULL,
        "image_url"         character varying NOT NULL,
        "xp_reward"         integer           NOT NULL DEFAULT 0,
        "trigger_condition" character varying(255) NOT NULL,
        CONSTRAINT "PK_badges" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_badges_slug" UNIQUE ("slug")
      )
    `);

    // user_progress
    await queryRunner.query(`
      CREATE TABLE "user_progress" (
        "id"           uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"   TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP         NOT NULL DEFAULT now(),
        "user_id"      uuid              NOT NULL,
        "course_id"    integer           NOT NULL,
        "lesson_id"    integer           NOT NULL,
        "step_id"      integer           NOT NULL,
        "state"        "step_state_enum" NOT NULL DEFAULT 'locked',
        "completed_at" TIMESTAMP,
        CONSTRAINT "PK_user_progress" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_progress" UNIQUE ("user_id", "course_id", "lesson_id", "step_id")
      )
    `);

    // quiz_sessions
    await queryRunner.query(`
      CREATE TABLE "quiz_sessions" (
        "id"               uuid               NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"       TIMESTAMP          NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP          NOT NULL DEFAULT now(),
        "user_id"          uuid               NOT NULL,
        "topic"            character varying(255) NOT NULL,
        "format"           "quiz_format_enum" NOT NULL,
        "include_advanced" boolean            NOT NULL DEFAULT false,
        "questions"        jsonb,
        "score"            integer,
        "graded_at"        TIMESTAMP,
        CONSTRAINT "PK_quiz_sessions" PRIMARY KEY ("id")
      )
    `);

    // chat_sessions
    await queryRunner.query(`
      CREATE TABLE "chat_sessions" (
        "id"                uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "user_id"           uuid      NOT NULL,
        "title"             character varying(255),
        "current_course_id" integer,
        "current_lesson_id" integer,
        CONSTRAINT "PK_chat_sessions" PRIMARY KEY ("id")
      )
    `);

    // chat_messages
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id"          uuid                 NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"  TIMESTAMP            NOT NULL DEFAULT now(),
        "session_id"  uuid                 NOT NULL,
        "role"        "message_role_enum"  NOT NULL,
        "content"     text                 NOT NULL,
        "token_count" integer,
        CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id")
      )
    `);

    // xp_events
    await queryRunner.query(`
      CREATE TABLE "xp_events" (
        "id"           uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        "user_id"      uuid      NOT NULL,
        "amount"       integer   NOT NULL,
        "reason"       character varying(100) NOT NULL,
        "reference_id" character varying(255),
        CONSTRAINT "PK_xp_events" PRIMARY KEY ("id")
      )
    `);

    // user_badges
    await queryRunner.query(`
      CREATE TABLE "user_badges" (
        "user_id"   uuid      NOT NULL,
        "badge_id"  integer   NOT NULL,
        "earned_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_badges" PRIMARY KEY ("user_id", "badge_id")
      )
    `);

    // certificates
    await queryRunner.query(`
      CREATE TABLE "certificates" (
        "id"           uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP NOT NULL DEFAULT now(),
        "user_id"      uuid      NOT NULL,
        "module_id"    integer   NOT NULL,
        "score"        integer   NOT NULL,
        "tx_id"        character varying(100),
        "nft_token_id" integer,
        "minted_at"    TIMESTAMP,
        "metadata"     jsonb,
        CONSTRAINT "PK_certificates" PRIMARY KEY ("id")
      )
    `);

    // gallery_projects
    await queryRunner.query(`
      CREATE TABLE "gallery_projects" (
        "id"                uuid                      NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"        TIMESTAMP                 NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP                 NOT NULL DEFAULT now(),
        "user_id"           uuid                      NOT NULL,
        "title"             character varying(200)    NOT NULL,
        "description"       text                      NOT NULL,
        "category"          "project_category_enum"   NOT NULL,
        "repo_url"          character varying,
        "contract_address"  character varying(100),
        "demo_url"          character varying,
        "vote_count"        integer                   NOT NULL DEFAULT 0,
        "is_featured"       boolean                   NOT NULL DEFAULT false,
        "moderation_status" "moderation_status_enum"  NOT NULL DEFAULT 'pending',
        CONSTRAINT "PK_gallery_projects" PRIMARY KEY ("id")
      )
    `);

    // project_votes
    await queryRunner.query(`
      CREATE TABLE "project_votes" (
        "user_id"    uuid      NOT NULL,
        "project_id" uuid      NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_votes" PRIMARY KEY ("user_id", "project_id")
      )
    `);

    // builder_profiles
    await queryRunner.query(`
      CREATE TABLE "builder_profiles" (
        "id"              uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"      TIMESTAMP                NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP                NOT NULL DEFAULT now(),
        "name"            character varying(100)   NOT NULL,
        "handle"          character varying(100)   NOT NULL,
        "role"            character varying(200)   NOT NULL,
        "description"     text                     NOT NULL,
        "twitter_url"     character varying,
        "website_url"     character varying,
        "category"        "builder_category_enum"  NOT NULL,
        "followers"       character varying(50),
        "avatar_gradient" character varying(100)   NOT NULL DEFAULT 'from-blue-500 to-purple-600',
        "initials"        character varying(10)    NOT NULL DEFAULT 'SA',
        "is_approved"     boolean                  NOT NULL DEFAULT false,
        "submitted_by"    uuid,
        CONSTRAINT "PK_builder_profiles" PRIMARY KEY ("id")
      )
    `);

    // Foreign keys
    await queryRunner.query(
      `ALTER TABLE "user_progress"   ADD CONSTRAINT "FK_user_progress_user"       FOREIGN KEY ("user_id")    REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_sessions"   ADD CONSTRAINT "FK_quiz_sessions_user"       FOREIGN KEY ("user_id")    REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_sessions"   ADD CONSTRAINT "FK_chat_sessions_user"       FOREIGN KEY ("user_id")    REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages"   ADD CONSTRAINT "FK_chat_messages_session"    FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "xp_events"       ADD CONSTRAINT "FK_xp_events_user"           FOREIGN KEY ("user_id")    REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges"     ADD CONSTRAINT "FK_user_badges_user"         FOREIGN KEY ("user_id")    REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges"     ADD CONSTRAINT "FK_user_badges_badge"        FOREIGN KEY ("badge_id")   REFERENCES "badges"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates"    ADD CONSTRAINT "FK_certificates_user"        FOREIGN KEY ("user_id")    REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "gallery_projects" ADD CONSTRAINT "FK_gallery_projects_user"   FOREIGN KEY ("user_id")    REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_votes"   ADD CONSTRAINT "FK_project_votes_user"       FOREIGN KEY ("user_id")    REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_votes"   ADD CONSTRAINT "FK_project_votes_project"    FOREIGN KEY ("project_id") REFERENCES "gallery_projects"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "builder_profiles" ADD CONSTRAINT "FK_builder_profiles_user"   FOREIGN KEY ("submitted_by") REFERENCES "users"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "builder_profiles"  DROP CONSTRAINT "FK_builder_profiles_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_votes"     DROP CONSTRAINT "FK_project_votes_project"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_votes"     DROP CONSTRAINT "FK_project_votes_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gallery_projects"  DROP CONSTRAINT "FK_gallery_projects_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates"      DROP CONSTRAINT "FK_certificates_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges"       DROP CONSTRAINT "FK_user_badges_badge"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges"       DROP CONSTRAINT "FK_user_badges_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "xp_events"         DROP CONSTRAINT "FK_xp_events_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages"     DROP CONSTRAINT "FK_chat_messages_session"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_sessions"     DROP CONSTRAINT "FK_chat_sessions_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_sessions"     DROP CONSTRAINT "FK_quiz_sessions_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_progress"     DROP CONSTRAINT "FK_user_progress_user"`,
    );

    await queryRunner.query(`DROP TABLE "builder_profiles"`);
    await queryRunner.query(`DROP TABLE "project_votes"`);
    await queryRunner.query(`DROP TABLE "gallery_projects"`);
    await queryRunner.query(`DROP TABLE "certificates"`);
    await queryRunner.query(`DROP TABLE "user_badges"`);
    await queryRunner.query(`DROP TABLE "xp_events"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(`DROP TABLE "chat_sessions"`);
    await queryRunner.query(`DROP TABLE "quiz_sessions"`);
    await queryRunner.query(`DROP TABLE "user_progress"`);
    await queryRunner.query(`DROP TABLE "badges"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "builder_category_enum"`);
    await queryRunner.query(`DROP TYPE "moderation_status_enum"`);
    await queryRunner.query(`DROP TYPE "project_category_enum"`);
    await queryRunner.query(`DROP TYPE "message_role_enum"`);
    await queryRunner.query(`DROP TYPE "quiz_format_enum"`);
    await queryRunner.query(`DROP TYPE "step_state_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
