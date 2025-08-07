import { Agent } from '../schemas/agent'

export interface AgentTestRequest {
  agent: Partial<Agent>
  input: string
  userId?: string
}

export interface AgentTestResponse {
  success: boolean
  output?: string
  error?: string
  executionTime?: number
  tokensUsed?: number
  modelUsed?: string
}

export interface SampleInput {
  id: string
  name: string
  description: string
  input: string
  category: string
  tags: string[]
}

export class AgentTestingService {
  private static instance: AgentTestingService
  private sampleInputs: SampleInput[] = []

  private constructor() {
    this.initializeSampleInputs()
  }

  static getInstance(): AgentTestingService {
    if (!AgentTestingService.instance) {
      AgentTestingService.instance = new AgentTestingService()
    }
    return AgentTestingService.instance
  }

  private initializeSampleInputs() {
    this.sampleInputs = [
      // Document Analysis samples
      {
        id: 'doc-summary',
        name: 'Document Summary Request',
        description: 'Request to summarize a document',
        input: 'Please summarize the key points from this document and identify the main themes.',
        category: 'Document Processing',
        tags: ['summary', 'analysis', 'document']
      },
      {
        id: 'doc-insights',
        name: 'Document Insights Request',
        description: 'Request to extract insights from a document',
        input: 'What are the main insights and actionable recommendations from this document?',
        category: 'Document Processing',
        tags: ['insights', 'recommendations', 'analysis']
      },
      // Code Review samples
      {
        id: 'code-review',
        name: 'Code Review Request',
        description: 'Request to review code for issues',
        input: 'Please review this code for potential bugs, security issues, and performance improvements.',
        category: 'Code & Development',
        tags: ['code-review', 'bugs', 'security', 'performance']
      },
      {
        id: 'code-optimization',
        name: 'Code Optimization Request',
        description: 'Request to optimize code',
        input: 'How can I optimize this code for better performance and readability?',
        category: 'Code & Development',
        tags: ['optimization', 'performance', 'readability']
      },
      // Data Analysis samples
      {
        id: 'data-analysis',
        name: 'Data Analysis Request',
        description: 'Request to analyze data',
        input: 'Please analyze this dataset and provide insights about trends and patterns.',
        category: 'Data Analysis',
        tags: ['data', 'analysis', 'trends', 'patterns']
      },
      {
        id: 'data-visualization',
        name: 'Data Visualization Request',
        description: 'Request to create visualizations',
        input: 'What visualizations would be most effective for representing this data?',
        category: 'Data Analysis',
        tags: ['visualization', 'charts', 'graphs']
      },
      // Research samples
      {
        id: 'research-summary',
        name: 'Research Summary Request',
        description: 'Request to summarize research',
        input: 'Please provide a comprehensive summary of the latest research on this topic.',
        category: 'Research',
        tags: ['research', 'summary', 'latest']
      },
      {
        id: 'research-comparison',
        name: 'Research Comparison Request',
        description: 'Request to compare research findings',
        input: 'Compare and contrast the findings from these research papers.',
        category: 'Research',
        tags: ['comparison', 'contrast', 'findings']
      },
      // Creative Content samples
      {
        id: 'content-creation',
        name: 'Content Creation Request',
        description: 'Request to create content',
        input: 'Please help me create engaging content for this topic.',
        category: 'Creative Content',
        tags: ['content', 'creation', 'engaging']
      },
      {
        id: 'content-improvement',
        name: 'Content Improvement Request',
        description: 'Request to improve content',
        input: 'How can I improve this content to make it more engaging and effective?',
        category: 'Creative Content',
        tags: ['improvement', 'engagement', 'effectiveness']
      }
    ]
  }

  async testAgent(request: AgentTestRequest): Promise<AgentTestResponse> {
    const startTime = Date.now()
    
    try {
      // Validate agent configuration
      if (!request.agent.prompt?.trim()) {
        return {
          success: false,
          error: 'Agent prompt is required'
        }
      }

      if (!request.agent.model) {
        return {
          success: false,
          error: 'Agent model is required'
        }
      }

      if (!request.input.trim()) {
        return {
          success: false,
          error: 'Test input is required'
        }
      }

      // Simulate API call to agent execution service
      // In a real implementation, this would call the actual agent execution API
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

      // Simulate different response patterns based on agent type
      const response = this.generateSimulatedResponse(request)
      
      const executionTime = Date.now() - startTime
      
      return {
        success: true,
        output: response,
        executionTime,
        tokensUsed: Math.floor(Math.random() * 500) + 100,
        modelUsed: request.agent.model
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test agent'
      }
    }
  }

