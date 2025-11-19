import 'dotenv/config'

export const env = {
  JWT_SECRET: process.env.JWT_SECRET || 'churchapp-secret-key',
  DATABASE_URL: process.env.DATABASE_URL || '',
}
