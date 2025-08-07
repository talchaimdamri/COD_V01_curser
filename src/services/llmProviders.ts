import { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk } from './agentExecution'

export interface OpenAIRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
  tools?: any[]
}

export interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message?: {
      role: string
      content: string
    }
    delta?: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AnthropicRequest {
  model: string
  max_tokens: number
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  stream?: boolean
  system?: string
}

export interface AnthropicResponse {
  id: string
  type: string
  role: string
  content: Array<{
    type: string
    text: string
  }>
  model: string
  stop_reason: string
  stop_sequence: string | null
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export class OpenAIProvider implements LLMProvider {
  name = 'openai'
  models = [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k'
  ]

  private apiKey: string
  private baseUrl: string
  private timeout: number

  constructor(apiKey?: string, baseUrl?: string, timeout: number = 30000) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
    this.baseUrl = baseUrl || 'https://api.openai.com/v1'
    this.timeout = timeout
  }

  async execute(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now()
    
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key is required')
      }

      const openAIRequest: OpenAIRequest = {
        model: request.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
        stream: false,
        tools: request.tools
      }

      const response = await this.makeRequest('/chat/completions', openAIRequest)
      const duration = Date.now() - startTime

      return {
        success: true,
        output: response.choices[0]?.message?.content || '',
        tokensUsed: response.usage?.total_tokens || 0,
        modelUsed: response.model,
        duration
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  async *stream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    try {
      if (!this.apiKey) {
        yield {
          type: 'error',
          error: 'OpenAI API key is required'
        }
        return
      }

      const openAIRequest: OpenAIRequest = {
        model: request.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
        stream: true,
        tools: request.tools
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(openAIRequest),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        const errorText = await response.text()
        yield {
          type: 'error',
          error: `OpenAI API error: ${response.status} ${errorText}`
        }
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        yield {
          type: 'error',
          error: 'Failed to get response reader'
        }
        return
      }

      let totalTokens = 0
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                yield {
                  type: 'done',
                  tokensUsed: totalTokens,
                  modelUsed: request.model
                }
                return
              }

              try {
                const parsed: OpenAIResponse = JSON.parse(data)
                const content = parsed.choices[0]?.delta?.content
                
                if (content) {
                  yield {
                    type: 'content',
                    content
                  }
                }

                if (parsed.usage) {
                  totalTokens = parsed.usage.total_tokens
                }
              } catch (parseError) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<OpenAIResponse> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.timeout)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }
}

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic'
  models = [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2'
  ]

  private apiKey: string
  private baseUrl: string
  private timeout: number

  constructor(apiKey?: string, baseUrl?: string, timeout: number = 30000) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ''
    this.baseUrl = baseUrl || 'https://api.anthropic.com/v1'
    this.timeout = timeout
  }

  async execute(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now()
    
    try {
      if (!this.apiKey) {
        throw new Error('Anthropic API key is required')
      }

      const anthropicRequest: AnthropicRequest = {
        model: request.model,
        max_tokens: request.maxTokens || 1000,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        temperature: request.temperature || 0.7,
        stream: false,
        system: 'You are a helpful assistant.'
      }

      const response = await this.makeRequest('/messages', anthropicRequest)
      const duration = Date.now() - startTime

      return {
        success: true,
        output: response.content[0]?.text || '',
        tokensUsed: response.usage?.output_tokens || 0,
        modelUsed: response.model,
        duration
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  async *stream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    try {
      if (!this.apiKey) {
        yield {
          type: 'error',
          error: 'Anthropic API key is required'
        }
        return
      }

      const anthropicRequest: AnthropicRequest = {
        model: request.model,
        max_tokens: request.maxTokens || 1000,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        temperature: request.temperature || 0.7,
        stream: true,
        system: 'You are a helpful assistant.'
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(anthropicRequest),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        const errorText = await response.text()
        yield {
          type: 'error',
          error: `Anthropic API error: ${response.status} ${errorText}`
        }
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        yield {
          type: 'error',
          error: 'Failed to get response reader'
        }
        return
      }

      let totalTokens = 0
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                yield {
                  type: 'done',
                  tokensUsed: totalTokens,
                  modelUsed: request.model
                }
                return
              }

              try {
                const parsed: AnthropicResponse = JSON.parse(data)
                const content = parsed.content[0]?.text
                
                if (content) {
                  yield {
                    type: 'content',
                    content
                  }
                }

                if (parsed.usage) {
                  totalTokens = parsed.usage.output_tokens
                }
              } catch (parseError) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<AnthropicResponse> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.timeout)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }
}

export class MockProvider implements LLMProvider {
  name = 'mock'
  models = ['mock-model-1', 'mock-model-2']

  async execute(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now()
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    
    const duration = Date.now() - startTime
    
    return {
      success: true,
      output: `Mock response from ${request.model}: ${request.prompt}`,
      tokensUsed: Math.floor(Math.random() * 500) + 100,
      modelUsed: request.model,
      duration
    }
  }

  async *stream(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    const response = `Mock streaming response from ${request.model}: ${request.prompt}`
    const words = response.split(' ')
    
    for (const word of words) {
      yield {
        type: 'content',
        content: word + ' '
      }
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    yield {
      type: 'done',
      tokensUsed: Math.floor(Math.random() * 500) + 100,
      modelUsed: request.model
    }
  }
}

export class LLMProviderManager {
  private providers: Map<string, LLMProvider> = new Map()
  private requestQueue: Map<string, Array<() => Promise<void>>> = new Map()
  private rateLimits: Map<string, { requests: number; resetTime: number }> = new Map()

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // Initialize with mock provider by default
    this.registerProvider(new MockProvider())
    
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.registerProvider(new OpenAIProvider())
    }
    
    // Initialize Anthropic if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.registerProvider(new AnthropicProvider())
    }
  }

  registerProvider(provider: LLMProvider) {
    this.providers.set(provider.name, provider)
  }

  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name)
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  async executeWithProvider(providerName: string, request: LLMRequest): Promise<LLMResponse> {
    const provider = this.getProvider(providerName)
    if (!provider) {
      return {
        success: false,
        error: `Provider '${providerName}' not found`
      }
    }

    // Check rate limiting
    if (!this.checkRateLimit(providerName)) {
      return {
        success: false,
        error: 'Rate limit exceeded'
      }
    }

    return provider.execute(request)
  }

  async *streamWithProvider(providerName: string, request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    const provider = this.getProvider(providerName)
    if (!provider) {
      yield {
        type: 'error',
        error: `Provider '${providerName}' not found`
      }
      return
    }

    // Check rate limiting
    if (!this.checkRateLimit(providerName)) {
      yield {
        type: 'error',
        error: 'Rate limit exceeded'
      }
      return
    }

    yield* provider.stream(request)
  }

  private checkRateLimit(providerName: string): boolean {
    const now = Date.now()
    const limit = this.rateLimits.get(providerName)
    
    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(providerName, {
        requests: 1,
        resetTime: now + 60000 // Reset after 1 minute
      })
      return true
    }

    if (limit.requests >= 10) { // Max 10 requests per minute
      return false
    }

    limit.requests++
    return true
  }
}
