<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ShieldOff } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="text-center space-y-5">
      <div class="flex justify-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShieldOff class="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      <div>
        <h1 class="text-5xl font-bold tracking-tight text-foreground">404</h1>
        <p class="mt-2 text-lg text-muted-foreground">Page not found</p>
        <p class="mt-1 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
        @click="router.push('/dashboard')"
      >
        Back to Dashboard
      </button>
    </div>
  </div>
</template>
