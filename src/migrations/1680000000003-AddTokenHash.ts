import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm'

export class AddTokenHash1680000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const has = await queryRunner.hasColumn('api_keys', 'token_hash')
    if (!has) {
      await queryRunner.query('ALTER TABLE `api_keys` ADD `token_hash` varchar(255) NULL')
      await queryRunner.createIndex('api_keys', new TableIndex({ name: 'IDX_api_keys_token_hash', columnNames: ['token_hash'] }))
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('api_keys', 'IDX_api_keys_token_hash')
    await queryRunner.query('ALTER TABLE `api_keys` DROP COLUMN `token_hash`')
  }
}


