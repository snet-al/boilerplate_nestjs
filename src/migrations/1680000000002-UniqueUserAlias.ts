import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm'

export class UniqueUserAlias1680000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unique index on (external_user_id, key_alias)
    // Clean duplicates by appending suffix
    const dupes: Array<{ external_user_id: string; key_alias: string; count: number }> = (await queryRunner.query(`
      SELECT external_user_id, key_alias, COUNT(*) as count
      FROM api_keys
      WHERE key_alias IS NOT NULL AND external_user_id IS NOT NULL
      GROUP BY external_user_id, key_alias
      HAVING COUNT(*) > 1
    `))
    for (const d of dupes) {
      const rows: Array<{ id: number }> = await queryRunner.query(
        `SELECT id FROM api_keys WHERE external_user_id = ? AND key_alias = ? ORDER BY id ASC`,
        [d.external_user_id, d.key_alias],
      )
      let suffix = 1
      for (let i = 1; i < rows.length; i++) {
        await queryRunner.query(
          `UPDATE api_keys SET key_alias = ? WHERE id = ?`,
          [`${d.key_alias}-${suffix++}`, rows[i].id],
        )
      }
    }
    await queryRunner.createIndex('api_keys', new TableIndex({ name: 'UQ_api_keys_user_alias', columnNames: ['external_user_id', 'key_alias'], isUnique: true }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('api_keys', 'UQ_api_keys_user_alias')
  }
}


