<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  ShieldAlert,
  Siren,
  UserX,
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { user, logout } = useAuth()

const sidebarOpen = ref(false)

const navItems = [
  { name: 'Dashboard',    to: '/dashboard',   icon: LayoutDashboard },
  { name: 'Alerts',       to: '/alerts',      icon: ShieldAlert },
  { name: 'Incidents',    to: '/incidents',   icon: Siren },
  { name: 'Risky Users',  to: '/risky-users', icon: UserX },
  { name: 'Secure Score', to: '/secure-score',icon: BarChart3 },
]

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <div class="flex h-screen bg-background overflow-hidden">
    <!-- Mobile sidebar backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-card border-r border-border transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Shield class="h-7 w-7 text-primary" />
        <span class="font-semibold text-foreground text-sm leading-tight">
          M365 SOC<br />Dashboard
        </span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            isActive(item.to)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          ]"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          {{ item.name }}
        </RouterLink>
      </nav>

      <!-- User / logout -->
      <div class="border-t border-border px-3 py-4">
        <div class="flex items-center justify-between px-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-foreground">
              {{ user?.name ?? user?.username ?? 'User' }}
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {{ user?.username }}
            </p>
          </div>
          <button
            class="ml-2 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Sign out"
            @click="logout"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
      <!-- Top bar (mobile) -->
      <header class="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <div class="flex items-center gap-2">
          <Shield class="h-5 w-5 text-primary" />
          <span class="font-semibold text-sm">M365 SOC</span>
        </div>
        <button
          class="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
          @click="sidebarOpen = !sidebarOpen"
        >
          <Menu v-if="!sidebarOpen" class="h-5 w-5" />
          <X v-else class="h-5 w-5" />
        </button>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
