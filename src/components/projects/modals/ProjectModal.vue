<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon" :class="iconClass">
            <FolderPlus v-if="mode === 'create'" :size="20" />
            <FolderEdit v-else :size="20" />
          </div>
          <h2>{{ mode === 'create' ? 'Create New Project' : 'Edit Project' }}</h2>
        </div>
        <button class="close-btn" @click="close">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="projectName">
            Project Name *
          </label>
          <input
              id="projectName"
              v-model="formData.name"
              type="text"
              required
              maxlength="100"
              placeholder="Enter project name"
          />
          <div class="char-count">{{ formData.name.length }}/100</div>
        </div>

        <div class="form-group">
          <label for="projectDescription">
            Description
          </label>
          <textarea
              id="projectDescription"
              v-model="formData.description"
              rows="4"
              maxlength="500"
              placeholder="Enter project description (optional)"
          ></textarea>
          <div class="char-count">{{ formData.description.length }}/500</div>
        </div>

        <div class="form-group" v-if="mode === 'edit'">
          <label for="projectStatus">
            Status
          </label>
          <div class="status-select">
            <select id="projectStatus" v-model="formData.status">
              <option value="To do">To Do</option>
              <option value="In progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-actions">
            <button
                type="button"
                class="btn-secondary"
                @click="close"
            >
              {{ mode === 'create' ? 'Cancel' : 'Discard Changes' }}
            </button>

            <button
                type="submit"
                class="btn-primary"
                :disabled="!formData.name.trim()"
            >
              {{ mode === 'create' ? 'Create Project' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { FolderPlus, FolderEdit, X } from 'lucide-vue-next'
import type { Project, ProjectFormData } from '@/types'

const props = defineProps<{
  project?: Project | null
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  close: []
  save: [data: ProjectFormData]
}>()

const formData = ref<ProjectFormData>({
  name: '',
  description: '',
  status: 'To do'
})

const iconClass = computed(() => {
  return `icon-${props.mode}`
})

watch(() => props.project, (project) => {
  if (project) {
    formData.value = {
      name: project.name,
      description: project.description || '',
      status: project.status
    }
  } else {
    formData.value = {
      name: '',
      description: '',
      status: 'To do'
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  emit('save', formData.value)
}

const close = () => {
  emit('close')
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
  }
}

import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/main.scss';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  @include flex-center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid $border-color;

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    @include flex-center;

    &.icon-create {
      background: rgba($secondary-color, 0.1);
      color: $secondary-color;
    }

    &.icon-edit {
      background: rgba($warning-color, 0.1);
      color: $warning-color;
    }
  }

  h2 {
    margin: 0;
    color: $primary-color;
    font-size: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.3s ease;
    @include flex-center;

    &:hover {
      background: #f0f0f0;
    }
  }
}

form {
  padding: 1.5rem;

  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: $primary-color;

      &::after {
        content: ' *';
        color: $danger-color;
        opacity: 0.8;
      }
    }

    input, textarea, select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid $border-color;
      border-radius: 6px;
      font-size: 1rem;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: $secondary-color;
        box-shadow: 0 0 0 3px rgba($secondary-color, 0.1);
      }
    }

    textarea {
      resize: vertical;
      min-height: 100px;
    }

    .status-select {
      position: relative;

      select {
        appearance: none;
        padding-right: 2.5rem;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 16px;
      }
    }

    .char-count {
      text-align: right;
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.25rem;
    }
  }
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid $border-color;

  .footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;
  }

  .btn-secondary {
    background: #f0f0f0;
    color: #666;

    &:hover {
      background: #e0e0e0;
    }
  }

  .btn-primary {
    background: $secondary-color;
    color: white;

    &:hover:not(:disabled) {
      background: darken($secondary-color, 10%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .modal-header {
    padding: 1.25rem;

    h2 {
      font-size: 1.25rem;
    }
  }

  .modal-body {
    padding: 1.25rem;
  }

  .modal-footer {
    padding: 1.25rem;

    .footer-actions {
      flex-direction: column-reverse;

      button {
        min-width: 100%;
      }
    }
  }
}
</style>