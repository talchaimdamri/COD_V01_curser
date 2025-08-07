import { describe, it, expect } from 'vitest'
import { AgentValidationService } from './agentValidation'
import { AgentEditorForm } from '../../schemas/agent'

describe('AgentValidationService', () => {
  describe('validateForm', () => {
    it('should validate a complete valid form', () => {
      const validForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
        tools: [],
      }

      const result = AgentValidationService.validateForm(validForm)

      expect(result.isValid).toBe(true)
      expect(result.data).toEqual(validForm)
      expect(result.errors).toBeUndefined()
    })

    it('should reject form with missing name', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: '',
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
      }

      const result = AgentValidationService.validateForm(invalidForm)

      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.name).toContain('Agent name is required')
    })

    it('should reject form with name too long', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: 'a'.repeat(256), // 256 characters
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
      }

      const result = AgentValidationService.validateForm(invalidForm)

      expect(result.isValid).toBe(false)
      expect(result.errors?.name).toContain('Agent name must be less than 255 characters')
    })

    it('should reject form with missing prompt', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: '',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
      }

      const result = AgentValidationService.validateForm(invalidForm)

      expect(result.isValid).toBe(false)
      expect(result.errors?.prompt).toContain('Prompt is required')
    })

    it('should reject form with prompt too long', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: 'a'.repeat(10001), // 10001 characters
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
      }

      const result = AgentValidationService.validateForm(invalidForm)

      expect(result.isValid).toBe(false)
      expect(result.errors?.prompt).toContain('Prompt must be less than 10,000 characters')
    })

    it('should reject form with missing model', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: 'You are a test agent',
        model: '',
        temperature: 0.7,
        maxTokens: 4096,
      }

      const result = AgentValidationService.validateForm(invalidForm)

      expect(result.isValid).toBe(false)
      expect(result.errors?.model).toContain('Model selection is required')
    })

    it('should reject form with invalid temperature', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: 2.5, // Above max
        maxTokens: 4096,
      }

      const result = AgentValidationService.validateForm(invalidForm)

      expect(result.isValid).toBe(false)
      expect(result.errors?.temperature).toContain('Temperature must be at most 2')
    })

    it('should reject form with negative temperature', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: -0.1, // Below min
        maxTokens: 4096,
      }

      const result = AgentValidationService.validateForm(invalidForm)

      expect(result.isValid).toBe(false)
      expect(result.errors?.temperature).toContain('Temperature must be at least 0')
    })

    it('should reject form with invalid maxTokens', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 0, // Below min
      }

      const result = AgentValidationService.validateForm(invalidForm)

      expect(result.isValid).toBe(false)
      expect(result.errors?.maxTokens).toContain('Max tokens must be at least 1')
    })

    it('should reject form with maxTokens too high', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 200001, // Above max
      }

      const result = AgentValidationService.validateForm(invalidForm)

      expect(result.isValid).toBe(false)
      expect(result.errors?.maxTokens).toContain('Max tokens must be at most 200,000')
    })

    it('should reject form with non-integer maxTokens', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096.5, // Not integer
      }

      const result = AgentValidationService.validateForm(invalidForm)

      expect(result.isValid).toBe(false)
      expect(result.errors?.maxTokens).toBeDefined()
    })
  })

  describe('validateField', () => {
    it('should validate a valid name field', () => {
      const result = AgentValidationService.validateField('name', 'Test Agent')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty name field', () => {
      const result = AgentValidationService.validateField('name', '')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Agent name is required')
    })

    it('should validate a valid prompt field', () => {
      const result = AgentValidationService.validateField('prompt', 'You are a test agent')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty prompt field', () => {
      const result = AgentValidationService.validateField('prompt', '')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Prompt is required')
    })

    it('should validate a valid model field', () => {
      const result = AgentValidationService.validateField('model', 'gpt-4')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty model field', () => {
      const result = AgentValidationService.validateField('model', '')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Model selection is required')
    })

    it('should validate a valid temperature field', () => {
      const result = AgentValidationService.validateField('temperature', 0.7)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject temperature below minimum', () => {
      const result = AgentValidationService.validateField('temperature', -0.1)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Temperature must be at least 0')
    })

    it('should reject temperature above maximum', () => {
      const result = AgentValidationService.validateField('temperature', 2.1)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Temperature must be at most 2')
    })

    it('should validate a valid maxTokens field', () => {
      const result = AgentValidationService.validateField('maxTokens', 4096)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject maxTokens below minimum', () => {
      const result = AgentValidationService.validateField('maxTokens', 0)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Max tokens must be at least 1')
    })

    it('should reject maxTokens above maximum', () => {
      const result = AgentValidationService.validateField('maxTokens', 200001)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Max tokens must be at most 200,000')
    })
  })

  describe('getFieldValidationRules', () => {
    it('should return validation rules for name field', () => {
      const rules = AgentValidationService.getFieldValidationRules('name')
      expect(rules).toEqual({
        required: true,
        minLength: 1,
        maxLength: 255,
        pattern: /^[a-zA-Z0-9\s\-_]+$/,
      })
    })

    it('should return validation rules for prompt field', () => {
      const rules = AgentValidationService.getFieldValidationRules('prompt')
      expect(rules).toEqual({
        required: true,
        minLength: 1,
        maxLength: 10000,
      })
    })

    it('should return validation rules for model field', () => {
      const rules = AgentValidationService.getFieldValidationRules('model')
      expect(rules).toEqual({
        required: true,
      })
    })

    it('should return validation rules for temperature field', () => {
      const rules = AgentValidationService.getFieldValidationRules('temperature')
      expect(rules).toEqual({
        required: true,
        min: 0,
        max: 2,
        step: 0.1,
      })
    })

    it('should return validation rules for maxTokens field', () => {
      const rules = AgentValidationService.getFieldValidationRules('maxTokens')
      expect(rules).toEqual({
        required: true,
        min: 1,
        max: 200000,
        step: 1,
      })
    })

    it('should return empty object for unknown field', () => {
      const rules = AgentValidationService.getFieldValidationRules('unknown' as any)
      expect(rules).toEqual({})
    })
  })

  describe('canSubmit', () => {
    it('should return true for valid form', () => {
      const validForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
      }

      const result = AgentValidationService.canSubmit(validForm)
      expect(result).toBe(true)
    })

    it('should return false for invalid form', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: '',
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
      }

      const result = AgentValidationService.canSubmit(invalidForm)
      expect(result).toBe(false)
    })
  })

  describe('getAllErrors', () => {
    it('should return empty array for valid form', () => {
      const validForm: Partial<AgentEditorForm> = {
        name: 'Test Agent',
        prompt: 'You are a test agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096,
      }

      const result = AgentValidationService.getAllErrors(validForm)
      expect(result).toEqual([])
    })

    it('should return all errors for invalid form', () => {
      const invalidForm: Partial<AgentEditorForm> = {
        name: '',
        prompt: '',
        model: '',
        temperature: -1,
        maxTokens: 0,
      }

      const result = AgentValidationService.getAllErrors(invalidForm)
      expect(result.length).toBeGreaterThan(0)
      expect(result).toContain('Agent name is required')
      expect(result).toContain('Prompt is required')
      expect(result).toContain('Model selection is required')
    })
  })
})
