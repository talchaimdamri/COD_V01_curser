# Active Context: Chain Workspace Application

## Current Work Focus

### Phase: Core Infrastructure Setup

**Current Task**: Task 4 - Build Fastify Backend API with JWT Authentication
**Status**: Ready to start
**Priority**: High

### Immediate Goals

1. Set up monorepo structure with React 18 + Vite frontend
2. Configure Node.js 20 + Fastify backend
3. Initialize PostgreSQL 16 database with Docker
4. Establish development environment with proper tooling

## Recent Decisions & Considerations

### Architecture Decisions

- **Monorepo Structure**: Single repository for frontend, backend, and shared code
- **Event Sourcing**: Immutable event log for state management and undo/redo
- **TDD Workflow**: Test-first development with specialized sub-agents
- **Schema-Driven**: Zod schemas as single source of truth

### Technology Choices

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js 20 + Fastify + TypeScript + Prisma
- **Database**: PostgreSQL 16 with event sourcing
- **Testing**: Vitest (unit) + Supertest (integration) + Playwright (E2E)
- **Containerization**: Docker + Docker Compose

### Development Workflow

- **Taskmaster AI**: TDD workflow management with sub-agents
- **Memory Bank**: Long-term knowledge base for project continuity
- **Sub-Agents**: test-runner, schema-keeper, ui-developer, backend-developer, commit-bot

## Next Steps

### Immediate Actions (Task 4)

1. **JWT Authentication Setup**: Implement JWT token generation and validation
2. **User Management Routes**: Create user registration, login, and profile endpoints
3. **Authentication Middleware**: Protect routes with JWT verification
4. **Error Handling**: Implement comprehensive error handling and validation
5. **API Documentation**: Add OpenAPI/Swagger documentation

### Upcoming Tasks

- **Task 5**: Create SVG Canvas Component with Pan/Zoom/Grid
- **Task 6**: Implement Document and Agent Node Components
- **Task 7**: Build Edge Connection System

## Active Patterns & Preferences

### Code Organization

- **Shared Schemas**: Zod schemas in `schemas/` directory
- **Component Structure**: React components in `src/components/`
- **API Routes**: Fastify routes in `api/routes/`
- **Database**: Prisma schema and migrations in `prisma/`

### Development Patterns

- **TDD First**: Write tests before implementation
- **Schema Validation**: All data validated with Zod
- **Type Safety**: TypeScript throughout the stack
- **Event Sourcing**: All state changes as events

### Testing Strategy

- **Unit Tests**: Vitest for individual components and functions
- **Integration Tests**: Supertest for API endpoints
- **E2E Tests**: Playwright for user workflows
- **Test Coverage**: Aim for 80%+ coverage

## Current Challenges & Considerations

### Technical Challenges

- **Event Sourcing Complexity**: Need to design efficient event replay system
- **Real-time Updates**: Canvas state synchronization between users
- **Agent Integration**: Pluggable LLM provider architecture
- **Performance**: Canvas rendering with 100+ nodes

### Development Challenges

- **Learning Curve**: Team needs to understand event sourcing patterns
- **Testing Complexity**: E2E testing for canvas interactions
- **State Management**: Complex state synchronization between frontend and backend

## Important Learnings

### Project Insights

- **Event Sourcing Benefits**: Complete audit trail and undo/redo capabilities
- **TDD Workflow**: Faster development with fewer bugs
- **Schema-Driven**: Type safety and validation across the stack
- **Memory Bank**: Essential for maintaining project context

### Technical Insights

- **React 18 Features**: Concurrent features for better performance
- **Fastify Performance**: High-performance web framework
- **Prisma Type Safety**: Excellent TypeScript integration
- **Docker Development**: Consistent environment across team

## Active Decisions

### Current Implementation Decisions

- **Port Configuration**: Frontend (4000), Backend (4001), Database (5435), Adminer (8081)
- **Package Structure**: Monorepo with shared dependencies
- **Development Environment**: Docker Compose for local development
- **Testing Framework**: Vitest for fast unit testing

### Pending Decisions

- **Authentication Strategy**: JWT with httpOnly cookies vs. session-based
- **Real-time Communication**: SSE vs. WebSocket for agent streaming
- **Caching Strategy**: Redis vs. in-memory caching
- **Deployment Strategy**: Docker containers vs. serverless

## Project Evolution

### Initial Setup Phase

- ✅ Project requirements defined
- ✅ Technology stack selected
- ✅ Taskmaster AI initialized with comprehensive task list
- ✅ Memory Bank structure created
- 🔄 Project structure initialization (in progress)

### Next Phase: Core Infrastructure

- Database schema design and implementation
- Core Zod schemas and validation
- Backend API foundation
- Basic frontend setup

### Future Phases

- Canvas component development
- Agent integration system
- Document editor implementation
- Real-time collaboration features
