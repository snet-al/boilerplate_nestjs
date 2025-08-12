import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ExternalKeyClientService } from './external-key-client.service'

export interface ExternalUserCreateRequest {
  user_id?: string
  user_alias?: string
  user_email: string
  user_role?: string
  max_budget?: number
  budget_duration?: string
  auto_create_key?: boolean
  metadata?: Record<string, any>
}

export interface ExternalUserResponse {
  user_id: string
  user_email: string
  key?: string
  max_budget?: number
  expires?: string
  metadata?: Record<string, any>
}

export interface ExternalUserProvider {
  createUser(request: ExternalUserCreateRequest): Promise<ExternalUserResponse>
  getUserInfo(userId: string): Promise<ExternalUserResponse | null>
  updateUser(userId: string, updates: Partial<ExternalUserCreateRequest>): Promise<ExternalUserResponse>
  deleteUser(userId: string): Promise<boolean>
}

@Injectable()
export class LiteLLMProvider implements ExternalUserProvider {
  private readonly logger = new Logger(LiteLLMProvider.name)

  constructor(
    private readonly client: ExternalKeyClientService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log(`LiteLLM configured`)
  }

  async createUser(request: ExternalUserCreateRequest): Promise<ExternalUserResponse> {
    try {
      this.logger.debug(`Creating user in LiteLLM: ${JSON.stringify(request)}`)
      const data = await this.client.userCreate(request)
      return {
        user_id: data.user_id,
        user_email: data.user_email,
        key: data.key,
        max_budget: data.max_budget,
        expires: data.expires,
        metadata: data.metadata,
      }
    } catch (error) {
      this.logger.error(`Failed to create user in LiteLLM: ${error.message}`, error.stack)
      throw new Error(`External user creation failed: ${error.message}`)
    }
  }

  async getUserInfo(userId: string): Promise<ExternalUserResponse | null> {
    try {
      const data = await this.client.userInfo(userId)
      return data
    } catch (error) {
      if (error.response?.status === 404) {
        return null
      }
      this.logger.error(`Failed to get user info from LiteLLM: ${error.message}`, error.stack)
      throw new Error(`External user info retrieval failed: ${error.message}`)
    }
  }

  async updateUser(userId: string, updates: Partial<ExternalUserCreateRequest>): Promise<ExternalUserResponse> {
    try {
      const data = await this.client.userUpdate(userId, updates)
      return data
    } catch (error) {
      this.logger.error(`Failed to update user in LiteLLM: ${error.message}`, error.stack)
      throw new Error(`External user update failed: ${error.message}`)
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await this.client.userDelete([userId])
      return true
    } catch (error) {
      this.logger.error(`Failed to delete user in LiteLLM: ${error.message}`, error.stack)
      return false
    }
  }
}

@Injectable()
export class ExternalUserManagementService {
  private readonly logger = new Logger(ExternalUserManagementService.name)
  private provider: ExternalUserProvider

  constructor(
    private readonly client: ExternalKeyClientService,
    private readonly configService: ConfigService,
  ) {
    const providerType = this.configService.get<string>('EXTERNAL_USER_PROVIDER') || 'litellm'
    
    switch (providerType.toLowerCase()) {
      case 'litellm':
        this.provider = new LiteLLMProvider(this.client, this.configService)
        break
      default:
        this.logger.warn(`Unknown external user provider: ${providerType}, defaulting to LiteLLM`)
        this.provider = new LiteLLMProvider(this.client, this.configService)
    }
  }

  async createExternalUser(request: ExternalUserCreateRequest): Promise<ExternalUserResponse> {
    return this.provider.createUser(request)
  }

  async getExternalUserInfo(userId: string): Promise<ExternalUserResponse | null> {
    return this.provider.getUserInfo(userId)
  }

  async updateExternalUser(userId: string, updates: Partial<ExternalUserCreateRequest>): Promise<ExternalUserResponse> {
    return this.provider.updateUser(userId, updates)
  }

  async deleteExternalUser(userId: string): Promise<boolean> {
    return this.provider.deleteUser(userId)
  }

  async syncUserWithExternal(localUser: { id: number; name: string; email: string }): Promise<ExternalUserResponse> {
    const externalUserRequest: ExternalUserCreateRequest = {
      user_id: `local_${localUser.id}`,
      user_alias: localUser.name,
      user_email: localUser.email,
      user_role: 'internal_user',
      max_budget: this.configService.get<number>('DEFAULT_USER_BUDGET') || 10.0,
      budget_duration: '1mo',
      auto_create_key: true,
      metadata: {
        local_user_id: localUser.id,
        created_by: 'nestjs_backend',
        sync_date: new Date().toISOString(),
      },
    }

    return this.createExternalUser(externalUserRequest)
  }
}