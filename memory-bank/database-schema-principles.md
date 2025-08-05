# Database Schema Principles: Chain Workspace Application

## Event Sourcing Architecture

### Core Principles
- **Immutable Event Log**: All state changes recorded as append-only events
- **Event Replay**: Current state reconstructed by replaying events in sequence
- **Audit Trail**: Complete history of all changes with user attribution
- **Undo/Redo**: Full time-travel capabilities through event replay
- **Stream-based Organization**: Events grouped by aggregate/stream ID

### Event Structure
```typescript
interface Event {
  id: string           // Unique event identifier (CUID)
  type: string         // Event type (e.g., "chain.created", "document.updated")
  payload: Json        // Event-specific data (JSON)
  timestamp: DateTime  // When event occurred
  userId: string?      // User who triggered the event (nullable for system events)
  streamId: string     // Aggregate/stream identifier
  version: Int         // Sequential version within stream
}
```

## Database Tables Design

### 1. Events Table (Core Event Store)
```sql
-- Primary event log for all state changes
CREATE TABLE events (
  id TEXT PRIMARY KEY,           -- CUID for unique identification
  type TEXT NOT NULL,            -- Event type for filtering/replay
  payload JSONB NOT NULL,        -- Event data with JSON indexing
  timestamp TIMESTAMP NOT NULL,  -- When event occurred
  userId TEXT,                   -- User who triggered (nullable)
  streamId TEXT NOT NULL,        -- Aggregate identifier
  version INTEGER NOT NULL,      -- Sequential version in stream
  
  -- Indexes for performance
  INDEX idx_stream_version (streamId, version),
  INDEX idx_timestamp (timestamp),
  INDEX idx_type (type),
  INDEX idx_user (userId)
);
```

### 2. Chain Snapshots (Performance Optimization)
```sql
-- Materialized views for fast chain state access
CREATE TABLE chain_snapshots (
  id TEXT PRIMARY KEY,           -- Chain ID
  name TEXT NOT NULL,            -- Chain name
  canvasState JSONB NOT NULL,    -- Current canvas state
  metadata JSONB,                -- Additional chain metadata
  lastEventId TEXT NOT NULL,     -- Last event that updated this snapshot
  lastEventVersion INTEGER NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  
  -- Foreign key to events
  FOREIGN KEY (lastEventId) REFERENCES events(id)
);
```

### 3. Document Snapshots (Performance Optimization)
```sql
-- Materialized views for fast document access
CREATE TABLE document_snapshots (
  id TEXT PRIMARY KEY,           -- Document ID
  title TEXT NOT NULL,           -- Document title
  content TEXT NOT NULL,         -- Current document content
  version INTEGER NOT NULL,      -- Current version number
  metadata JSONB,                -- Document metadata
  lastEventId TEXT NOT NULL,     -- Last event that updated this snapshot
  lastEventVersion INTEGER NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  
  -- Foreign key to events
  FOREIGN KEY (lastEventId) REFERENCES events(id)
);
```

### 4. Agent Snapshots (Performance Optimization)
```sql
-- Materialized views for fast agent access
CREATE TABLE agent_snapshots (
  id TEXT PRIMARY KEY,           -- Agent ID
  name TEXT NOT NULL,            -- Agent name
  prompt TEXT NOT NULL,          -- Agent prompt/instructions
  model TEXT NOT NULL,           -- LLM model identifier
  tools JSONB,                   -- Available tools configuration
  metadata JSONB,                -- Agent metadata
  lastEventId TEXT NOT NULL,     -- Last event that updated this snapshot
  lastEventVersion INTEGER NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  
  -- Foreign key to events
  FOREIGN KEY (lastEventId) REFERENCES events(id)
);
```

### 5. Document Versions (Version History)
```sql
-- Complete version history for documents
CREATE TABLE document_versions (
  id TEXT PRIMARY KEY,           -- Version ID
  documentId TEXT NOT NULL,      -- Document ID
  content TEXT NOT NULL,         -- Document content at this version
  version INTEGER NOT NULL,      -- Version number
  changeDescription TEXT,        -- Description of changes
  createdBy TEXT,                -- User who created this version
  createdAt TIMESTAMP NOT NULL,
  
  -- Foreign key to documents
  FOREIGN KEY (documentId) REFERENCES document_snapshots(id),
  -- Unique constraint on document + version
  UNIQUE (documentId, version)
);
```

### 6. Edges (Node Connections)
```sql
-- Visual connections between nodes in canvas
CREATE TABLE edges (
  id TEXT PRIMARY KEY,           -- Edge ID
  sourceId TEXT NOT NULL,        -- Source node ID
  targetId TEXT NOT NULL,        -- Target node ID
  type TEXT NOT NULL,            -- Edge type (e.g., "document_to_agent")
  metadata JSONB,                -- Edge metadata (position, style, etc.)
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  
  -- Ensure source and target are different
  CHECK (sourceId != targetId)
);
```

