import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class ExternalKeyClientService {
  private readonly logger = new Logger(ExternalKeyClientService.name)
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl =
      this.config.get<string>('AI_GATEWAY_BASE_URL') ||
      this.config.get<string>('EXTERNAL_AI_BASE_URL') ||
      this.config.get<string>('LITELLM_BASE_URL') ||
      'http://localhost:4000'
    this.apiKey =
      this.config.get<string>('AI_GATEWAY_API_KEY') ||
      this.config.get<string>('EXTERNAL_AI_API_KEY') ||
      this.config.get<string>('LITELLM_API_KEY') ||
      ''
  }

  private authHeaders(extra?: Record<string, string>) {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...(extra || {}),
    }
  }

  private rethrowAxios(error: any): never {
    if (error?.response) {
      const status = error.response.status
      const data = error.response.data
      const detail = typeof data === 'string' ? data : JSON.stringify(data)
      throw new Error(`External provider ${status}: ${detail}`)
    }
    if (error?.code === 'ECONNREFUSED') {
      throw new Error(`External provider not reachable at ${this.baseUrl}`)
    }
    throw new Error(error?.message || 'Unknown error')
  }

  // Keys API
  async keyGenerate(body: Record<string, any>) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/key/generate`, body, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async keyGenerateServiceAccount(body: Record<string, any>) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/key/service-account/generate`, body, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async keyUpdate(body: Record<string, any>) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/key/update`, body, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async keyDelete(body: { keys?: string[]; key_aliases?: string[] }) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/key/delete`, body, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async keyInfo(key?: string) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${this.baseUrl}/key/info`, { headers: this.authHeaders(), params: key ? { key } : undefined })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async keyRegenerate(pathKey: string, body?: Record<string, any>) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/key/${encodeURIComponent(pathKey)}/regenerate`, body || {}, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async keyList(query: Record<string, any> = {}) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${this.baseUrl}/key/list`, { headers: this.authHeaders(), params: query })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async keyBlock(key: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/key/block`, { key }, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async keyUnblock(key: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/key/unblock`, { key }, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async keyHealth() {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/key/health`, {}, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }

  // Users API
  async userCreate(body: Record<string, any>) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/user/new`, body, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async userInfo(user_id: string) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${this.baseUrl}/user/info`, { headers: this.authHeaders(), params: { user_id } })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async userUpdate(user_id: string, updates: Record<string, any>) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/user/update`, { user_id, ...updates }, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
  async userDelete(user_ids: string[]) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.baseUrl}/user/delete`, { user_ids }, { headers: this.authHeaders() })
      )
      return res.data
    } catch (e) { this.rethrowAxios(e) }
  }
}


