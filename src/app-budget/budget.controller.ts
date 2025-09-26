import { Controller, Get, Post, UseGuards, Req, Res, Logger } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { JwtAuthGuard } from '../app-auth/guards/jwt-auth.guard'
import { RateLimitGuard } from '../common/guards/rate-limit.guard'
import { BaseController } from '../app-api/base.controller'
import { BudgetService } from './budget.service'

@ApiTags('Budget')
@Controller('budget')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetController extends BaseController {
  private readonly logger = new Logger(BudgetController.name)

  constructor(private readonly budgetService: BudgetService) { super() }

  @Get('me')
  @ApiOperation({ summary: 'Get my budget & usage (hardcoded $5 cap for now, rolling 1mo)' })
  async getMe(@Req() req: Request, @Res() res: Response) {
    try {
      const currentUser = req.user as any
      const view = await this.budgetService.getMyBudget(currentUser.userId)
      return this.success(res, view)
    } catch (e: any) {
      this.logger.error(`Failed to get budget: ${e?.message || e}`)
      return this.error(res, e?.message || 'Failed to get budget')
    }
  }

  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Refresh budget (recompute from analytics tables + update budget cache)' })
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const currentUser = req.user as any
      const view = await this.budgetService.refreshMyBudget(currentUser.userId)
      return this.success(res, view)
    } catch (e: any) {
      this.logger.error(`Failed to refresh budget: ${e?.message || e}`)
      return this.error(res, e?.message || 'Failed to refresh budget')
    }
  }
}


