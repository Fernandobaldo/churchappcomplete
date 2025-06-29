import 'dotenv/config'

export const env = {
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
  DATABASE_URL: process.env.DATABASE_URL || '',
}
