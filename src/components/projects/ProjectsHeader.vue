<template>
  <div class="projects-header">
    <div class="header-left">
      <div class="header-icon">
        <FolderKanban :size="32" />
      </div>
      <div class="header-text">
        <h1>Projects</h1>
        <p class="subtitle">Manage all your projects in one place</p>
      </div>
    </div>
    <button class="create-btn" @click="$emit('create-project')">
      <Plus :size="20" />
      New Project
    </button>
  </div>
</template>

<script setup lang="ts">
import { FolderKanban, Plus } from 'lucide-vue-next'

defineEmits<{
  'create-project': []
}>()
</script>

<style scoped lang="scss">
@import '@/assets/styles/main.scss';

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  @include card-shadow;

  .header-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .header-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, $secondary-color, #64d8cb);
      border-radius: 12px;
      @include flex-center;

      svg {
        color: white;
      }
    }

    .header-text {
      h1 {
        font-size: 2rem;
        color: $primary-color;
        margin-bottom: 0.25rem;
        font-weight: 700;
      }

      .subtitle {
        color: #666;
        font-size: 1rem;
        opacity: 0.8;
      }
    }
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    background: $secondary-color;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: darken($secondary-color, 10%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($secondary-color, 0.3);
    }

    svg {
      flex-shrink: 0;
    }
  }
}

@media (max-width: 768px) {
  .projects-header {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;

    .header-left {
      flex-direction: column;
      text-align: center;
      gap: 1rem;

      .header-text {
        h1 {
          font-size: 1.75rem;
        }
      }
    }

    .create-btn {
      justify-content: center;
    }
  }
}
</style>