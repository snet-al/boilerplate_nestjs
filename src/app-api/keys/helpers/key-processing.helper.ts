import { Injectable } from '@nestjs/common'
import { createHash, randomUUID } from 'crypto'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { ApiKey } from '../../../entities/api_key.entity'
import { TokenInfo, ExternalKeyResponse, KeyGenerationParams } from '../interfaces/key.interface'

@Injectable()
export class KeyProcessingHelper {
  constructor(
    @InjectRepository(ApiKey) private readonly apiKeyRepo: Repository<ApiKey>,
  ) {}

  /**
   * Extract and process token information from external response
   */
  extractTokenInfo(data: ExternalKeyResponse): TokenInfo {
    const token: string | undefined = data?.key || data?.token
    
    if (!token) {
      return {}
    }

    return {
      token,
      tokenLast4: token.slice(-4),
      tokenPrefix: token.slice(0, 7),
      tokenHash: createHash('sha256').update(token).digest('hex'),
    }
  }

  /**
   * Generate unique external key alias
   */
  generateExternalKeyAlias(): string {
    return `ak_${randomUUID()}`
  }

  /**
   * Check if key alias is unique for the user
   */
  async validateKeyAliasUniqueness(externalUserId: string, keyAlias: string): Promise<void> {
    const exists = await this.apiKeyRepo.findOne({
      where: { 
        externalUserId, 
        keyAlias, 
        revokedAt: null 
      }
    })

    if (exists) {
      throw new Error('A key with this name already exists for this user')
    }
  }

  /**
   * Create API key entity from external response and user context
   */
  createApiKeyEntity(
    params: KeyGenerationParams,
    tokenInfo: TokenInfo,
    externalResponse: ExternalKeyResponse,
    localUserId: number
  ): ApiKey {
    return this.apiKeyRepo.create({
      userId: localUserId,
      externalUserId: params.externalUserId,
      source: 'external',
      keyAlias: params.requestedAlias,
      externalKeyAlias: params.externalKeyAlias,
      tokenLast4: tokenInfo.tokenLast4,
      tokenPrefix: tokenInfo.tokenPrefix,
      tokenHash: tokenInfo.tokenHash,
      litellmTokenId: externalResponse?.token_id,
      expiresAt: externalResponse?.expires ? new Date(externalResponse.expires) : undefined,
      blocked: !!externalResponse?.blocked,
      maxBudget: externalResponse?.max_budget,
      spend: externalResponse?.spend,
      models: externalResponse?.models,
      allowedRoutes: externalResponse?.allowed_routes,
      metadata: externalResponse?.metadata,
      tags: externalResponse?.tags,
    })
  }

  /**
   * Prepare request body for external API with unique alias
   */
  prepareExternalApiBody(requestBody: any, externalKeyAlias: string): any {
    return {
      ...requestBody,
      key_alias: externalKeyAlias,
    }
  }
}
