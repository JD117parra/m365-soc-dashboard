import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Chart, registerables } from 'chart.js'

import router from './router'
import App from './App.vue'
import './index.css'

import { msalInstance } from './lib/msalConfig'

// Register all Chart.js components globally (scales, elements, plugins, etc.)
Chart.register(...registerables)

async function bootstrap() {
  // MSAL v3 requires initialize() to be called and awaited before any other
  // MSAL method is used. This processes any redirect response in the URL.
  await msalInstance.initialize()

  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err)
})
