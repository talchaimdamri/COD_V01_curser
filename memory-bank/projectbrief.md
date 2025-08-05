# Project Brief: Chain Workspace Application

## Project Overview

A lightweight, modular workspace application for creating and managing document processing chains with AI agents. The application enables users to visually design document processing workflows by connecting documents, agents, and processing steps in an interactive canvas interface.

## Core Requirements

- **Visual Chain Builder**: SVG-based canvas for creating document processing chains
- **AI Agent Integration**: Support for multiple LLM providers with streaming output
- **Document Management**: Rich text editing with version history and undo/redo
- **Event-Sourced Architecture**: Immutable event log for state management
- **Real-time Collaboration**: Multi-user support with live updates

## Technical Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js 20 + Fastify + TypeScript
- **Database**: PostgreSQL 16 + Prisma ORM
- **Testing**: Vitest (unit) + Supertest (integration) + Playwright (E2E)
- **Containerization**: Docker + Docker Compose

## Key Features

1. **Canvas Interface**: Pan/zoom SVG canvas with 8px grid
2. **Node Components**: Draggable document and agent nodes
3. **Edge Connections**: Visual connections between processing steps
4. **Document Editor**: TipTap-based rich text editor with version control
5. **Agent Configuration**: Model selection, prompt editing, tool configuration
6. **Real-time Execution**: Streaming agent output with progress tracking
7. **Version History**: Event-sourced undo/redo system

## Architecture Principles

- **TDD Workflow**: Test-first development with specialized sub-agents
- **Schema-Driven**: Zod schemas as single source of truth
- **Event Sourcing**: Immutable event log for state management
- **Modular Design**: Pluggable components and services
- **Memory Bank**: Long-term knowledge base for project continuity

## Success Criteria

- Users can create and edit document processing chains visually
- Agents can be configured and executed with real-time output
- Documents support rich text editing with version history
- System maintains data integrity through event sourcing
- Application is performant and scalable
