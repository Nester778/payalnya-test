<template>
  <div class="modal-overlay" @click.self="handleOverlayClick">
    <div class="modal-content">
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon" :class="iconClass">
            <AlertCircle v-if="type === 'danger'" :size="20" />
            <AlertTriangle v-else-if="type === 'warning'" :size="20" />
            <HelpCircle v-else :size="20" />
          </div>
          <h2>{{ title }}</h2>
        </div>
        <button class="close-btn" @click="handleCancel">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <p v-if="message" class="modal-message">{{ message }}</p>

        <div v-if="details" class="modal-details">
          <p>{{ details }}</p>
        </div>

        <slot name="content"></slot>

        <div v-if="requiresConfirmationText" class="confirmation-input">
          <label :for="`confirmation-input-${modalId}`">
            Type "<strong>{{ confirmationText }}</strong>" to confirm:
          </label>
          <input
              :id="`confirmation-input-${modalId}`"
              v-model="typedConfirmation"
              type="text"
              :placeholder="`Type ${confirmationText}`"
          @keyup.enter="handleConfirm"
          />
          <div v-if="typedConfirmation && !isConfirmationValid" class="error-message">
            Text doesn't match. Please type exactly "{{ confirmationText }}"
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-actions">
          <button
              type="button"
              class="btn-secondary"
              @click="handleCancel"
              :disabled="isLoading"
          >
            <span v-if="cancelLoading">
              <Loader2 class="loading-spinner" :size="16" />
              {{ cancelLoadingText || 'Cancelling...' }}
            </span>
            <span v-else>
              {{ cancelText || 'Cancel' }}
            </span>
          </button>

          <button
              type="button"
              class="btn-primary"
              :class="{ 'btn-danger': type === 'danger', 'btn-warning': type === 'warning' }"
              @click="handleConfirm"
              :disabled="(requiresConfirmationText && !isConfirmationValid) || isLoading"
          >
            <span v-if="isLoading">
              <Loader2 class="loading-spinner" :size="16" />
              {{ loadingText || confirmText || 'Confirming...' }}
            </span>
            <span v-else>
              {{ confirmText || 'Confirm' }}
            </span>
          </button>
        </div>

        <div v-if="$slots.actions" class="extra-actions">
          <slot name="actions"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { X, AlertCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-vue-next'

interface Props {
  title: string
  message?: string
  details?: string
  confirmText?: string
  cancelText?: string
  type?: 'default' | 'danger' | 'warning'
  requiresConfirmationText?: boolean
  confirmationText?: string
  loadingText?: string
  cancelLoadingText?: string
  isLoading?: boolean
  cancelLoading?: boolean
  preventClose?: boolean
  closeOnOverlayClick?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  requiresConfirmationText: false,
  confirmationText: 'DELETE',
  closeOnOverlayClick: true,
  preventClose: false,
  isLoading: false,
  cancelLoading: false
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

const typedConfirmation = ref('')
const modalId = ref(`modal-${Math.random().toString(36).substr(2, 9)}`)

const iconClass = computed(() => {
  return `icon-${props.type}`
})

const isConfirmationValid = computed(() => {
  if (!props.requiresConfirmationText) return true
  return typedConfirmation.value === props.confirmationText
})

const handleConfirm = () => {
  if (props.requiresConfirmationText && !isConfirmationValid.value) return
  emit('confirm')
}

const handleCancel = () => {
  if (!props.preventClose) {
    emit('cancel')
  }
}

const handleClose = () => {
  if (!props.preventClose) {
    emit('close')
  }
}

const handleOverlayClick = () => {
  if (props.closeOnOverlayClick && !props.preventClose) {
    handleClose()
  }
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !props.preventClose) {
    handleClose()
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

typedConfirmation.value = ''
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

    &.icon-danger {
      background: rgba($danger-color, 0.1);
      color: $danger-color;
    }

    &.icon-warning {
      background: rgba($warning-color, 0.1);
      color: $warning-color;
    }

    &.icon-default {
      background: rgba($secondary-color, 0.1);
      color: $secondary-color;
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

  .modal-message {
    margin: 0 0 1.5rem 0;
    color: $primary-color;
    font-size: 1.1rem;
    line-height: 1.6;
  }

  .modal-details {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-left: 3px solid $border-color;

    p {
      margin: 0;
      font-size: 0.95rem;
      color: #666;
    }
  }

  .confirmation-input {
    margin-top: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 500;
      color: $primary-color;
      font-size: 0.95rem;

      strong {
        color: $danger-color;
      }
    }

    input {
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

      &:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
      }
    }

    .error-message {
      color: $danger-color;
      font-size: 0.875rem;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &::before {
        content: '⚠';
      }
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
    margin-bottom: 1rem;
  }

  .extra-actions {
    display: flex;
    justify-content: center;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    @include flex-center;
    gap: 0.5rem;
    min-width: 120px;

    .loading-spinner {
      animation: spin 1s linear infinite;
    }
  }

  .btn-secondary {
    background: #f0f0f0;
    color: #666;

    &:hover:not(:disabled) {
      background: #e0e0e0;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    &.btn-danger {
      background: $danger-color;

      &:hover:not(:disabled) {
        background: darken-color($danger-color, 10%);
      }
    }

    &.btn-warning {
      background: $warning-color;

      &:hover:not(:disabled) {
        background: darken-color($warning-color, 10%);
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

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