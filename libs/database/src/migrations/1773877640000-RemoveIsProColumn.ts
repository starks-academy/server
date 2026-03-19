import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveIsProColumn1773877640000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_pro"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "is_pro" boolean NOT NULL DEFAULT false`);
  }
}
