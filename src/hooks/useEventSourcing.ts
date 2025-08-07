import { useCallback } from 'react'

interface Event {
  id: string
  type: string
  payload: any
  timestamp: string
  streamId: string
}

interface UseEventSourcingReturn {
  trackEvent: (type: string, payload: any) => void
  getEvents: (streamId: string) => Event[]
  replayEvents: (streamId: string) => void
  createVersion: (documentId: string, content: string, description: string, isAutoSaved?: boolean) => Promise<void>
  getVersions: (documentId: string) => Promise<any[]>
  restoreVersion: (documentId: string, versionId: string) => Promise<boolean>
}

export const useEventSourcing = (): UseEventSourcingReturn => {
  // In a real implementation, this would connect to the backend API
  // For now, we'll use a simple in-memory store for development
  
  const trackEvent = useCallback((type: string, payload: any) => {
    const event: Event = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      streamId: payload.documentId || 'default',
    }

    // Store event in localStorage for persistence across page reloads
    const existingEvents = JSON.parse(localStorage.getItem('document-events') || '[]')
    existingEvents.push(event)
    localStorage.setItem('document-events', JSON.stringify(existingEvents))

    // In a real implementation, this would send the event to the backend
    console.log('Event tracked:', event)
  }, [])

  const getEvents = useCallback((streamId: string): Event[] => {
    const allEvents = JSON.parse(localStorage.getItem('document-events') || '[]')
    return allEvents.filter((event: Event) => event.streamId === streamId)
  }, [])

  const replayEvents = useCallback((streamId: string) => {
    const events = getEvents(streamId)
    console.log(`Replaying ${events.length} events for stream ${streamId}:`, events)
    
    // In a real implementation, this would reconstruct the state from events
    // For now, we'll just log the events
    events.forEach(event => {
      console.log(`Replaying event: ${event.type}`, event.payload)
    })
  }, [getEvents])

  // Create a new version
  const createVersion = useCallback(async (documentId: string, content: string, description: string, isAutoSaved: boolean = false) => {
    try {
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          content,
          description,
          isAutoSaved,
        }),
      })
      
      const data = await response.json()
      if (!data.success) {
        throw new Error('Failed to create version')
      }
      
      console.log('Version created:', data.version)
    } catch (error) {
      console.error('Error creating version:', error)
      throw error
    }
  }, [])

  // Get versions for a document
  const getVersions = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/versions?documentId=${documentId}`)
      const data = await response.json()
      
      if (data.success) {
        return data.versions
      } else {
        throw new Error('Failed to get versions')
      }
    } catch (error) {
      console.error('Error getting versions:', error)
      throw error
    }
  }, [])

  // Restore a version
  const restoreVersion = useCallback(async (documentId: string, versionId: string) => {
    try {
      const response = await fetch('/api/versions/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          versionId,
        }),
      })
      
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error restoring version:', error)
      return false
    }
  }, [])

  return {
    trackEvent,
    getEvents,
    replayEvents,
    createVersion,
    getVersions,
    restoreVersion,
  }
} 