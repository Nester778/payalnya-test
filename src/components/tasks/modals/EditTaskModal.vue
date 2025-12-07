<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-wrapper">
      <div class="modal-content">
        <div class="modal-header">
          <div class="header-left">
            <div class="header-icon" :class="iconClass">
              <Plus v-if="mode === 'create'" :size="20" />
              <Pencil v-else :size="20" />
            </div>
            <h2>{{ mode === 'create' ? 'Create New Task' : 'Edit Task' }}</h2>
          </div>
          <button class="close-btn" @click="close">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="taskTitle">
                Task Title *
              </label>
              <input
                  id="taskTitle"
                  v-model="formData.title"
                  type="text"
                  required
                  maxlength="100"
                  placeholder="Enter task title"
              />
              <div class="char-count">{{ formData.title.length }}/100</div>
            </div>

            <div class="form-group">
              <label for="taskDescription">
                Description
              </label>
              <textarea
                  id="taskDescription"
                  v-model="formData.description"
                  rows="4"
                  maxlength="500"
                  placeholder="Enter task description (optional)"
              ></textarea>
              <div class="char-count">{{ formData.description.length }}/500</div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="taskAssignee">
                  Assignee
                </label>
                <select id="taskAssignee" v-model="formData.assignee">
                  <option value="">Unassigned</option>
                  <option v-for="assignee in assignees" :key="assignee" :value="assignee">
                    {{ assignee }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="taskStatus">
                  Status *
                </label>
                <select id="taskStatus" v-model="formData.status" required>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="taskPriority">
                  Priority *
                </label>
                <select id="taskPriority" v-model="formData.priority" required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div class="form-group">
                <label for="taskDueDate">
                  Due Date *
                </label>
                <input
                    id="taskDueDate"
                    v-model="formData.dueDate"
                    type="date"
                    required
                    :min="minDate"
                />
              </div>
            </div>

            <input type="hidden" v-model="formData.projectId" />
          </form>
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
                :disabled="!formData.title.trim() || !formData.dueDate"
                @click="handleSubmit"
            >
              {{ mode === 'create' ? 'Create Task' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { Plus, Pencil, X } from 'lucide-vue-next'
import { useTaskStore } from '@/stores/taskStore'
import type { Task, TaskFormData } from '@/types'

const props = defineProps<{
  task?: Task | null
  projectId: string
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  close: []
  save: [data: TaskFormData]
}>()

const taskStore = useTaskStore()

const formData = ref<TaskFormData>({
  title: '',
  description: '',
  assignee: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  projectId: props.projectId
})

const minDate = new Date().toISOString().split('T')[0]

const iconClass = computed(() => {
  return `icon-${props.mode}`
})

const assignees = computed(() => taskStore.assignees)

watch(() => props.task, (task) => {
  if (task) {
    formData.value = {
      title: task.title,
      description: task.description || '',
      assignee: task.assignee || '',
      status: task.status,
      priority: task.priority,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      projectId: task.projectId
    }
  } else {
    formData.value = {
      title: '',
      description: '',
      assignee: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      projectId: props.projectId
    }
  }
}, { immediate: true })

const handleSubmit = () => {
  if (!formData.value.title.trim() || !formData.value.dueDate) {
    return
  }

  const taskData: TaskFormData = {
    ...formData.value,
    projectId: props.projectId
  }

  emit('save', taskData)
}

const close = () => {
  emit('close')
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
  }
}

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
@use '@/assets/styles/main.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  @include flex-center;
  z-index: 1000;
  padding: 1rem;
  overflow: hidden;
}

.modal-wrapper {
  width: 100%;
  max-width: 600px;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

.modal-content {
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid $border-color;
  flex-shrink: 0;

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

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;

  /* Стили для скроллбара */
  scrollbar-width: thin;
  scrollbar-color: rgba($secondary-color, 0.3) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba($secondary-color, 0.3);
    border-radius: 3px;

    &:hover {
      background-color: rgba($secondary-color, 0.5);
    }
  }
}

form {
  min-height: min-content;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .form-group {
    flex: 1;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
}

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

  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 16px;
    padding-right: 2.5rem;
  }

  .char-count {
    text-align: right;
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.25rem;
  }
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid $border-color;
  flex-shrink: 0;

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
      background: darken-color($secondary-color, 10%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }

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

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-wrapper {
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-content {
    border-radius: 0;
    min-height: 100vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-footer {
    padding: 1rem;
  }
}
</style>