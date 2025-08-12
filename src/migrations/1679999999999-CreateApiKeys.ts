import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm'

export class CreateApiKeys1679999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'api_keys',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'deletedAt', type: 'datetime', isNullable: true },
          { name: 'user_id', type: 'int', isNullable: true },
          { name: 'external_user_id', type: 'varchar', isNullable: true },
          { name: 'source', type: 'varchar', default: `'litellm'` },
          { name: 'key_alias', type: 'varchar', isNullable: true },
          { name: 'token_hash', type: 'varchar', isNullable: true },
          { name: 'token_last4', type: 'varchar', isNullable: true },
          { name: 'token_prefix', type: 'varchar', isNullable: true },
          { name: 'litellm_token_id', type: 'varchar', isNullable: true },
          { name: 'expires_at', type: 'datetime', isNullable: true },
          { name: 'blocked', type: 'boolean', default: false },
          { name: 'max_budget', type: 'float', isNullable: true },
          { name: 'spend', type: 'float', isNullable: true },
          { name: 'models', type: 'json', isNullable: true },
          { name: 'allowed_routes', type: 'json', isNullable: true },
          { name: 'metadata', type: 'json', isNullable: true },
          { name: 'tags', type: 'json', isNullable: true },
          { name: 'revoked_at', type: 'datetime', isNullable: true },
          { name: 'rotated_at', type: 'datetime', isNullable: true },
        ],
      })
    )
    await queryRunner.createIndex('api_keys', new TableIndex({ name: 'IDX_api_keys_ext_user', columnNames: ['external_user_id'] }))
    await queryRunner.createIndex('api_keys', new TableIndex({ name: 'UQ_api_keys_token_hash', columnNames: ['token_hash'], isUnique: true }))
    await queryRunner.createForeignKey(
      'api_keys',
      new TableForeignKey({ columnNames: ['user_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'SET NULL' })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('api_keys')
    if (table) {
      const fk = table.foreignKeys.find((f) => f.columnNames.includes('user_id'))
      if (fk) await queryRunner.dropForeignKey('api_keys', fk)
    }
    await queryRunner.dropIndex('api_keys', 'IDX_api_keys_ext_user')
    await queryRunner.dropIndex('api_keys', 'UQ_api_keys_token_hash')
    await queryRunner.dropTable('api_keys')
  }
}


