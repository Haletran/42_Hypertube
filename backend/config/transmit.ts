import { defineConfig } from '@adonisjs/transmit'

export default defineConfig({
  pingInterval: '30s',
  transport: null,
  cors: {
    enabled: true,
    origin: '*'
  }
})