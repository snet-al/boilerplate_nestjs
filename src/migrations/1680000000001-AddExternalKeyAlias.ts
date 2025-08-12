import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm'

export class AddExternalKeyAlias1680000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const has = await queryRunner.hasColumn('api_keys', 'external_key_alias')
    if (!has) {
      await queryRunner.query('ALTER TABLE `api_keys` ADD `external_key_alias` varchar(255) NULL')
      await queryRunner.createIndex('api_keys', new TableIndex({ name: 'IDX_api_keys_ext_alias', columnNames: ['external_key_alias'] }))
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('api_keys', 'IDX_api_keys_ext_alias')
    await queryRunner.query('ALTER TABLE `api_keys` DROP COLUMN `external_key_alias`')
  }
}


