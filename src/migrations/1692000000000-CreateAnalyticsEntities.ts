import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateAnalyticsEntities1692000000000 implements MigrationInterface {
  name = 'CreateAnalyticsEntities1692000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create analytics_request_logs table
    await queryRunner.createTable(
      new Table({
        name: 'analytics_request_logs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'request_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'call_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'api_key_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'spend',
            type: 'decimal',
            precision: 10,
            scale: 8,
          },
          {
            name: 'total_tokens',
            type: 'int',
          },
          {
            name: 'prompt_tokens',
            type: 'int',
          },
          {
            name: 'completion_tokens',
            type: 'int',
          },
          {
            name: 'start_time',
            type: 'timestamp',
          },
          {
            name: 'end_time',
            type: 'timestamp',
          },
          {
            name: 'completion_start_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'model',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'model_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'model_group',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'custom_llm_provider',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'api_base',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'external_user_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'requester_ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'cache_hit',
            type: 'varchar',
            length: '50',
            default: "'None'",
          },
          {
            name: 'cache_key',
            type: 'varchar',
            length: '255',
            default: "'Cache OFF'",
          },
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'success'",
          },
          {
            name: 'reasoning_tokens',
            type: 'int',
            default: 0,
          },
          {
            name: 'cached_tokens',
            type: 'int',
            default: 0,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true
    )

    // Create analytics_user_summaries table
    await queryRunner.createTable(
      new Table({
        name: 'analytics_user_summaries',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'external_user_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'model',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'model_group',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'custom_llm_provider',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'total_spend',
            type: 'decimal',
            precision: 10,
            scale: 8,
            default: 0,
          },
          {
            name: 'total_tokens',
            type: 'int',
            default: 0,
          },
          {
            name: 'prompt_tokens',
            type: 'int',
            default: 0,
          },
          {
            name: 'completion_tokens',
            type: 'int',
            default: 0,
          },
          {
            name: 'successful_requests',
            type: 'int',
            default: 0,
          },
          {
            name: 'failed_requests',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_requests',
            type: 'int',
            default: 0,
          },
          {
            name: 'cache_read_input_tokens',
            type: 'int',
            default: 0,
          },
          {
            name: 'cache_creation_input_tokens',
            type: 'int',
            default: 0,
          },
          {
            name: 'reasoning_tokens',
            type: 'int',
            default: 0,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true
    )

    // Create indexes for analytics_request_logs
    await queryRunner.createIndex('analytics_request_logs', new TableIndex({
      name: 'IDX_analytics_request_logs_user_model_time',
      columnNames: ['user_id', 'model', 'start_time']
    }))
    
    await queryRunner.createIndex('analytics_request_logs', new TableIndex({
      name: 'IDX_analytics_request_logs_request_id',
      columnNames: ['request_id'],
      isUnique: true
    }))

    // Create indexes for analytics_user_summaries
    await queryRunner.createIndex('analytics_user_summaries', new TableIndex({
      name: 'IDX_analytics_user_summaries_user_date',
      columnNames: ['user_id', 'date']
    }))
    
    await queryRunner.createIndex('analytics_user_summaries', new TableIndex({
      name: 'IDX_analytics_user_summaries_date_model',
      columnNames: ['date', 'model']
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables (indexes are automatically dropped with tables)
    await queryRunner.dropTable('analytics_user_summaries')
    await queryRunner.dropTable('analytics_request_logs')
  }
}