import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { AnalyticsRequestLog } from '../../entities/analytics_request_log.entity'
import { AnalyticsUserSummary } from '../../entities/analytics_user_summary.entity'
import { User } from '../../entities/user.entity'
import { AnalyticsFilterDto } from './dto/analytics-filter.dto'

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)
  private readonly litellmBaseUrl: string
  private readonly litellmApiKey: string

  constructor(
    @InjectRepository(AnalyticsRequestLog)
    private requestLogRepository: Repository<AnalyticsRequestLog>,
    @InjectRepository(AnalyticsUserSummary)
    private userSummaryRepository: Repository<AnalyticsUserSummary>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.litellmBaseUrl = this.configService.get<string>('LITELLM_BASE_URL') || 'http://localhost:4000'
    this.litellmApiKey = this.configService.get<string>('LITELLM_API_KEY') || 'sk-1234'
  }

  async fetchAndSyncSpendLogs(startDate?: string, endDate?: string, currentUserId?: number): Promise<void> {
    try {
      this.logger.log('Fetching spend logs from LiteLLM...')
      this.logger.log(`LiteLLM URL: ${this.litellmBaseUrl}`)
      this.logger.log(`LiteLLM API Key: ${this.litellmApiKey ? 'SET' : 'NOT SET'}`)
      
      // Resolve external user id for scoped fetching
      let externalUserId: string | undefined
      if (currentUserId) {
        const u = await this.userRepository.findOne({ where: { id: currentUserId } })
        externalUserId = u?.externalUserId || undefined
      }

      // Try to get detailed logs first (explicitly disable summarize)
      let url = `${this.litellmBaseUrl}/spend/logs?summarize=false`
      if (externalUserId) url += `&user_id=${encodeURIComponent(externalUserId)}`
      if (startDate) url += `&start_date=${startDate}`
      if (endDate) url += `&end_date=${endDate}`

      this.logger.log(`Requesting detailed logs URL: ${url}`)

      try {
        const response = await firstValueFrom(
          this.httpService.get(url, {
            headers: {
              'accept': 'application/json',
              'x-litellm-api-key': this.litellmApiKey,
            },
          })
        )

        await this.processSpendLogsResponse(response.data, 'detailed', currentUserId)
      } catch (detailedError) {
        this.logger.warn(`Failed to fetch detailed logs: ${detailedError.message}`)
        
        // Fallback to summarized logs
        let summaryUrl = `${this.litellmBaseUrl}/spend/logs?summarize=true`
        if (externalUserId) summaryUrl += `&user_id=${encodeURIComponent(externalUserId)}`
        if (startDate) summaryUrl += `&start_date=${startDate}`
        if (endDate) summaryUrl += `&end_date=${endDate}`

        this.logger.log(`Falling back to summary URL: ${summaryUrl}`)

        const summaryResponse = await firstValueFrom(
          this.httpService.get(summaryUrl, {
            headers: {
              'accept': 'application/json',
              'x-litellm-api-key': this.litellmApiKey,
            },
          })
        )

        await this.processSpendLogsResponse(summaryResponse.data, 'summary', currentUserId)
      }
    } catch (error) {
      this.logger.error('Failed to fetch and sync spend logs:', error)
      this.logger.error(`Error message: ${error.message}`)
      this.logger.error(`Error stack: ${error.stack}`)
      throw new HttpException(
        `Failed to sync analytics data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  private async processSpendLogsResponse(data: any, type: 'detailed' | 'summary', currentUserId?: number): Promise<void> {
    this.logger.log(`Response data type: ${typeof data}`)
    this.logger.log(`Response data (${type}): ${JSON.stringify(data, null, 2)}`)

    const spendLogs = data
    if (!Array.isArray(spendLogs)) {
      this.logger.warn(`Spend logs response is not an array. Type: ${typeof spendLogs}`)
      this.logger.warn(`Response data: ${JSON.stringify(spendLogs, null, 2)}`)
      return
    }

    this.logger.log(`Processing ${spendLogs.length} ${type} log entries...`)

    let savedCount = 0
    let skippedCount = 0

    for (const log of spendLogs) {
      // Check if this is individual request log (has request_id) or daily summary
      if (log.request_id) {
        const result = await this.saveRequestLog(log, currentUserId)
        if (result) savedCount++
        else skippedCount++
      } else if (log.startTime && typeof log.startTime === 'string' && log.startTime.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // This is daily summary data, process as user summary
        const result = await this.saveDailySummary(log, currentUserId)
        if (result) savedCount++
        else skippedCount++
      } else {
        this.logger.warn(`Skipping unknown log format: ${JSON.stringify(log, null, 2)}`)
        skippedCount++
      }
    }

    this.logger.log(`${type} logs sync completed successfully. Saved: ${savedCount}, Skipped: ${skippedCount}`)
  }

  async fetchAndSyncUserAnalytics(startDate?: string, endDate?: string, currentUserId?: number): Promise<void> {
    try {
      this.logger.log('Fetching user analytics from LiteLLM...')
      
      // Default to last 30 days if no dates provided
      const defaultEndDate = new Date()
      const defaultStartDate = new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const finalStartDate = startDate || defaultStartDate.toISOString().split('T')[0]
      const finalEndDate = endDate || defaultEndDate.toISOString().split('T')[0]
      
      let url = `${this.litellmBaseUrl}/user/daily/activity`
      const params = new URLSearchParams()
      params.append('start_date', finalStartDate)
      params.append('end_date', finalEndDate)
      
      url += `?${params.toString()}`
      
      this.logger.log(`Fetching user analytics from ${finalStartDate} to ${finalEndDate}`)
      this.logger.log(`Request URL: ${url}`)

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'accept': 'application/json',
            'x-litellm-api-key': this.litellmApiKey,
          },
        })
      )

      const userAnalytics = response.data
      if (!userAnalytics?.results || !Array.isArray(userAnalytics.results)) {
        this.logger.warn('User analytics response is not properly formatted')
        return
      }

      this.logger.log(`Processing ${userAnalytics.results.length} user analytics entries...`)

      for (const dayData of userAnalytics.results) {
        await this.processDayAnalytics(dayData, currentUserId)
      }

      this.logger.log('User analytics sync completed successfully')
    } catch (error) {
      this.logger.error('Failed to fetch and sync user analytics:', error.message)
      this.logger.error(`Error details: ${JSON.stringify(error.response?.data || error, null, 2)}`)
      this.logger.error(`LiteLLM URL: ${this.litellmBaseUrl}`)
      this.logger.error(`LiteLLM API Key: ${this.litellmApiKey ? 'SET' : 'NOT SET'}`)
      
      let errorMessage = 'Failed to sync user analytics data'
      if (error.response?.status === 401) {
        errorMessage = 'LiteLLM authentication failed - check LITELLM_API_KEY'
      } else if (error.response?.status === 404) {
        errorMessage = 'LiteLLM /user/daily/activity endpoint not found'
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to LiteLLM service - check LITELLM_BASE_URL'
      }
      
      throw new HttpException(
        errorMessage,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  private async saveRequestLog(logData: any, currentUserId?: number): Promise<boolean> {
    try {
      this.logger.debug(`Processing log entry: ${JSON.stringify(logData, null, 2)}`)
      
      if (!logData.request_id) {
        this.logger.warn(`Skipping log entry without request_id: ${JSON.stringify(logData, null, 2)}`)
        return false
      }

      // Check if log already exists
      const existing = await this.requestLogRepository.findOne({
        where: { requestId: logData.request_id }
      })
      
      if (existing) {
        this.logger.debug(`Log with request_id ${logData.request_id} already exists, skipping`)
        return false // Skip if already exists
      }

      // Find user by external_user_id if provided, or use current user
      let user: User | null = null
      if (logData.user) {
        user = await this.userRepository.findOne({
          where: { externalUserId: logData.user }
        })
        this.logger.debug(`Found user for external_user_id ${logData.user}: ${user ? user.id : 'none'}`)
      }
      
      // If currentUserId is provided, ONLY save logs that belong to current user
      // BUT also save logs where no external user is found to debug the issue
      if (currentUserId) {
        if (!user) {
          this.logger.warn(`No user found for external_user_id: ${logData.user} - saving anyway for debugging`)
          // Don't return false here - save the log for debugging
        } else if (user.id !== currentUserId) {
          this.logger.debug(`Skipping log entry not belonging to current user ${currentUserId}`)
          return false
        }
      }

      const requestLog = this.requestLogRepository.create({
        requestId: logData.request_id,
        callType: logData.call_type || 'unknown',
        apiKeyHash: this.hashApiKey(logData.api_key || ''),
        spend: parseFloat(logData.spend || '0'),
        totalTokens: parseInt(logData.total_tokens || '0'),
        promptTokens: parseInt(logData.prompt_tokens || '0'),
        completionTokens: parseInt(logData.completion_tokens || '0'),
        startTime: new Date(logData.startTime),
        endTime: new Date(logData.endTime),
        completionStartTime: logData.completionStartTime ? new Date(logData.completionStartTime) : null,
        model: logData.model || 'unknown',
        modelId: logData.model_id,
        modelGroup: logData.model_group,
        customLlmProvider: logData.custom_llm_provider || 'unknown',
        apiBase: logData.api_base,
        userId: user?.id || null,
        externalUserId: logData.user || null,
        requesterIpAddress: logData.requester_ip_address,
        cacheHit: logData.cache_hit || 'None',
        cacheKey: logData.cache_key || 'Cache OFF',
        sessionId: logData.session_id,
        status: logData.status || 'success',
        reasoningTokens: parseInt(logData.metadata?.additional_usage_values?.completion_tokens_details?.reasoning_tokens || '0'),
        cachedTokens: parseInt(logData.metadata?.additional_usage_values?.prompt_tokens_details?.cached_tokens || '0'),
        metadata: logData.metadata || null,
      })

      this.logger.debug(`Saving request log: ${JSON.stringify({
        requestId: requestLog.requestId,
        model: requestLog.model,
        spend: requestLog.spend,
        totalTokens: requestLog.totalTokens
      })}`)

      const savedLog = await this.requestLogRepository.save(requestLog)
      this.logger.debug(`Successfully saved log with ID: ${savedLog.id}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to save request log ${logData.request_id}:`, error.message)
      this.logger.error(`Error stack: ${error.stack}`)
      this.logger.error(`Log data: ${JSON.stringify(logData, null, 2)}`)
      return false
    }
  }

  private async saveDailySummary(dailyData: any, currentUserId?: number): Promise<boolean> {
    try {
      this.logger.debug(`Processing daily summary: ${JSON.stringify(dailyData, null, 2)}`)
      
      const date = dailyData.startTime // This is the date in YYYY-MM-DD format
      const totalSpend = parseFloat(dailyData.spend || '0')
      
      let savedCount = 0

      // Save overall daily summary for current user only
      if (currentUserId) {
        await this.saveSingleSummary(date, currentUserId, null, null, totalSpend, 0, 0, 0, 0, 0)
        savedCount++
      }

      // Process users data - only save if it matches current user
      if (dailyData.users && typeof dailyData.users === 'object' && currentUserId) {
        const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } })
        if (currentUser && currentUser.externalUserId) {
          const userSpend = dailyData.users[currentUser.externalUserId]
          if (userSpend && parseFloat(String(userSpend)) > 0) {
            await this.saveSingleSummary(date, currentUserId, currentUser.externalUserId, null, parseFloat(String(userSpend)), 0, 0, 0, 0, 0)
            savedCount++
            this.logger.debug(`Saved user summary for ${currentUser.externalUserId}: ${userSpend}`)
          }
        }
      }

      // Process models data - save for current user
      if (dailyData.models && typeof dailyData.models === 'object' && currentUserId) {
        for (const [model, modelSpend] of Object.entries(dailyData.models)) {
          if (model && model !== '' && parseFloat(String(modelSpend)) > 0) {
            await this.saveSingleSummary(date, currentUserId, null, model, parseFloat(String(modelSpend)), 0, 0, 0, 0, 0)
            savedCount++
            this.logger.debug(`Saved model summary for ${model}: ${modelSpend}`)
          }
        }
      }

      this.logger.debug(`Saved ${savedCount} summary records for ${date}`)
      return savedCount > 0
    } catch (error) {
      this.logger.error(`Failed to save daily summary:`, error.message)
      return false
    }
  }

  private async saveSingleSummary(
    date: string,
    userId: number | null,
    externalUserId: string | null,
    model: string | null,
    spend: number,
    totalTokens: number,
    promptTokens: number,
    completionTokens: number,
    successfulRequests: number,
    failedRequests: number
  ): Promise<void> {
    let summary = await this.userSummaryRepository.findOne({
      where: {
        date,
        userId,
        externalUserId,
        model,
      }
    })

    if (!summary) {
      summary = new AnalyticsUserSummary()
      summary.date = date
      summary.userId = userId
      summary.externalUserId = externalUserId
      summary.model = model
      summary.modelGroup = null
      summary.customLlmProvider = null
      summary.totalSpend = 0
      summary.totalTokens = 0
      summary.promptTokens = 0
      summary.completionTokens = 0
      summary.successfulRequests = 0
      summary.failedRequests = 0
      summary.totalRequests = 0
      summary.cacheReadInputTokens = 0
      summary.cacheCreationInputTokens = 0
      summary.reasoningTokens = 0
    }

    // Update metrics (accumulate if summary already exists)
    summary.totalSpend = Math.max(summary.totalSpend, spend) // Use max to avoid duplicates
    summary.totalTokens += totalTokens
    summary.promptTokens += promptTokens
    summary.completionTokens += completionTokens
    summary.successfulRequests += successfulRequests
    summary.failedRequests += failedRequests
    summary.totalRequests = summary.successfulRequests + summary.failedRequests

    await this.userSummaryRepository.save(summary)
  }

  private async processDayAnalytics(dayData: any, currentUserId?: number): Promise<void> {
    const date = dayData.date
    const breakdown = dayData.breakdown

    // Process model breakdown for current user only
    if (breakdown?.models && currentUserId) {
      for (const [model, modelData] of Object.entries(breakdown.models)) {
        if (modelData && typeof modelData === 'object' && 'metrics' in modelData) {
          await this.saveUserSummary(date, model, modelData, null, currentUserId)
        }
      }
    }

    // Process entities (users) breakdown for current user only
    if (breakdown?.entities && currentUserId) {
      const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } })
      if (currentUser && currentUser.externalUserId) {
        const entityData = breakdown.entities[currentUser.externalUserId]
        if (entityData && typeof entityData === 'object' && 'metrics' in entityData) {
          await this.saveUserSummary(date, null, entityData, currentUser.externalUserId, currentUserId)
        }
      }
    }
  }

  private async saveUserSummary(date: string, model: string | null, data: any, externalUserId: string | null, currentUserId?: number): Promise<void> {
    try {
      const metrics = data.metrics
      if (!metrics) return

      // Find user by external_user_id
      let user: User | null = null
      if (externalUserId && externalUserId !== 'Unassigned') {
        user = await this.userRepository.findOne({
          where: { externalUserId }
        })
      }
      
      // If currentUserId is provided, ONLY save summaries that belong to current user
      if (currentUserId) {
        if (!user) {
          this.logger.debug(`Skipping user summary - no user found for external_user_id: ${externalUserId}`)
          return
        }
        if (user.id !== currentUserId) {
          this.logger.debug(`Skipping user summary not belonging to current user ${currentUserId}`)
          return
        }
      }

      // Check if summary already exists
      const whereConditions: any = {
        date,
        userId: user?.id || null,
        externalUserId: externalUserId || null,
        model: model || null,
      }

      let summary = await this.userSummaryRepository.findOne({
        where: whereConditions
      })

      if (!summary) {
        summary = new AnalyticsUserSummary()
        summary.date = whereConditions.date
        summary.userId = whereConditions.userId
        summary.externalUserId = whereConditions.externalUserId
        summary.model = whereConditions.model
        summary.modelGroup = null
        summary.customLlmProvider = null
        summary.totalSpend = 0
        summary.totalTokens = 0
        summary.promptTokens = 0
        summary.completionTokens = 0
        summary.successfulRequests = 0
        summary.failedRequests = 0
        summary.totalRequests = 0
        summary.cacheReadInputTokens = 0
        summary.cacheCreationInputTokens = 0
        summary.reasoningTokens = 0
      }

      // Update metrics
      summary.totalSpend = parseFloat(metrics.spend || '0')
      summary.totalTokens = parseInt(metrics.total_tokens || '0')
      summary.promptTokens = parseInt(metrics.prompt_tokens || '0')
      summary.completionTokens = parseInt(metrics.completion_tokens || '0')
      summary.successfulRequests = parseInt(metrics.successful_requests || '0')
      summary.failedRequests = parseInt(metrics.failed_requests || '0')
      summary.totalRequests = parseInt(metrics.api_requests || '0')
      summary.cacheReadInputTokens = parseInt(metrics.cache_read_input_tokens || '0')
      summary.cacheCreationInputTokens = parseInt(metrics.cache_creation_input_tokens || '0')

      await this.userSummaryRepository.save(summary)
    } catch (error) {
      this.logger.error('Failed to save user summary:', error.message)
    }
  }

  async getFilteredRequestLogs(filter: AnalyticsFilterDto, currentUserId?: number) {
    try {
      this.logger.debug(`Getting filtered request logs for user ${currentUserId} with filters: ${JSON.stringify(filter)}`)
      
      // First, let's check what data exists
      const totalLogsCount = await this.requestLogRepository.count()
      this.logger.debug(`Total logs in database: ${totalLogsCount}`)
      
      if (currentUserId) {
        const userLogsCount = await this.requestLogRepository.count({ where: { userId: currentUserId } })
        this.logger.debug(`Logs for user ${currentUserId}: ${userLogsCount}`)
        
        // Check what external user ID this user has
        const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } })
        this.logger.debug(`Current user external ID: ${currentUser?.externalUserId}`)
        
        // Check if there are logs with this external user ID but no userId mapping
        const unmappedLogsCount = await this.requestLogRepository.count({ 
          where: { 
            externalUserId: currentUser?.externalUserId,
            userId: null 
          } 
        })
        this.logger.debug(`Unmapped logs with external ID ${currentUser?.externalUserId}: ${unmappedLogsCount}`)
      }
      
      const queryBuilder = this.requestLogRepository.createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user')

      // Filter by current user only
      if (currentUserId) {
        // Include logs that either belong to the current user OR are unmapped but match user's externalUserId
        const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } })
        if (currentUser?.externalUserId) {
          queryBuilder.andWhere(
            '(log.userId = :currentUserId OR (log.userId IS NULL AND log.externalUserId = :externalUserId))',
            { currentUserId, externalUserId: currentUser.externalUserId }
          )
        } else {
          queryBuilder.andWhere('log.userId = :currentUserId', { currentUserId })
        }
      }

      // Apply filters
      if (filter.userId) {
        queryBuilder.andWhere('log.userId = :userId', { userId: filter.userId })
      }

      if (filter.externalUserId) {
        queryBuilder.andWhere('log.externalUserId = :externalUserId', { externalUserId: filter.externalUserId })
      }

      if (filter.model) {
        queryBuilder.andWhere('log.model = :model', { model: filter.model })
      }

      if (filter.provider) {
        queryBuilder.andWhere('log.customLlmProvider = :provider', { provider: filter.provider })
      }

      if (filter.startDate && filter.endDate) {
        queryBuilder.andWhere('log.startTime BETWEEN :startDate AND :endDate', {
          startDate: filter.startDate,
          endDate: filter.endDate
        })
      } else if (filter.startDate) {
        queryBuilder.andWhere('log.startTime >= :startDate', { startDate: filter.startDate })
      } else if (filter.endDate) {
        queryBuilder.andWhere('log.startTime <= :endDate', { endDate: filter.endDate })
      }

      if (filter.status) {
        queryBuilder.andWhere('log.status = :status', { status: filter.status })
      }

      // Apply pagination
      if (filter.page && filter.limit) {
        const skip = (filter.page - 1) * filter.limit
        queryBuilder.skip(skip).take(filter.limit)
      }

      // Apply sorting
      queryBuilder.orderBy('log.startTime', 'DESC')

      const [logs, total] = await queryBuilder.getManyAndCount()
      this.logger.debug(`Found ${total} request logs for user ${currentUserId}`)
      
      return {
        data: logs.map(log => {
          try {
            return log.toResponse
          } catch (error) {
            this.logger.error(`Error transforming log ${log.id} to response:`, error)
            return {
              id: log.id,
              requestId: log.requestId,
              error: 'Failed to transform log data'
            }
          }
        }),
        meta: {
          total,
          page: filter.page || 1,
          limit: filter.limit || total,
          totalPages: filter.limit ? Math.ceil(total / filter.limit) : 1
        }
      }
    } catch (error) {
      this.logger.error('Error getting filtered request logs:', error)
      throw new HttpException(
        `Failed to retrieve request logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getUserSummaries(filter: AnalyticsFilterDto, currentUserId?: number) {
    try {
      this.logger.debug(`Getting user summaries for user ${currentUserId} with filters: ${JSON.stringify(filter)}`)
      
      const queryBuilder = this.userSummaryRepository.createQueryBuilder('summary')
        .leftJoinAndSelect('summary.user', 'user')

      // Filter by current user only
      if (currentUserId) {
        queryBuilder.andWhere('summary.userId = :currentUserId', { currentUserId })
      }

      // Apply filters similar to request logs
      if (filter.userId) {
        queryBuilder.andWhere('summary.userId = :userId', { userId: filter.userId })
      }

      if (filter.externalUserId) {
        queryBuilder.andWhere('summary.externalUserId = :externalUserId', { externalUserId: filter.externalUserId })
      }

      if (filter.model) {
        queryBuilder.andWhere('summary.model = :model', { model: filter.model })
      }

      if (filter.provider) {
        queryBuilder.andWhere('summary.customLlmProvider = :provider', { provider: filter.provider })
      }

      if (filter.startDate && filter.endDate) {
        queryBuilder.andWhere('summary.date BETWEEN :startDate AND :endDate', {
          startDate: filter.startDate,
          endDate: filter.endDate
        })
      }

      // Apply pagination
      if (filter.page && filter.limit) {
        const skip = (filter.page - 1) * filter.limit
        queryBuilder.skip(skip).take(filter.limit)
      }

      // Apply sorting
      queryBuilder.orderBy('summary.date', 'DESC')
        .addOrderBy('summary.totalSpend', 'DESC')

      const [summaries, total] = await queryBuilder.getManyAndCount()
      this.logger.debug(`Found ${total} user summaries for user ${currentUserId}`)
      
      return {
        data: summaries.map(summary => {
          try {
            return summary.toResponse
          } catch (error) {
            this.logger.error(`Error transforming summary ${summary.id} to response:`, error)
            return {
              id: summary.id,
              date: summary.date,
              error: 'Failed to transform summary data'
            }
          }
        }),
        meta: {
          total,
          page: filter.page || 1,
          limit: filter.limit || total,
          totalPages: filter.limit ? Math.ceil(total / filter.limit) : 1
        }
      }
    } catch (error) {
      this.logger.error('Error getting user summaries:', error)
      throw new HttpException(
        `Failed to retrieve user summaries: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getUserTotalSpending(userId?: number, externalUserId?: string) {
    const queryBuilder = this.userSummaryRepository.createQueryBuilder('summary')
      .select('SUM(summary.totalSpend)', 'totalSpend')
      .addSelect('SUM(summary.totalTokens)', 'totalTokens')
      .addSelect('SUM(summary.totalRequests)', 'totalRequests')
      .addSelect('summary.customLlmProvider', 'provider')
      .addSelect('summary.model', 'model')

    if (userId) {
      queryBuilder.andWhere('summary.userId = :userId', { userId })
    }

    if (externalUserId) {
      queryBuilder.andWhere('summary.externalUserId = :externalUserId', { externalUserId })
    }

    queryBuilder.groupBy('summary.customLlmProvider, summary.model')
      .orderBy('SUM(summary.totalSpend)', 'DESC')

    const results = await queryBuilder.getRawMany()
    
    return results.map(result => ({
      provider: result.provider,
      model: result.model,
      totalSpend: parseFloat(result.totalSpend || '0'),
      totalTokens: parseInt(result.totalTokens || '0'),
      totalRequests: parseInt(result.totalRequests || '0')
    }))
  }

  async getAvailableModels(currentUserId?: number, filter?: any) {
    try {
      this.logger.debug(`Getting available models for user ${currentUserId} with filter:`, filter)
      
      const queryBuilder = this.requestLogRepository
        .createQueryBuilder('log')
        .select('log.model', 'model')
        .addSelect('log.modelGroup', 'modelGroup')
        .addSelect('COUNT(*)', 'requestCount')
        .addSelect('SUM(log.spend)', 'totalSpend')
        .where('log.model IS NOT NULL')

      // Filter by current user only
      if (currentUserId) {
        queryBuilder.andWhere('log.userId = :currentUserId', { currentUserId })
      }

      // Apply additional filters - EXACT MATCHING
      if (filter?.model) {
        queryBuilder.andWhere('log.model = :model', { model: filter.model })
      }
      if (filter?.provider) {
        queryBuilder.andWhere('log.customLlmProvider = :provider', { provider: filter.provider })
      }
      if (filter?.status) {
        queryBuilder.andWhere('log.status = :status', { status: filter.status })
      }
      if (filter?.startDate) {
        queryBuilder.andWhere('log.startTime >= :startDate', { startDate: filter.startDate })
      }
      if (filter?.endDate) {
        queryBuilder.andWhere('log.endTime <= :endDate', { endDate: filter.endDate })
      }

      const models = await queryBuilder
        .groupBy('log.model, log.modelGroup')
        .orderBy('COUNT(*)', 'DESC')
        .getRawMany()

      this.logger.debug(`Found ${models.length} available models for user ${currentUserId}`)

      return models.map(model => ({
        model: model.model,
        modelGroup: model.modelGroup,
        requestCount: parseInt(model.requestCount || '0'),
        totalSpend: parseFloat(model.totalSpend || '0')
      }))
    } catch (error) {
      this.logger.error('Error getting available models:', error)
      // Return empty array instead of throwing error for graceful degradation
      return []
    }
  }

  async getAvailableProviders(currentUserId?: number, filter?: any) {
    try {
      this.logger.debug(`Getting available providers for user ${currentUserId} with filter:`, filter)
      
      const queryBuilder = this.requestLogRepository
        .createQueryBuilder('log')
        .select('log.customLlmProvider', 'provider')
        .addSelect('COUNT(*)', 'requestCount')
        .addSelect('SUM(log.spend)', 'totalSpend')
        .where('log.customLlmProvider IS NOT NULL')

      // Filter by current user only
      if (currentUserId) {
        queryBuilder.andWhere('log.userId = :currentUserId', { currentUserId })
      }

      // Apply additional filters - EXACT MATCHING
      if (filter?.model) {
        queryBuilder.andWhere('log.model = :model', { model: filter.model })
      }
      if (filter?.provider) {
        queryBuilder.andWhere('log.customLlmProvider = :provider', { provider: filter.provider })
      }
      if (filter?.status) {
        queryBuilder.andWhere('log.status = :status', { status: filter.status })
      }
      if (filter?.startDate) {
        queryBuilder.andWhere('log.startTime >= :startDate', { startDate: filter.startDate })
      }
      if (filter?.endDate) {
        queryBuilder.andWhere('log.endTime <= :endDate', { endDate: filter.endDate })
      }

      const providers = await queryBuilder
        .groupBy('log.customLlmProvider')
        .orderBy('COUNT(*)', 'DESC')
        .getRawMany()

      this.logger.debug(`Found ${providers.length} available providers for user ${currentUserId}`)

      return providers.map(provider => ({
        provider: provider.provider,
        requestCount: parseInt(provider.requestCount || '0'),
        totalSpend: parseFloat(provider.totalSpend || '0')
      }))
    } catch (error) {
      this.logger.error('Error getting available providers:', error)
      // Return empty array instead of throwing error for graceful degradation
      return []
    }
  }

  async fetchAndSyncRequestLogsAlternative(startDate?: string, endDate?: string, currentUserId?: number): Promise<void> {
    // First, let's discover what endpoints are available
    try {
      this.logger.log('Discovering LiteLLM API endpoints...')
      
      // Try to get API info/health to see available endpoints
      const healthUrl = `${this.litellmBaseUrl}/health`
      const healthResponse = await firstValueFrom(
        this.httpService.get(healthUrl, {
          headers: {
            'accept': 'application/json',
            'x-litellm-api-key': this.litellmApiKey,
          },
        })
      )
      this.logger.log(`Health endpoint response: ${JSON.stringify(healthResponse.data, null, 2)}`)
    } catch (error) {
      this.logger.debug(`Health endpoint failed: ${error.message}`)
    }

    // Try different variations of spend/logs endpoint
    const endpoints = [
      '/spend/logs',  // without summarize
      '/spend/logs?summarize=false',
      '/spend/logs?detailed=true',
      '/spend/logs?format=json',
      '/spend/logs?raw=true',
      '/spend/logs?individual=true',
      '/logs',
      '/logs/spend',
      '/v1/logs',
      '/v1/spend/logs',
      '/api/spend/logs',
      '/spend/requests'
    ]

    for (const endpoint of endpoints) {
      try {
        this.logger.log(`Trying endpoint: ${this.litellmBaseUrl}${endpoint}`)
        
        let url = `${this.litellmBaseUrl}${endpoint}`
        const params = new URLSearchParams()
        
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)
        
        if (params.toString()) {
          url += endpoint.includes('?') ? `&${params.toString()}` : `?${params.toString()}`
        }

        this.logger.log(`Full URL: ${url}`)

        const response = await firstValueFrom(
          this.httpService.get(url, {
            headers: {
              'accept': 'application/json',
              'x-litellm-api-key': this.litellmApiKey,
            },
            timeout: 10000
          })
        )

        this.logger.log(`Endpoint ${endpoint} responded with status ${response.status}`)
        this.logger.log(`Response headers: ${JSON.stringify(response.headers, null, 2)}`)
        this.logger.log(`Data type: ${typeof response.data}`)
        this.logger.log(`Data length: ${Array.isArray(response.data) ? response.data.length : 'not array'}`)
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          const firstItem = response.data[0]
          const lastItem = response.data[response.data.length - 1]
          
          this.logger.log(`First item keys: ${Object.keys(firstItem || {}).join(', ')}`)
          this.logger.log(`First item: ${JSON.stringify(firstItem, null, 2)}`)
          this.logger.log(`Last item: ${JSON.stringify(lastItem, null, 2)}`)
          
          // Look for any item with detailed log structure
          let foundDetailedLogs = false
          for (const item of response.data) {
            if (item.request_id || item.id || item.call_id) {
              this.logger.log(`Found item with ID field: ${JSON.stringify(item, null, 2)}`)
              foundDetailedLogs = true
              break
            }
          }
          
          if (foundDetailedLogs) {
            this.logger.log(`Found detailed request logs at ${endpoint}!`)
            await this.processRequestLogs(response.data, currentUserId)
            return
          }
        } else if (response.data && typeof response.data === 'object') {
          this.logger.log(`Non-array response: ${JSON.stringify(response.data, null, 2)}`)
        }

      } catch (error) {
        this.logger.warn(`Endpoint ${endpoint} failed: ${error.message}`)
        if (error.response) {
          this.logger.warn(`Error status: ${error.response.status}`)
          this.logger.warn(`Error data: ${JSON.stringify(error.response.data, null, 2)}`)
        }
      }
    }

    this.logger.error('No endpoint returned detailed request logs - all endpoints tried')
  }

  private async processRequestLogs(logs: any[], currentUserId?: number): Promise<void> {
    this.logger.log(`Processing ${logs.length} individual request logs...`)
    
    let savedCount = 0
    for (const log of logs) {
      if (log.request_id) {
        const result = await this.saveRequestLog(log, currentUserId)
        if (result) savedCount++
      }
    }
    
    this.logger.log(`Saved ${savedCount} individual request logs`)
  }

  async cleanupIncorrectlyAttributedData(currentUserId: number) {
    this.logger.log(`Starting cleanup of incorrectly attributed data for user ${currentUserId}`)
    
    // Get the user's actual external user ID
    const user = await this.userRepository.findOne({
      where: { id: currentUserId }
    })
    
    if (!user) {
      throw new Error(`User with ID ${currentUserId} not found`)
    }
    
    // Get dates of actual request logs for this user
    const actualRequestLogDates = await this.requestLogRepository.createQueryBuilder('log')
      .select('DISTINCT DATE(log.startTime)', 'date')
      .where('log.userId = :userId', { userId: currentUserId })
      .getRawMany()
    
    const actualDates = actualRequestLogDates.map(row => row.date)
    this.logger.log(`User ${currentUserId} has actual request logs for dates: ${actualDates.join(', ')}`)
    
    // Delete user summaries for dates where user has no actual request logs
    let deletedSummaries = 0
    if (actualDates.length > 0) {
      const deleteResult = await this.userSummaryRepository.createQueryBuilder()
        .delete()
        .where('userId = :userId', { userId: currentUserId })
        .andWhere('date NOT IN (:...actualDates)', { actualDates })
        .execute()
      
      deletedSummaries = deleteResult.affected || 0
    } else {
      // If no actual request logs, delete ALL summaries for this user
      const deleteResult = await this.userSummaryRepository.createQueryBuilder()
        .delete()
        .where('userId = :userId', { userId: currentUserId })
        .execute()
      
      deletedSummaries = deleteResult.affected || 0
    }
    
    // Delete request logs that don't have matching externalUserId
    let deletedRequestLogs = 0
    if (user.externalUserId) {
      const deleteResult = await this.requestLogRepository.createQueryBuilder()
        .delete()
        .where('userId = :userId', { userId: currentUserId })
        .andWhere('(externalUserId IS NULL OR externalUserId != :externalUserId)', { externalUserId: user.externalUserId })
        .execute()
      
      deletedRequestLogs = deleteResult.affected || 0
    }
    
    this.logger.log(`Cleanup completed: ${deletedSummaries} user summaries, ${deletedRequestLogs} request logs deleted`)
    
    return {
      message: 'Cleanup completed successfully',
      deletedSummaries,
      deletedRequestLogs,
      actualRequestLogDates: actualDates
    }
  }

  async createTestRequestLogs(currentUserId?: number): Promise<void> {
    this.logger.log(`Creating test request logs for user ${currentUserId}...`)
    
    // Get current user to use their external ID for test logs
    let testExternalUserId = 'test_user_current'
    if (currentUserId) {
      const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } })
      if (currentUser && currentUser.externalUserId) {
        testExternalUserId = currentUser.externalUserId
      }
    }
    
    const testLogs = [
      {
        request_id: 'test-req-001',
        call_type: 'acompletion',
        api_key: 'sk-test123',
        spend: 0.001,
        total_tokens: 100,
        prompt_tokens: 50,
        completion_tokens: 50,
        startTime: new Date('2025-08-19T10:00:00Z').toISOString(),
        endTime: new Date('2025-08-19T10:00:05Z').toISOString(),
        model: 'gpt-3.5-turbo',
        custom_llm_provider: 'openai',
        user: testExternalUserId,
        status: 'success'
      },
      {
        request_id: 'test-req-002',
        call_type: 'acompletion',
        api_key: 'sk-test456',
        spend: 0.002,
        total_tokens: 200,
        prompt_tokens: 100,
        completion_tokens: 100,
        startTime: new Date('2025-08-19T11:00:00Z').toISOString(),
        endTime: new Date('2025-08-19T11:00:03Z').toISOString(),
        model: 'gpt-4',
        custom_llm_provider: 'openai',
        user: testExternalUserId,
        status: 'success'
      },
      {
        request_id: 'test-req-003',
        call_type: 'acompletion',
        api_key: 'sk-test789',
        spend: 0.0015,
        total_tokens: 150,
        prompt_tokens: 75,
        completion_tokens: 75,
        startTime: new Date('2025-08-19T12:00:00Z').toISOString(),
        endTime: new Date('2025-08-19T12:00:04Z').toISOString(),
        model: 'gpt-3.5-turbo',
        custom_llm_provider: 'openai',
        user: testExternalUserId,
        status: 'success'
      }
    ]

    let savedCount = 0
    for (const log of testLogs) {
      const result = await this.saveRequestLog(log, currentUserId)
      if (result) savedCount++
    }

    this.logger.log(`Created ${savedCount} test request logs for user ${currentUserId}`)
  }

  async getDebugCounts(currentUserId?: number) {
    try {
      this.logger.debug(`Getting debug counts for user ${currentUserId}`)
      
      // Count records for current user only
      const requestLogCount = currentUserId 
        ? await this.requestLogRepository.count({ where: { userId: currentUserId } })
        : await this.requestLogRepository.count()
        
      const userSummaryCount = currentUserId
        ? await this.userSummaryRepository.count({ where: { userId: currentUserId } })
        : await this.userSummaryRepository.count()
        
      const userCount = currentUserId ? 1 : await this.userRepository.count()

      this.logger.debug(`Debug counts for user ${currentUserId}: logs=${requestLogCount}, summaries=${userSummaryCount}, users=${userCount}`)

      return {
        requestLogs: requestLogCount,
        userSummaries: userSummaryCount,
        users: userCount,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      this.logger.error('Error getting debug counts:', error)
      return {
        requestLogs: 0,
        userSummaries: 0,
        users: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  async debugUserMapping(currentUserId?: number): Promise<any> {
    try {
      this.logger.debug(`Debugging user mapping for user ${currentUserId}`)
      
      const totalLogs = await this.requestLogRepository.count()
      const totalUsers = await this.userRepository.count()
      
      let userInfo = null
      let userLogs = 0
      let unmappedLogs = 0
      let sampleLogs = []
      
      if (currentUserId) {
        userInfo = await this.userRepository.findOne({ where: { id: currentUserId } })
        userLogs = await this.requestLogRepository.count({ where: { userId: currentUserId } })
        
        if (userInfo?.externalUserId) {
          unmappedLogs = await this.requestLogRepository.count({ 
            where: { 
              externalUserId: userInfo.externalUserId,
              userId: null 
            } 
          })
        }
      }
      
      // Get a sample of all logs to see what external user IDs exist
      sampleLogs = await this.requestLogRepository.find({
        take: 10,
        order: { createdAt: 'DESC' },
        select: ['id', 'requestId', 'externalUserId', 'userId', 'model', 'createdAt']
      })

      return {
        totalLogs,
        totalUsers,
        currentUserId,
        userInfo: userInfo ? {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          externalUserId: userInfo.externalUserId,
          externalProvider: userInfo.externalProvider
        } : null,
        userLogs,
        unmappedLogs,
        sampleLogs,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error('Failed to debug user mapping:', error)
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  async generateUserSummariesFromRequestLogs(currentUserId?: number): Promise<void> {
    try {
      this.logger.log(`Generating user summaries from request logs for user ${currentUserId}`)
      
      // Get all request logs grouped by date and model for the current user
      const queryBuilder = this.requestLogRepository.createQueryBuilder('log')
        .select([
          'DATE(log.startTime) as date',
          'log.model as model',
          'log.modelGroup as modelGroup', 
          'log.customLlmProvider as customLlmProvider',
          'log.userId as userId',
          'log.externalUserId as externalUserId',
          'SUM(log.spend) as totalSpend',
          'SUM(log.totalTokens) as totalTokens',
          'SUM(log.promptTokens) as promptTokens',
          'SUM(log.completionTokens) as completionTokens',
          'SUM(log.reasoningTokens) as reasoningTokens',
          'SUM(log.cachedTokens) as cachedTokens',
          'COUNT(*) as totalRequests',
          'SUM(CASE WHEN log.status = "success" THEN 1 ELSE 0 END) as successfulRequests',
          'SUM(CASE WHEN log.status != "success" THEN 1 ELSE 0 END) as failedRequests'
        ])
        .where('log.userId IS NOT NULL')
      
      if (currentUserId) {
        queryBuilder.andWhere('log.userId = :currentUserId', { currentUserId })
      }
      
      const aggregatedData = await queryBuilder
        .groupBy('DATE(log.startTime), log.model, log.modelGroup, log.customLlmProvider, log.userId, log.externalUserId')
        .getRawMany()

      this.logger.log(`Found ${aggregatedData.length} aggregated data points to process`)

      let createdCount = 0
      let updatedCount = 0

      for (const data of aggregatedData) {
        // Check if summary already exists
        const existingSummary = await this.userSummaryRepository.findOne({
          where: {
            date: data.date,
            model: data.model,
            userId: data.userId,
            externalUserId: data.externalUserId
          }
        })

        if (existingSummary) {
          // Update existing summary
          existingSummary.totalSpend = parseFloat(data.totalSpend || '0')
          existingSummary.totalTokens = parseInt(data.totalTokens || '0')
          existingSummary.promptTokens = parseInt(data.promptTokens || '0')
          existingSummary.completionTokens = parseInt(data.completionTokens || '0')
          existingSummary.reasoningTokens = parseInt(data.reasoningTokens || '0')
          existingSummary.totalRequests = parseInt(data.totalRequests || '0')
          existingSummary.successfulRequests = parseInt(data.successfulRequests || '0')
          existingSummary.failedRequests = parseInt(data.failedRequests || '0')
          existingSummary.modelGroup = data.modelGroup
          existingSummary.customLlmProvider = data.customLlmProvider
          
          await this.userSummaryRepository.save(existingSummary)
          updatedCount++
        } else {
          // Create new summary
          const newSummary = this.userSummaryRepository.create({
            date: data.date,
            model: data.model,
            modelGroup: data.modelGroup,
            customLlmProvider: data.customLlmProvider,
            userId: data.userId,
            externalUserId: data.externalUserId,
            totalSpend: parseFloat(data.totalSpend || '0'),
            totalTokens: parseInt(data.totalTokens || '0'),
            promptTokens: parseInt(data.promptTokens || '0'),
            completionTokens: parseInt(data.completionTokens || '0'),
            reasoningTokens: parseInt(data.reasoningTokens || '0'),
            totalRequests: parseInt(data.totalRequests || '0'),
            successfulRequests: parseInt(data.successfulRequests || '0'),
            failedRequests: parseInt(data.failedRequests || '0'),
            cacheReadInputTokens: 0,
            cacheCreationInputTokens: 0
          })
          
          await this.userSummaryRepository.save(newSummary)
          createdCount++
        }
      }

      this.logger.log(`User summaries generation completed: ${createdCount} created, ${updatedCount} updated`)
    } catch (error) {
      this.logger.error('Error generating user summaries from request logs:', error)
      throw new HttpException(
        `Failed to generate user summaries: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getLiteLLMModels(includeMetadata: boolean = true, fallbackType: string = 'general'): Promise<any> {
    try {
      this.logger.log('Fetching comprehensive model information from LiteLLM...')
      
      let url = `${this.litellmBaseUrl}/models?return_wildcard_routes=false&include_model_access_groups=false&only_model_access_groups=false`
      url += `&include_metadata=${includeMetadata}`
      if (includeMetadata) {
        url += `&fallback_type=${fallbackType}`
      }

      this.logger.log(`LiteLLM Models URL: ${url}`)

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'accept': 'application/json',
            'x-litellm-api-key': this.litellmApiKey,
          },
          timeout: 15000
        })
      )

      this.logger.log(`Successfully fetched ${response.data?.data?.length || 0} models from LiteLLM`)
      return response.data
    } catch (error) {
      this.logger.error('Error fetching LiteLLM models:', error.message)
      if (error.response) {
        this.logger.error(`LiteLLM Models API response: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      
      // Return fallback structure
      return {
        data: [],
        object: 'list',
        error: error.message
      }
    }
  }

  async getLiteLLMModelInfo(modelName: string): Promise<any> {
    try {
      this.logger.log(`Fetching detailed info for model: ${modelName}`)
      
      const url = `${this.litellmBaseUrl}/model/info?model=${encodeURIComponent(modelName)}`
      this.logger.log(`LiteLLM Model Info URL: ${url}`)

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'accept': 'application/json',
            'x-litellm-api-key': this.litellmApiKey,
          },
          timeout: 10000
        })
      )

      this.logger.log(`Successfully fetched info for model: ${modelName}`)
      return response.data
    } catch (error) {
      this.logger.error(`Error fetching model info for ${modelName}:`, error.message)
      
      return {
        model: modelName,
        error: error.message,
        available: false
      }
    }
  }

  private hashApiKey(apiKey: string): string {
    // Simple hash for API key (in production, use proper hashing)
    return apiKey ? `***${apiKey.slice(-4)}` : 'unknown'
  }
}