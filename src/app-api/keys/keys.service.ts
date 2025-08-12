import { Injectable } from '@nestjs/common'
import { ExternalKeyClientService } from '../../common/services/external-key-client.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApiKey } from '../../entities/api_key.entity'
import { User } from '../../entities/user.entity'
import { KeyProcessingHelper } from './helpers/key-processing.helper'
import { UserAuthHelper } from './helpers/user-auth.helper'
import { 
  ListKeysResponse, 
  ExternalKeyResponse, 
  KeyGenerationParams, 
  AuthenticatedUser 
} from './interfaces/key.interface'
import { GenerateKeyDto } from './dto/generate-key.dto'
import { ListKeysQueryDto } from './dto/list-keys-query.dto'
import { DeleteKeysDto, UpdateKeyDto } from './dto/key-operation.dto'

@Injectable()
export class KeysService {
  constructor(
    private readonly client: ExternalKeyClientService,
    @InjectRepository(ApiKey) private readonly repo: Repository<ApiKey>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly keyProcessingHelper: KeyProcessingHelper,
    private readonly userAuthHelper: UserAuthHelper,
  ) {}

      async generateKey(keyData: GenerateKeyDto, authUser: AuthenticatedUser): Promise<ExternalKeyResponse> {
    return this.generateKeyInternal(keyData, authUser, false)
  }

  async generateServiceAccountKey(keyData: GenerateKeyDto, authUser: AuthenticatedUser): Promise<ExternalKeyResponse> {
    return this.generateKeyInternal(keyData, authUser, true)
  }

  /**
   * Internal method to handle both regular and service account key generation
   */
  private async generateKeyInternal(
    keyData: GenerateKeyDto, 
    authUser: AuthenticatedUser, 
    isServiceAccount: boolean
  ): Promise<ExternalKeyResponse> {
    // Get user context
    const userContext = await this.userAuthHelper.getUserContext(authUser)
    
    // Validate key alias uniqueness for this user
    if (keyData.key_alias) {
      await this.keyProcessingHelper.validateKeyAliasUniqueness(
        userContext.externalUserId, 
        keyData.key_alias
      )
    }

    // Prepare generation parameters
    const externalKeyAlias = this.keyProcessingHelper.generateExternalKeyAlias()
    const apiBody = this.keyProcessingHelper.prepareExternalApiBody(keyData, externalKeyAlias)
    
    // Set user ID for external API
    apiBody.user_id = userContext.externalUserId

    // Call external API
    const externalResponse = isServiceAccount 
      ? await this.client.keyGenerateServiceAccount(apiBody)
      : await this.client.keyGenerate(apiBody)

    // Process token information
    const tokenInfo = this.keyProcessingHelper.extractTokenInfo(externalResponse)

    // Create and save local API key record
    const keyEntity = this.keyProcessingHelper.createApiKeyEntity(
      {
        externalUserId: userContext.externalUserId,
        requestedAlias: keyData.key_alias,
        externalKeyAlias,
      },
      tokenInfo,
      externalResponse,
      userContext.localUserId
    )

    await this.repo.save(keyEntity)
    
    return externalResponse
  }

  async updateKey(updateData: UpdateKeyDto) {
    const data = await this.client.keyUpdate(updateData)
    // Best-effort sync by alias
    if (updateData.key) {
      await this.repo.update(
        { tokenLast4: updateData.key.slice(-4) }, 
        { 
          maxBudget: updateData.max_budget, 
          blocked: updateData.blocked 
        }
      )
    }
    return data
  }

  async deleteKeys(deleteData: DeleteKeysDto) {
    const data = await this.client.keyDelete(deleteData)
    // Mark revoked by key_alias if provided
    if (deleteData.key_aliases?.length) {
      await this.repo.update(
        { keyAlias: { $in: deleteData.key_aliases } as any }, 
        { revokedAt: new Date() }
      )
    }
    return data
  }

  async info(key?: string) { return this.client.keyInfo(key) }

  async regenerateKey(pathKey: string, body?: Record<string, any>) {
    const data = await this.client.keyRegenerate(pathKey, body)
    await this.repo.update({ tokenLast4: pathKey.slice(-4) }, { rotatedAt: new Date() })
    return data
  }

  async list(query: ListKeysQueryDto, authUser: AuthenticatedUser): Promise<ListKeysResponse> {
    // Get authenticated user context
    const userContext = await this.userAuthHelper.getUserContext(authUser)
    
    // Always scope to the authenticated user
    const page = query.page || 1
    const size = query.size || 10
    
    const qb = this.repo.createQueryBuilder('k')
    qb.andWhere('k.externalUserId = :euid', { euid: userContext.externalUserId })
    
    // Add optional filters
    if (query.key_alias) {
      qb.andWhere('k.keyAlias LIKE :alias', { alias: `%${query.key_alias}%` })
    }
    
    const sortDir = query.sort_order === 'asc' ? 'ASC' : 'DESC'
    qb.orderBy('k.createdAt', sortDir as any)
    qb.skip((page - 1) * size).take(size)
    
    const [rows, total] = await qb.getManyAndCount()
    
    return {
      keys: rows.map((r) => ({
        id: r.id,
        key_alias: r.keyAlias,
        token_last4: r.tokenLast4,
        token_prefix: r.tokenPrefix,
        blocked: r.blocked,
        expires: r.expiresAt,
        models: r.models || [],
        allowed_routes: r.allowedRoutes || [],
        max_budget: r.maxBudget,
        spend: r.spend,
        user_id: r.externalUserId,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      })),
      total_count: total,
      current_page: page,
      total_pages: Math.ceil(total / size),
    }
  }

  async block(key: string) {
    const data = await this.client.keyBlock(key)
    await this.repo.update({ tokenLast4: key.slice(-4) }, { blocked: true })
    return data
  }

  async unblock(key: string) {
    const data = await this.client.keyUnblock(key)
    await this.repo.update({ tokenLast4: key.slice(-4) }, { blocked: false })
    return data
  }

  async health() { return this.client.keyHealth() }
}


