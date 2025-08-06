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

  return {
    trackEvent,
    getEvents,
    replayEvents,
  }
} 