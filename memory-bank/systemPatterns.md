# System Patterns: Chain Workspace Application

## Architecture Overview

### Event-Sourced State Management

The application uses event sourcing as the primary state management pattern:

- **Immutable Event Log**: All state changes are recorded as events
- **Event Replay**: Current state is reconstructed by replaying events
- **Undo/Redo**: Complete history allows for time-travel debugging
- **Audit Trail**: All changes are permanently recorded and traceable

### Component Architecture

```
Frontend (React) ←→ Backend (Fastify) ←→ Database (PostgreSQL)
     ↓                    ↓                    ↓
  Canvas UI           Event Store         Event Log
  Node Components     Agent Engine        Schema Migrations
  Document Editor     JWT Auth           Prisma ORM
```

## Key Design Patterns

### 1. TDD Workflow with Sub-Agents

- **test-runner**: Creates failing tests first (TDD methodology)
- **schema-keeper**: Defines and maintains data contracts
- **ui-developer**: Implements React components
- **backend-developer**: Implements API endpoints
- **commit-bot**: Commits code, runs tests, updates Memory Bank

### 2. Schema-Driven Development

- **Zod Schemas**: Single source of truth for data validation
- **API Contracts**: Shared schemas between frontend and backend
- **Database Models**: Prisma schema derived from Zod definitions
- **Event Schemas**: Type-safe event definitions for event sourcing

### 3. Modular Canvas Architecture

- **SVG Rendering**: Scalable vector graphics for canvas interface
- **Node Components**: Pluggable node types (Document, Agent, etc.)
- **Edge System**: Visual connection management between nodes
- **State Synchronization**: Real-time updates between canvas and backend

### 4. Agent Integration Pattern

- **Provider Abstraction**: Pluggable LLM providers (OpenAI, Anthropic, etc.)
- **Streaming Support**: Real-time output streaming via SSE/WebSocket
- **Tool Integration**: Extensible tool system for agent capabilities
- **Execution Engine**: Isolated agent execution with error handling

## Technical Decisions

### Frontend Technology Choices

- **React 18**: Latest React with concurrent features
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **TipTap**: Extensible rich text editor

### Backend Technology Choices

- **Node.js 20**: Latest LTS with performance improvements
- **Fastify**: High-performance web framework
- **Prisma**: Type-safe database ORM
- **PostgreSQL 16**: Robust relational database
- **JWT**: Stateless authentication

### Development Workflow

- **Docker Compose**: Local development environment
- **Vitest**: Fast unit testing framework
- **Supertest**: API integration testing
- **Playwright**: End-to-end testing
- **ESLint + Prettier**: Code quality and formatting

## Critical Implementation Paths

### 1. Event Sourcing Implementation

```typescript
// Event structure
interface Event {
  id: string           // Unique event identifier (CUID)
  type: string         // Event type (e.g., "chain.created", "document.updated")
  payload: Json        // Event-specific data (JSON)
  timestamp: DateTime  // When event occurred
  userId: string?      // User who triggered the event (nullable for system events)
  streamId: string     // Aggregate/stream identifier
  version: Int         // Sequential version within stream
}

// Event store interface
interface EventStore {
  append(events: Event[]): Promise<void>
  getEvents(streamId: string): Promise<Event[]>
  replay(streamId: string): Promise<State>
  getSnapshot(streamId: string): Promise<Snapshot?>
  createSnapshot(streamId: string): Promise<void>
}
```

### Database Schema Design

The application uses a comprehensive event-sourced database schema with the following tables:

#### Core Tables
- **Events**: Primary event log for all state changes
- **Chain Snapshots**: Materialized views for fast chain state access
- **Document Snapshots**: Materialized views for fast document access
- **Agent Snapshots**: Materialized views for fast agent access
- **Document Versions**: Complete version history for documents
- **Edges**: Visual connections between nodes in canvas
- **Users**: User accounts for authentication
- **Sessions**: User sessions for JWT token management

#### Key Features
- **Immutable Event Log**: All state changes recorded as append-only events
- **Performance Optimization**: Snapshot tables for fast state access
- **Version Control**: Complete document version history
- **Audit Trail**: All events traceable to users
- **Scalability**: Indexed for common query patterns

### 2. Canvas State Management

```typescript
// Canvas state structure
interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  viewport: Viewport
  selection: string[]
}

// State synchronization
interface StateSync {
  updateState(update: Partial<CanvasState>): void
  subscribe(callback: (state: CanvasState) => void): () => void
}
```

### 3. Agent Execution Engine

```typescript
// Agent execution interface
interface AgentEngine {
  execute(agent: Agent, input: any): Promise<ExecutionResult>
  stream(agent: Agent, input: any): AsyncIterable<string>
}

// Execution result
interface ExecutionResult {
  output: string
  metadata: Record<string, any>
  duration: number
  tokens: number
}
```

## Component Relationships

### Frontend Component Hierarchy

```
App
├── Canvas
│   ├── CanvasGrid
│   ├── NodeContainer
│   │   ├── DocumentNode
│   │   └── AgentNode
│   └── EdgeContainer
├── Sidebar
│   ├── ObjectLibrary
│   └── Inspector
└── Modals
    ├── DocumentEditor
    └── AgentConfig
```

### Backend Service Architecture

```
Fastify Server
├── Auth Routes (JWT)
├── Events API
│   ├── Event Store Service
│   └── Event Replay Service
├── Agents API
│   ├── Agent Engine
│   └── LLM Provider Adapters
└── Documents API
    ├── Document Service
    └── Version Control Service
```

## Performance Considerations

### Frontend Optimization

- **Virtual Scrolling**: For large node lists
- **Canvas Clipping**: Only render visible nodes
- **Debounced Updates**: Prevent excessive re-renders
- **Lazy Loading**: Load components on demand

### Backend Optimization

- **Event Batching**: Batch multiple events in single transaction
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for frequently accessed data
- **Streaming**: Real-time updates without polling

### Database Optimization

- **Indexed Queries**: Fast event retrieval by stream ID
- **Partitioning**: Partition events by date for large datasets
- **Read Replicas**: Separate read/write operations
- **Connection Limits**: Prevent connection exhaustion

## Security Patterns

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication
- **Role-Based Access**: User roles and permissions
- **API Rate Limiting**: Prevent abuse
- **Input Validation**: Zod schema validation

### Data Protection

- **Event Encryption**: Sensitive data encryption
- **Audit Logging**: Complete action tracking
- **Data Sanitization**: Prevent injection attacks
- **CORS Configuration**: Secure cross-origin requests
