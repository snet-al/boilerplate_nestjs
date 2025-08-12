import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixApiKeysTimestamps1680000000000 implements MigrationInterface {
  name = 'FixApiKeysTimestamps1680000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCreatedAt = await queryRunner.hasColumn('api_keys', 'createdAt')
    if (hasCreatedAt) {
      await queryRunner.query('ALTER TABLE `api_keys` CHANGE `createdAt` `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP')
    }
    const hasUpdatedAt = await queryRunner.hasColumn('api_keys', 'updatedAt')
    if (hasUpdatedAt) {
      await queryRunner.query('ALTER TABLE `api_keys` CHANGE `updatedAt` `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP')
    }
    const hasDeletedAt = await queryRunner.hasColumn('api_keys', 'deletedAt')
    if (hasDeletedAt) {
      await queryRunner.query('ALTER TABLE `api_keys` CHANGE `deletedAt` `deleted_at` datetime NULL')
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasCreated = await queryRunner.hasColumn('api_keys', 'created_at')
    if (hasCreated) {
      await queryRunner.query('ALTER TABLE `api_keys` CHANGE `created_at` `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP')
    }
    const hasUpdated = await queryRunner.hasColumn('api_keys', 'updated_at')
    if (hasUpdated) {
      await queryRunner.query('ALTER TABLE `api_keys` CHANGE `updated_at` `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP')
    }
    const hasDeleted = await queryRunner.hasColumn('api_keys', 'deleted_at')
    if (hasDeleted) {
      await queryRunner.query('ALTER TABLE `api_keys` CHANGE `deleted_at` `deletedAt` datetime NULL')
    }
  }
}


