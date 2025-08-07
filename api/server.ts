import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'


const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
})

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:4000',
  credentials: true,
})

await fastify.register(helmet)

await fastify.register(jwt, {
  secret:
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
})



// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// API routes
fastify.get('/api/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  }
})

// Register API routes
await fastify.register(import('./routes/auth'), { prefix: '/api' })
await fastify.register(import('./routes/events'), { prefix: '/api' })
await fastify.register(import('./routes/versionHistory'), { prefix: '/api' })

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4002')
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    console.log(`🚀 Server running on http://${host}:${port}`)
    console.log(`📊 Health check: http://${host}:${port}/health`)
    console.log(`🔧 API health: http://${host}:${port}/api/health`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