### 7. Users (Authentication)
```sql
-- User accounts for authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- User ID
  email TEXT UNIQUE NOT NULL,    -- User email
  name TEXT NOT NULL,            -- User display name
  passwordHash TEXT NOT NULL,    -- Hashed password
  role TEXT NOT NULL DEFAULT 'user', -- User role
  metadata JSONB,                -- User metadata
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);
```

### 8. Sessions (Authentication)
```sql
-- User sessions for JWT token management
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,           -- Session ID
  userId TEXT NOT NULL,          -- User ID
  token TEXT UNIQUE NOT NULL,    -- JWT token
  expiresAt TIMESTAMP NOT NULL,  -- Token expiration
  metadata JSONB,                -- Session metadata
  createdAt TIMESTAMP NOT NULL,
  
  -- Foreign key to users
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## Indexing Strategy

### Performance Indexes
```sql
-- Events table indexes
CREATE INDEX idx_events_stream_version ON events(streamId, version);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_user ON events(userId);

-- Snapshot table indexes
CREATE INDEX idx_chain_snapshots_name ON chain_snapshots(name);
CREATE INDEX idx_document_snapshots_title ON document_snapshots(title);
CREATE INDEX idx_agent_snapshots_name ON agent_snapshots(name);

-- Edge table indexes
CREATE INDEX idx_edges_source ON edges(sourceId);
CREATE INDEX idx_edges_target ON edges(targetId);
CREATE INDEX idx_edges_type ON edges(type);

-- User and session indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user ON sessions(userId);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expiresAt);
```

## Event Types and Payloads

### Chain Events
```typescript
// chain.created
{
  "name": "string",
  "description": "string",
  "metadata": "object"
}

// chain.updated
{
  "name": "string?",
  "description": "string?",
  "metadata": "object?"
}

// chain.canvas_updated
{
  "canvasState": "object",
  "viewport": "object"
}
```

### Document Events
```typescript
// document.created
{
  "title": "string",
  "content": "string",
  "metadata": "object"
}

// document.updated
{
  "title": "string?",
  "content": "string",
  "changeDescription": "string"
}

// document.deleted
{
  "reason": "string?"
}
```

### Agent Events
```typescript
// agent.created
{
  "name": "string",
  "prompt": "string",
  "model": "string",
  "tools": "array",
  "metadata": "object"
}

// agent.updated
{
  "name": "string?",
  "prompt": "string?",
  "model": "string?",
  "tools": "array?",
  "metadata": "object?"
}

// agent.executed
{
  "input": "string",
  "output": "string",
  "duration": "number",
  "tokens": "number",
  "metadata": "object"
}
```

### Edge Events
```typescript
// edge.created
{
  "sourceId": "string",
  "targetId": "string",
  "type": "string",
  "metadata": "object"
}

// edge.updated
{
  "metadata": "object"
}

// edge.deleted
{
  "reason": "string?"
}
```

## Governance and Constraints

### Data Integrity
- **Foreign Key Constraints**: All relationships properly defined
- **Unique Constraints**: Prevent duplicate entries where appropriate
- **Check Constraints**: Validate data at database level
- **Cascade Rules**: Define behavior for related record updates/deletes

### Security Considerations
- **User Attribution**: All events can be traced to users
- **Audit Trail**: Complete history of all changes
- **Data Encryption**: Sensitive fields encrypted at rest (future)
- **Access Control**: Role-based permissions on data access

### Performance Considerations
- **Indexing Strategy**: Optimized for common query patterns
- **Partitioning**: Events table partitioned by date for large datasets
- **Snapshot Tables**: Materialized views for fast state access
- **Connection Pooling**: Efficient database connection management

### Scalability Considerations
- **Horizontal Scaling**: Stateless design supports load balancing
- **Read Replicas**: Separate read/write operations
- **Caching Strategy**: Redis for frequently accessed data
- **Event Batching**: Batch multiple events in single transaction

## Migration Strategy

### Version Control
- **Prisma Migrations**: Type-safe schema versioning
- **Rollback Support**: Ability to revert schema changes
- **Data Preservation**: Maintain data integrity during migrations
- **Testing**: Validate migrations in development environment

### Deployment Considerations
- **Zero Downtime**: Schema changes without service interruption
- **Backup Strategy**: Complete backups before major changes
- **Monitoring**: Track migration performance and success
- **Rollback Plan**: Clear procedures for failed migrations 