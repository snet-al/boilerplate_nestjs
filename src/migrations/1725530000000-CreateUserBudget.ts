import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateUserBudget1725530000000 implements MigrationInterface {
  name = 'CreateUserBudget1725530000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_budget',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },

          { name: 'user_id', type: 'int' },
          { name: 'max_budget_usd', type: 'decimal', precision: 10, scale: 2, default: 5.0 },
          { name: 'budget_period', type: 'varchar', length: '20', default: "'1mo'" },
          { name: 'soft_budget_usd', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'model_max_budget', type: 'json', isNullable: true },
          { name: 'period_anchor', type: 'timestamp', isNullable: true },
          { name: 'next_reset_at', type: 'timestamp', isNullable: true },
          { name: 'proxy_synced_at', type: 'timestamp', isNullable: true },
          { name: 'last_known_spend_usd', type: 'decimal', precision: 10, scale: 8, default: 0 },
          { name: 'last_refresh_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    )

    await queryRunner.createIndex(
      'user_budget',
      new TableIndex({ name: 'IDX_user_budget_user_id_unique', columnNames: ['user_id'], isUnique: true }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('user_budget', 'IDX_user_budget_user_id_unique')
    await queryRunner.dropTable('user_budget')
  }
}


