import { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await (request as any).jwtVerify()
  } catch (err) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing token',
    })
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await (request as any).jwtVerify()
  } catch (err) {
    // For MVP, allow requests without authentication
    // In production, this would be more restrictive
    (request as any).user = null
  }
} 