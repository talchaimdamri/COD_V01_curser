# Technical Context: Chain Workspace Application

## Technology Stack

### Frontend Technologies

- **React 18.2+**: Latest React with concurrent features and automatic batching
- **Vite 5+**: Fast development server and build tool with HMR
- **TypeScript 5+**: Type safety and enhanced developer experience
- **Tailwind CSS 3.4+**: Utility-first CSS framework for rapid UI development
- **TipTap**: Extensible rich text editor with React integration
- **SVG**: Scalable vector graphics for canvas rendering

### Backend Technologies

- **Node.js 20+**: Latest LTS with improved performance and security
- **Fastify 4.24+**: High-performance web framework with plugin ecosystem
- **TypeScript 5+**: Type safety across the entire backend
- **Prisma 5.6+**: Type-safe database ORM with migrations
- **Zod 3.22+**: TypeScript-first schema validation
- **JWT**: Stateless authentication with httpOnly cookies

### Database & Storage

- **PostgreSQL 16**: Robust relational database with JSON support
- **Event Sourcing**: Immutable event log for state management
- **Prisma Migrations**: Type-safe database schema management
- **Snapshot Tables**: Materialized views for performance optimization
- **Document Versioning**: Complete version history with change tracking
- **Audit Trail**: All changes traceable with user attribution

### Development Tools

- **Docker + Docker Compose**: Containerized development environment
- **Vitest**: Fast unit testing framework with TypeScript support
- **Supertest**: API integration testing
- **Playwright**: End-to-end testing with browser automation
- **ESLint + Prettier**: Code quality and formatting
- **Taskmaster AI**: TDD workflow management with sub-agents

### Infrastructure

- **Docker Compose**: Local development environment orchestration
- **Adminer**: Database GUI for development
- **Port Configuration**: Frontend (4000), Backend (4001), Database (5435), Adminer (8081)

## Development Setup

### Prerequisites

- Node.js 20+ installed
- Docker and Docker Compose installed
- Git for version control
- Code editor with TypeScript support

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5435/chainworkspace

# API Keys (development)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Environment
NODE_ENV=development
```

### Port Configuration

- **Frontend (Vite)**: 4000
- **Backend (Fastify)**: 4001
- **Database (PostgreSQL)**: 5435
- **Adminer (DB GUI)**: 8081

## Technical Constraints

### Performance Requirements

- **Canvas Rendering**: Support for 100+ nodes with smooth pan/zoom
- **Real-time Updates**: Sub-second latency for collaborative features
- **Agent Execution**: Streaming response within 5 seconds
- **Database Queries**: Sub-100ms response time for event retrieval

### Scalability Considerations

- **Horizontal Scaling**: Stateless backend design for load balancing
- **Database Partitioning**: Event log partitioning by date for large datasets
- **Caching Strategy**: Redis for frequently accessed data
- **Connection Pooling**: Efficient database connection management

### Security Requirements

- **Authentication**: JWT-based stateless authentication
- **Authorization**: Role-based access control
- **Input Validation**: Zod schema validation for all inputs
- **Data Encryption**: Sensitive data encryption at rest
- **CORS Configuration**: Secure cross-origin requests

## Dependencies & Versions

### Core Dependencies

```json
{
  "react": "^18.2.0",
  "vite": "^5.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "@tiptap/react": "^2.0.0",
  "@tiptap/starter-kit": "^2.0.0",
  "fastify": "^4.24.0",
  "prisma": "^5.6.0",
  "zod": "^3.22.0",
  "@fastify/jwt": "^8.0.0"
}
```

### Development Dependencies

```json
{
  "vitest": "^1.0.0",
  "supertest": "^6.0.0",
  "@playwright/test": "^1.40.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0",
  "@types/node": "^20.0.0"
}
```

## Tool Usage Patterns

### TDD Workflow with Sub-Agents

1. **test-runner**: Creates failing tests first
2. **schema-keeper**: Defines data contracts
3. **ui-developer**: Implements React components
4. **backend-developer**: Implements API endpoints
5. **commit-bot**: Commits code and updates Memory Bank

### Development Commands

```bash
# Environment setup
docker-compose -f docker-compose.dev.yml up -d
npm install
npm run db:migrate

# Development workflow
npm run dev          # Start both frontend and backend
npm run dev:ui       # Start frontend only
npm run dev:api      # Start backend only

# Testing
npm run test:unit    # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e     # End-to-end tests

# Database operations
npm run db:migrate   # Run migrations
npm run db:reset     # Reset database (dev only)
```

### Code Quality Tools

- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Vitest**: Fast unit testing
- **Playwright**: E2E testing

## Integration Points

### LLM Provider Integration

- **OpenAI**: GPT-4, GPT-3.5-turbo models
- **Anthropic**: Claude models
- **Provider Abstraction**: Pluggable architecture for new providers
- **Streaming Support**: Real-time output streaming
- **Error Handling**: Graceful fallback and retry logic

### Database Integration

- **Prisma ORM**: Type-safe database operations
- **Event Sourcing**: Immutable event log storage
- **Migrations**: Version-controlled schema changes
- **Connection Pooling**: Efficient connection management

### Real-time Communication

- **Server-Sent Events (SSE)**: For agent output streaming
- **WebSocket**: For collaborative features (future)
- **Event Broadcasting**: Real-time canvas updates

## Deployment Considerations

### Containerization

- **Multi-stage Builds**: Optimized production images
- **Health Checks**: Container health monitoring
- **Environment Variables**: Secure configuration management
- **Volume Mounts**: Persistent data storage

### Monitoring & Logging

- **Structured Logging**: JSON format for log aggregation
- **Error Tracking**: Centralized error monitoring
- **Performance Metrics**: Response time and throughput monitoring
- **Health Endpoints**: Application health status

### Security Hardening

- **HTTPS Only**: Secure communication
- **Security Headers**: CSP, HSTS, etc.
- **Rate Limiting**: API abuse prevention
- **Input Sanitization**: XSS and injection prevention
