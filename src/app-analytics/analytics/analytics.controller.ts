import { Controller, Get, Post, Query, Body, UseGuards, Param, ParseIntPipe, Res, Req, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response, Request } from 'express'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../app-auth/guards/jwt-auth.guard'
import { RateLimitGuard } from '../../common/guards/rate-limit.guard'
import { AnalyticsService } from './analytics.service'
import { AnalyticsFilterDto } from './dto/analytics-filter.dto'
import { SyncAnalyticsDto } from './dto/sync-analytics.dto'
import { UserSpendingResponseDto } from './dto/user-spending-response.dto'
import { BaseController } from '../../app-api/base.controller'

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController extends BaseController {
  private readonly logger = new Logger(AnalyticsController.name)

  constructor(private readonly analyticsService: AnalyticsService) {
    super()
  }

  @Post('sync/spend-logs')
  @ApiOperation({ summary: 'Sync spend logs from LiteLLM for current user' })
  @ApiResponse({ status: 200, description: 'Spend logs synced successfully' })
  async syncSpendLogs(@Body() syncDto: SyncAnalyticsDto, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    await this.analyticsService.fetchAndSyncSpendLogs(syncDto.startDate, syncDto.endDate, currentUser.userId)
    return this.success(res, { message: 'Spend logs synced successfully' })
  }

  @Post('sync/user-analytics')
  @ApiOperation({ summary: 'Sync user analytics from LiteLLM for current user' })
  @ApiResponse({ status: 200, description: 'User analytics synced successfully' })
  async syncUserAnalytics(@Body() syncDto: SyncAnalyticsDto, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    await this.analyticsService.fetchAndSyncUserAnalytics(syncDto.startDate, syncDto.endDate, currentUser.userId)
    return this.success(res, { message: 'User analytics synced successfully' })
  }

  @Post('sync/all')
  @ApiOperation({ summary: 'Sync all analytics data from LiteLLM for current user' })
  @ApiResponse({ status: 200, description: 'All analytics data synced successfully' })
  async syncAllAnalytics(@Body() syncDto: SyncAnalyticsDto, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    await Promise.all([
      this.analyticsService.fetchAndSyncSpendLogs(syncDto.startDate, syncDto.endDate, currentUser.userId),
      this.analyticsService.fetchAndSyncUserAnalytics(syncDto.startDate, syncDto.endDate, currentUser.userId)
    ])
    return this.success(res, { message: 'All analytics data synced successfully' })
  }

  @Post('sync/refresh')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Unified refresh endpoint to sync all necessary analytics data for current user (Rate limited: 6 requests per minute)' })
  @ApiResponse({ status: 200, description: 'Analytics data refreshed successfully' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded - too many refresh requests' })
  async refreshAnalytics(@Body() syncDto: SyncAnalyticsDto, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    
    try {
      // Run all sync operations in parallel for better performance
      await Promise.all([
        this.analyticsService.fetchAndSyncSpendLogs(syncDto.startDate, syncDto.endDate, currentUser.userId),
        this.analyticsService.fetchAndSyncUserAnalytics(syncDto.startDate, syncDto.endDate, currentUser.userId)
      ])

      // Get updated counts after sync
      const counts = await this.analyticsService.getDebugCounts(currentUser.userId)
      
      return this.success(res, { 
        message: 'Analytics data refreshed successfully',
        counts,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      this.logger.error('Failed to refresh analytics data:', error)
      throw new HttpException(
        `Failed to refresh analytics data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('request-logs')
  @ApiOperation({ summary: 'Get filtered request logs for current user' })
  @ApiResponse({ status: 200, description: 'Request logs retrieved successfully' })
  async getRequestLogs(@Query() filter: AnalyticsFilterDto, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    const result = await this.analyticsService.getFilteredRequestLogs(filter, currentUser?.userId)
    return res.status(200).json({
      status: 'success',
      data: result.data,
      meta: result.meta,
    })
  }

  @Get('user-summaries')
  @ApiOperation({ summary: 'Get user analytics summaries for current user' })
  @ApiResponse({ status: 200, description: 'User summaries retrieved successfully' })
  async getUserSummaries(@Query() filter: AnalyticsFilterDto, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    const result = await this.analyticsService.getUserSummaries(filter, currentUser.userId)
    return this.success(res, [result.data, result.meta.total])
  }

  @Get('user/:userId/spending')
  @ApiOperation({ summary: 'Get total spending by user ID (only current user or admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'User spending retrieved successfully',
    type: [UserSpendingResponseDto]
  })
  async getUserSpendingById(@Param('userId', ParseIntPipe) userId: number, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    // Only allow users to access their own spending data
    if (currentUser.userId !== userId) {
      throw new HttpException('Forbidden: You can only access your own spending data', HttpStatus.FORBIDDEN)
    }
    const spending = await this.analyticsService.getUserTotalSpending(userId)
    return this.success(res, spending)
  }

  @Get('external-user/:externalUserId/spending')
  @ApiOperation({ summary: 'Get total spending by external user ID (only current user data)' })
  @ApiResponse({ 
    status: 200, 
    description: 'External user spending retrieved successfully',
    type: [UserSpendingResponseDto]
  })
  async getUserSpendingByExternalId(@Param('externalUserId') externalUserId: string, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    // Only allow users to access their own external user data
    if (currentUser.externalUserId !== externalUserId) {
      throw new HttpException('Forbidden: You can only access your own spending data', HttpStatus.FORBIDDEN)
    }
    const spending = await this.analyticsService.getUserTotalSpending(undefined, externalUserId)
    return this.success(res, spending)
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available models from current user analytics data' })
  @ApiResponse({ status: 200, description: 'Available models retrieved successfully' })
  @ApiQuery({ name: 'model', required: false, type: String, description: 'Filter by model name' })
  @ApiQuery({ name: 'provider', required: false, type: String, description: 'Filter by provider' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter by end date' })
  async getAvailableModels(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    const filter = {
      model: query.model,
      provider: query.provider,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate
    }
    const models = await this.analyticsService.getAvailableModels(currentUser.userId, filter)
    
    // Return array directly to avoid BaseController transformation
    return res.json({
      status: 'success',
      data: models,
      meta: { total: models.length }
    })
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get available providers from current user analytics data' })
  @ApiResponse({ status: 200, description: 'Available providers retrieved successfully' })
  @ApiQuery({ name: 'model', required: false, type: String, description: 'Filter by model name' })
  @ApiQuery({ name: 'provider', required: false, type: String, description: 'Filter by provider' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter by end date' })
  async getAvailableProviders(@Query() query: any, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    const filter = {
      model: query.model,
      provider: query.provider,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate
    }
    const providers = await this.analyticsService.getAvailableProviders(currentUser.userId, filter)
    
    // Return array directly to avoid BaseController transformation
    return res.json({
      status: 'success',
      data: providers,
      meta: { total: providers.length }
    })
  }

  @Get('debug/count')
  @ApiOperation({ summary: 'Get count of records in analytics tables for current user' })
  @ApiResponse({ status: 200, description: 'Record counts retrieved successfully' })
  async getDebugCounts(@Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    const counts = await this.analyticsService.getDebugCounts(currentUser.userId)
    return this.success(res, counts)
  }

  @Get('debug/user-mapping')
  @ApiOperation({ summary: 'Debug user mapping and log data for current user' })
  @ApiResponse({ status: 200, description: 'User mapping debug info retrieved successfully' })
  async debugUserMapping(@Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    const result = await this.analyticsService.debugUserMapping(currentUser.userId)
    return this.success(res, result)
  }

  @Post('sync/request-logs-alternative')
  @ApiOperation({ summary: 'Alternative method to fetch individual request logs from LiteLLM for current user' })
  @ApiResponse({ status: 200, description: 'Alternative request logs sync attempted' })
  async syncRequestLogsAlternative(@Body() syncDto: SyncAnalyticsDto, @Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    await this.analyticsService.fetchAndSyncRequestLogsAlternative(syncDto.startDate, syncDto.endDate, currentUser.userId)
    return this.success(res, { message: 'Alternative request logs sync completed' })
  }

  @Post('debug/create-test-logs')
  @ApiOperation({ summary: 'Create test request logs for current user for debugging' })
  @ApiResponse({ status: 200, description: 'Test logs created successfully' })
  async createTestLogs(@Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    await this.analyticsService.createTestRequestLogs(currentUser.userId)
    return this.success(res, { message: 'Test request logs created successfully' })
  }

  @Post('debug/cleanup-incorrect-data')
  @ApiOperation({ summary: 'Clean up incorrectly attributed analytics data for current user' })
  @ApiResponse({ status: 200, description: 'Incorrect data cleaned up successfully' })
  async cleanupIncorrectData(@Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    const result = await this.analyticsService.cleanupIncorrectlyAttributedData(currentUser.userId)
    return this.success(res, result)
  }

  @Post('debug/generate-summaries')
  @ApiOperation({ summary: 'Generate user summaries from existing request logs for current user' })
  @ApiResponse({ status: 200, description: 'User summaries generated successfully' })
  async generateSummariesFromLogs(@Req() req: Request, @Res() res: Response) {
    const currentUser = req.user as any
    await this.analyticsService.generateUserSummariesFromRequestLogs(currentUser.userId)
    return this.success(res, { message: 'User summaries generated successfully from request logs' })
  }

  @Get('litellm/models')
  @ApiOperation({ summary: 'Get comprehensive model information from LiteLLM with pricing and metadata' })
  @ApiResponse({ status: 200, description: 'LiteLLM models retrieved successfully' })
  @ApiQuery({ name: 'include_metadata', required: false, type: Boolean, description: 'Include pricing and metadata' })
  @ApiQuery({ name: 'fallback_type', required: false, type: String, description: 'Type of fallbacks (general, context_window, content_policy)' })
  async getLiteLLMModels(
    @Query('include_metadata') includeMetadata: boolean = true,
    @Query('fallback_type') fallbackType: string = 'general',
    @Res() res: Response
  ) {
    const models = await this.analyticsService.getLiteLLMModels(includeMetadata, fallbackType)
    return this.success(res, models)
  }

  @Get('litellm/model/:modelName/info')
  @ApiOperation({ summary: 'Get detailed information for a specific model from LiteLLM' })
  @ApiResponse({ status: 200, description: 'Model information retrieved successfully' })
  async getLiteLLMModelInfo(@Param('modelName') modelName: string, @Res() res: Response) {
    const modelInfo = await this.analyticsService.getLiteLLMModelInfo(modelName)
    return this.success(res, modelInfo)
  }
}