<template>
  <div class="app-layout">
    <!-- Навигационная панель -->
    <nav class="navbar">
      <div class="navbar-brand">
        <router-link to="/" class="logo">
          <FolderKanban :size="24" />
          <span>Project Manager</span>
        </router-link>
      </div>

      <div class="navbar-actions">
        <div class="user-menu">
          <CircleUser :size="24" />
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="content-wrapper">
        <div v-if="showBreadcrumbs" class="breadcrumbs">
          <div class="breadcrumb-item" v-for="(crumb, index) in normalizedBreadcrumbs" :key="crumb.path">
            <router-link v-if="index < normalizedBreadcrumbs.length - 1" :to="crumb.path" class="crumb-link">
              {{ crumb.name }}
            </router-link>
            <span v-else class="crumb-current">
              {{ crumb.name }}
            </span>
            <ChevronRight v-if="index < normalizedBreadcrumbs.length - 1" :size="12" class="crumb-separator" />
          </div>
        </div>

        <div class="page-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FolderKanban, CircleUser, ChevronRight } from 'lucide-vue-next'

const route = useRoute()

const normalizedBreadcrumbs = computed(() => {
  const crumbs: Array<{ name: string; path: string }> = []

  if (route.path !== '/') {
    crumbs.push({ name: 'Projects', path: '/' })
  }

  if (route.name === 'ProjectDetails' && route.params.id) {
    const projectName = route.meta.projectName as string || 'Project Details'
    crumbs.push({
      name: projectName,
      path: route.path
    })
  }

  else if (route.name === 'Dashboard') {
    crumbs.push({
      name: 'Dashboard',
      path: route.path
    })
  }

  else if (route.path !== '/' && route.meta.title) {
    crumbs.push({
      name: route.meta.title as string,
      path: route.path
    })
  }

  const uniqueCrumbs = crumbs.filter((crumb, index, self) =>
      index === self.findIndex((c) => c.path === crumb.path)
  )

  return uniqueCrumbs
})

const showBreadcrumbs = computed(() => {
  return normalizedBreadcrumbs.value.length > 1 ||
      (normalizedBreadcrumbs.value.length === 1 && normalizedBreadcrumbs.value[0].path !== '/')
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/main.scss';

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 64px;
  background: linear-gradient(135deg, $primary-color, darken($primary-color, 5%));
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  .navbar-brand {
    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: white;
      font-size: 1.25rem;
      font-weight: 600;

      svg {
        color: $secondary-color;
      }

      &:hover {
        opacity: 0.9;
      }
    }
  }

  .navbar-menu {
    flex: 1;
    display: flex;
    justify-content: center;

    .current-page {
      .page-title {
        font-size: 1.25rem;
        font-weight: 500;
        color: white;
        opacity: 0.9;
      }
    }
  }

  .navbar-actions {
    display: flex;
    align-items: center;
    gap: 1rem;

    .user-menu {
      cursor: pointer;
      color: rgba(255, 255, 255, 0.8);
      transition: all 0.3s ease;

      &:hover {
        color: white;
      }
    }
  }
}

.main-content {
  flex: 1;
  background: #f5f7fa;
  padding: 1.5rem;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .crumb-link {
      color: #666;
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.3s ease;

      &:hover {
        color: $primary-color;
        text-decoration: underline;
      }
    }

    .crumb-current {
      color: $primary-color;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .crumb-separator {
      color: #999;
      opacity: 0.6;
    }
  }
}

.page-content {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .navbar {
    padding: 0 1rem;

    .logo span {
      display: none;
    }

    .navbar-menu .current-page .page-title {
      font-size: 1.1rem;
    }
  }
}

@media (max-width: 768px) {
  .navbar {
    .navbar-menu {
      display: none;
    }
  }

  .main-content {
    padding: 1rem;
  }

  .breadcrumbs {
    padding: 0.5rem;
    font-size: 0.85rem;
  }
}
</style>