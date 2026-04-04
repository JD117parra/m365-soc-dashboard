<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { msalInstance } from '@/lib/msalConfig'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { syncAccount } = useAuth()

onMounted(async () => {
  try {
    // Handle the redirect response after a loginRedirect() call.
    // This resolves the authorization code and stores the account in MSAL cache.
    const response = await msalInstance.handleRedirectPromise()

    if (response?.account) {
      msalInstance.setActiveAccount(response.account)
    }

    // Sync the MSAL account into our reactive auth state.
    syncAccount()

    // If the user is now authenticated and is on the login page, redirect to dashboard.
    const accounts = msalInstance.getAllAccounts()
    const currentRoute = router.currentRoute.value

    if (accounts.length > 0 && currentRoute.name === 'login') {
      const redirect = currentRoute.query.redirect as string | undefined
      await router.replace(redirect ?? '/dashboard')
    }
  } catch (err) {
    console.error('MSAL redirect handling failed:', err)
  }
})
</script>

<template>
  <RouterView />
</template>
