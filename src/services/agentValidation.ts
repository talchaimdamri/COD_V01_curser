import { AgentEditorFormSchema, AgentEditorForm, AgentEditorFormValidationResult } from '../../schemas/agent'

/**
 * Service for validating agent editor form data using Zod schemas
 */
export class AgentValidationService {
  /**
   * Validate agent form data and return validation result
   */
  static validateForm(formData: Partial<AgentEditorForm>): AgentEditorFormValidationResult {
    try {
      const validatedData = AgentEditorFormSchema.parse(formData)
      return {
        isValid: true,
        data: validatedData,
      }
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        const zodError = error as any
        const fieldErrors: Record<string, string[]> = {}
        
        // Extract field-specific errors from Zod
        zodError.errors.forEach((err: any) => {
          const field = err.path.join('.')
          if (!fieldErrors[field]) {
            fieldErrors[field] = []
          }
          fieldErrors[field].push(err.message)
        })
        
        return {
          isValid: false,
          errors: fieldErrors,
        }
      }
      
      return {
        isValid: false,
        errors: {
          general: ['An unexpected validation error occurred'],
        },
      }
    }
  }

  /**
   * Validate a specific field and return field-specific validation result
   */
  static validateField(fieldName: keyof AgentEditorForm, value: any): { isValid: boolean; error?: string } {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = AgentEditorFormSchema.pick({ [fieldName]: true })
      fieldSchema.parse({ [fieldName]: value })
      
      return { isValid: true }
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        const zodError = error as any
        const fieldError = zodError.errors.find((err: any) => err.path[0] === fieldName)
        
        return {
          isValid: false,
          error: fieldError?.message || 'Invalid value',
        }
      }
      
      return {
        isValid: false,
        error: 'Validation failed',
      }
    }
  }

  /**
   * Get validation rules for a specific field
   */
  static getFieldValidationRules(fieldName: keyof AgentEditorForm) {
    const rules: Record<string, any> = {
      name: {
        required: true,
        minLength: 1,
        maxLength: 255,
        pattern: /^[a-zA-Z0-9\s\-_]+$/,
      },
      prompt: {
        required: true,
        minLength: 1,
        maxLength: 10000,
      },
      model: {
        required: true,
      },
      temperature: {
        required: true,
        min: 0,
        max: 2,
        step: 0.1,
      },
      maxTokens: {
        required: true,
        min: 1,
        max: 200000,
        step: 1,
      },
    }
    
    return rules[fieldName] || {}
  }

  /**
   * Check if form can be submitted (all required fields are valid)
   */
  static canSubmit(formData: Partial<AgentEditorForm>): boolean {
    const validation = this.validateForm(formData)
    return validation.isValid
  }

  /**
   * Get all validation errors as a flat array
   */
  static getAllErrors(formData: Partial<AgentEditorForm>): string[] {
    const validation = this.validateForm(formData)
    
    if (validation.isValid || !validation.errors) {
      return []
    }
    
    const errors: string[] = []
    Object.values(validation.errors).forEach(fieldErrors => {
      errors.push(...fieldErrors)
    })
    
    return errors
  }
}