  private generateSimulatedResponse(request: AgentTestRequest): string {
    const { agent, input } = request
    const agentName = agent.name || 'Agent'
    const model = agent.model || 'Unknown Model'
    
    // Generate different response patterns based on agent tools and prompt
    const hasWebSearch = agent.tools?.some(t => t.name === 'web_search')
    const hasFileReader = agent.tools?.some(t => t.name === 'file_reader')
    const hasCalculator = agent.tools?.some(t => t.name === 'calculator')
    const hasCodeExecutor = agent.tools?.some(t => t.name === 'code_executor')

    let response = `Response from ${agentName} (${model}):\n\n`

    if (hasWebSearch) {
      response += `🔍 Web Search Results:\nI found relevant information about "${input}" from recent sources.\n\n`
    }

    if (hasFileReader) {
      response += `📄 Document Analysis:\nI've analyzed the provided document and extracted key insights.\n\n`
    }

    if (hasCalculator) {
      response += `🧮 Calculations:\nI performed the necessary calculations to support my analysis.\n\n`
    }

    if (hasCodeExecutor) {
      response += `💻 Code Execution:\nI executed the code and verified the results.\n\n`
    }

    // Add contextual response based on input type
    if (input.toLowerCase().includes('summary')) {
      response += `📋 Summary:\nBased on your request for a summary, here are the key points:\n\n1. Main point one\n2. Main point two\n3. Main point three\n\nThis summary captures the essential information while maintaining clarity and conciseness.`
    } else if (input.toLowerCase().includes('review') || input.toLowerCase().includes('code')) {
      response += `🔍 Code Review:\nI've reviewed the code and identified several areas for improvement:\n\n✅ Strengths:\n- Good code structure\n- Clear variable naming\n\n⚠️ Areas for improvement:\n- Consider adding error handling\n- Optimize the algorithm for better performance\n\n🔧 Recommendations:\n1. Add input validation\n2. Implement proper error handling\n3. Consider using a more efficient data structure`
    } else if (input.toLowerCase().includes('analyze') || input.toLowerCase().includes('data')) {
      response += `📊 Data Analysis:\nBased on my analysis of the data, I've identified the following patterns:\n\n📈 Trends:\n- Positive correlation between variables A and B\n- Seasonal patterns in the data\n\n💡 Insights:\n- The data shows a clear upward trend\n- There are outliers that may need investigation\n\n📋 Recommendations:\n1. Continue monitoring the identified trends\n2. Investigate the outliers for potential issues\n3. Consider implementing automated alerts for significant changes`
    } else {
      response += `💬 Response:\nI understand your request: "${input}"\n\nHere's my analysis and response based on the information provided:\n\nThis is a comprehensive response that addresses your specific query while leveraging my available tools and capabilities. I've considered the context and provided actionable insights.`
    }

    return response
  }

  getSampleInputs(category?: string, tags?: string[]): SampleInput[] {
    let filtered = this.sampleInputs

    if (category) {
      filtered = filtered.filter(input => input.category === category)
    }

    if (tags && tags.length > 0) {
      filtered = filtered.filter(input => 
        tags.some(tag => input.tags.includes(tag))
      )
    }

    return filtered
  }

  getSampleInputById(id: string): SampleInput | undefined {
    return this.sampleInputs.find(input => input.id === id)
  }

  getCategories(): string[] {
    return [...new Set(this.sampleInputs.map(input => input.category))]
  }

  getTags(): string[] {
    const allTags = this.sampleInputs.flatMap(input => input.tags)
    return [...new Set(allTags)]
  }

  addCustomSampleInput(input: Omit<SampleInput, 'id'>): string {
    const id = `custom-${Date.now()}`
    const newInput: SampleInput = { ...input, id }
    this.sampleInputs.push(newInput)
    return id
  }

  removeCustomSampleInput(id: string): boolean {
    const index = this.sampleInputs.findIndex(input => input.id === id)
    if (index !== -1 && id.startsWith('custom-')) {
      this.sampleInputs.splice(index, 1)
      return true
    }
    return false
  }
}
