import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddExternalUserFields1673456789123 implements MigrationInterface {
  name = 'AddExternalUserFields1673456789123'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'external_user_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'external_api_key',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'external_provider',
        type: 'varchar',
        default: "'litellm'",
        isNullable: true,
      }),
      new TableColumn({
        name: 'external_metadata',
        type: 'json',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', [
      'external_user_id',
      'external_api_key',
      'external_provider',
      'external_metadata',
    ])
  }
}