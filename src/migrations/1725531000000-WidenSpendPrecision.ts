import { MigrationInterface, QueryRunner } from 'typeorm'

export class WidenSpendPrecision1725531000000 implements MigrationInterface {
  name = 'WidenSpendPrecision1725531000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE analytics_request_logs MODIFY spend DECIMAL(20,8)`)
    await queryRunner.query(`ALTER TABLE analytics_user_summaries MODIFY total_spend DECIMAL(20,8)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE analytics_request_logs MODIFY spend DECIMAL(10,8)`)
    await queryRunner.query(`ALTER TABLE analytics_user_summaries MODIFY total_spend DECIMAL(10,8)`)
  }
}


