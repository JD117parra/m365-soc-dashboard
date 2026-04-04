<script setup lang="ts">
import { Shield, Loader2 } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const { login, isLoading } = useAuth()
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm">
      <!-- Card -->
      <div class="rounded-xl border border-border bg-card p-8 shadow-sm text-center space-y-6">
        <!-- Logo -->
        <div class="flex justify-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Shield class="h-8 w-8 text-primary" />
          </div>
        </div>

        <!-- Heading -->
        <div class="space-y-1">
          <h1 class="text-xl font-bold tracking-tight text-foreground">M365 SOC Dashboard</h1>
          <p class="text-sm text-muted-foreground">
            Security Operations Center powered by Microsoft Graph
          </p>
        </div>

        <!-- Sign-in button -->
        <button
          :disabled="isLoading"
          class="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          @click="login"
        >
          <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
          <template v-else>
            <!-- Microsoft logo mark -->
            <svg class="h-4 w-4" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
              <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
          </template>
          {{ isLoading ? 'Signing in…' : 'Sign in with Microsoft' }}
        </button>

        <p class="text-xs text-muted-foreground">
          Sign in with your Microsoft 365 organizational account.
          Your administrator must grant the required Graph API permissions.
        </p>
      </div>
    </div>
  </div>
</template>
