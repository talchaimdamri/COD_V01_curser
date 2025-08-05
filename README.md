# Chain Workspace Application

A lightweight, modular workspace application for creating and managing document processing chains with AI agents. Built with React 18 + Vite frontend, Node.js 20 + Fastify backend, PostgreSQL 16 database, and Docker containerization.

## 🚀 Features

- **Visual Chain Builder**: SVG-based canvas for creating document processing chains
- **AI Agent Integration**: Support for multiple LLM providers with streaming output
- **Document Management**: Rich text editing with version history and undo/redo
- **Event-Sourced Architecture**: Immutable event log for state management
- **Real-time Collaboration**: Multi-user support with live updates

## 🛠️ Technology Stack

### Frontend

- **React 18**: Latest React with concurrent features
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **TipTap**: Extensible rich text editor

### Backend

- **Node.js 20**: Latest LTS with improved performance
- **Fastify**: High-performance web framework
- **Prisma**: Type-safe database ORM
- **Zod**: TypeScript-first schema validation
- **JWT**: Stateless authentication

### Database & Infrastructure

- **PostgreSQL 16**: Robust relational database
- **Docker Compose**: Containerized development environment
- **Redis**: Caching and session storage
- **Event Sourcing**: Immutable event log for state management

## 📦 Installation

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chain-workspace-application
   ```

2. **Start the development environment**

   ```bash
   # Start PostgreSQL, Redis, and Adminer
   docker-compose -f docker-compose.dev.yml up -d

   # Install dependencies
   npm install

   # Set up environment variables
   cp env.example .env
   # Edit .env with your API keys

   # Run database migrations
   npm run db:migrate
   ```

3. **Start development servers**

   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start them separately
   npm run dev:ui    # Frontend on http://localhost:4000
   npm run dev:api   # Backend on http://localhost:4001
   ```

4. **Open the application**
   - Frontend: http://localhost:4000

- Backend API: http://localhost:4001
- Database GUI: http://localhost:8081

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🗄️ Database Operations

```bash
# Create new migration
npm run db:migrate:create <migration-name>

# Deploy migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset

# Open database GUI
npm run db:studio
```

## 🏗️ Development Workflow

This project uses **TDD (Test-Driven Development)** with specialized sub-agents:

1. **test-runner**: Creates failing tests first
2. **schema-keeper**: Defines data contracts
3. **ui-developer**: Implements React components
4. **backend-developer**: Implements API endpoints
5. **commit-bot**: Commits code and updates documentation

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck

# Format code
npm run format
```

## 📁 Project Structure

```
COD_V01/
├── src/                     # React frontend source
│   ├── components/          # Reusable UI components
│   │   ├── canvas/         # Canvas and node components
│   │   ├── sidebar/        # Sidebar components
│   │   └── modals/         # Modal components
│   ├── pages/              # Route components
│   ├── lib/                # Utilities and hooks
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript type definitions
├── api/                     # Node.js backend source
│   ├── routes/             # Fastify route handlers
│   ├── services/           # Business logic
│   └── db/                 # Database utilities
├── schemas/                 # Shared Zod schemas
│   ├── api/                # API request/response schemas
│   ├── database/           # Database model schemas
│   └── events/             # Event sourcing schemas
├── tests/                   # Test suites
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── prisma/                  # Database schema and migrations
├── docker/                  # Container configurations
└── docs/                   # Project documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Database
DATABASE_URL="postgresql://chainuser:chainpass@localhost:5435/chainworkspace"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# API Keys
OPENAI_API_KEY="your_openai_api_key_here"
ANTHROPIC_API_KEY="your_anthropic_api_key_here"

# Environment
NODE_ENV="development"
REDIS_URL="redis://localhost:6381"
PORT=4001
HOST="0.0.0.0"
CORS_ORIGIN="http://localhost:4000"
```

### Port Configuration

- **Frontend (Vite)**: 4000
- **Backend (Fastify)**: 4001
- **Database (PostgreSQL)**: 5435
- **Adminer (DB GUI)**: 8081
- **Redis**: 6381

## 🚀 Deployment

### Docker Deployment

```bash
# Build production images
docker-compose build

# Start production services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start
```

## 📚 Documentation

- [Project Brief](memory-bank/projectbrief.md) - High-level project description
- [Product Context](memory-bank/productContext.md) - Business requirements and user experience
- [System Patterns](memory-bank/systemPatterns.md) - Architecture patterns and technical decisions
- [Technical Context](memory-bank/techContext.md) - Technology stack and development setup
- [Active Context](memory-bank/activeContext.md) - Current work focus and decisions
- [Progress](memory-bank/progress.md) - Development progress tracking

## 🤝 Contributing

1. Follow the TDD workflow with sub-agents
2. Write tests before implementation
3. Use TypeScript for type safety
4. Follow the established code patterns
5. Update documentation in the Memory Bank

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Check the [Memory Bank](memory-bank/) documentation
- Review the [CLAUDE.md](CLAUDE.md) development guide
- Open an issue in the repository

---

**Built with ❤️ using modern web technologies and best practices.**
