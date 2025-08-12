export interface TokenInfo {
  token?: string
  tokenLast4?: string
  tokenPrefix?: string
  tokenHash?: string
}

export interface ExternalKeyResponse {
  key?: string
  token?: string
  token_id?: string
  user_id?: string
  expires?: string
  blocked?: boolean
  max_budget?: number
  spend?: number
  models?: string[]
  allowed_routes?: string[]
  metadata?: Record<string, any>
  tags?: string[]
}

export interface AuthenticatedUser {
  userId?: number
  sub?: number
  id?: number
  email?: string
}

export interface UserContext {
  localUserId: number
  externalUserId: string
}

export interface ListKeysResponse {
  keys: any[]
  total_count: number
  current_page: number
  total_pages: number
}

export interface KeyGenerationParams {
  externalUserId: string
  requestedAlias: string
  externalKeyAlias: string
}
