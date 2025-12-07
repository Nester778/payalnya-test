<template>
  <div
      class="task-card"
      @click="handleCardClick"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
  >
    <div class="task-card-header">
      <span class="task-priority" :class="`priority-${task.priority}`">
        {{ task.priority }}
      </span>
      <div class="task-actions" v-if="isHovered">
        <button @click.stop="$emit('edit', task)" class="task-action-btn">
          <Pencil :size="12" />
        </button>
        <button @click.stop="$emit('delete', task)" class="task-action-btn delete">
          <Trash2 :size="12" />
        </button>
      </div>
    </div>

    <h4 class="task-title">{{ task.title }}</h4>

    <p class="task-description" v-if="task.description">
      {{ truncateText(task.description, 80) }}
    </p>

    <div class="task-footer">
      <div class="assignee" v-if="task.assignee">
        <User :size="12" />
        <span>{{ task.assignee }}</span>
      </div>

      <div class="due-date" :class="{ overdue: isOverdue(task.dueDate) }">
        <Calendar :size="12" />
        <span>{{ formatDate(task.dueDate) }}</span>
      </div>
    </div>

    <div class="hover-border" :class="{ visible: isHovered }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Pencil, Trash2, User, Calendar } from 'lucide-vue-next'
import type { Task } from '@/types'

interface Props {
  task: Task
}

const props = defineProps<Props>()

defineEmits<{
  edit: [task: Task]
  delete: [task: Task]
}>()

const isHovered = ref(false)

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const isOverdue = (dateString: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(dateString)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
}

const handleCardClick = () => {

}
</script>

<style scoped lang="scss">
@use '@/assets/styles/main.scss' as *;

.task-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: grab;
  transition: all 0.3s ease;
  border: 1px solid $border-color;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    cursor: grabbing;
  }

  .task-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;

    .task-priority {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      text-transform: uppercase;

      &.priority-low {
        background: rgba(#51cf66, 0.1);
        color: #51cf66;
      }

      &.priority-medium {
        background: rgba(#ffd43b, 0.1);
        color: #e67700;
      }

      &.priority-high {
        background: rgba(#ff6b6b, 0.1);
        color: #ff6b6b;
      }

      &.priority-critical {
        background: rgba(#fa5252, 0.1);
        color: #fa5252;
      }
    }

    .task-actions {
      display: flex;
      gap: 0.25rem;
      align-items: center;

      .task-action-btn {
        width: 24px;
        height: 24px;
        background: none;
        border: none;
        border-radius: 4px;
        color: #666;
        cursor: pointer;
        @include flex-center;
        transition: all 0.3s ease;

        &:hover {
          background: #f0f0f0;
        }

        &.delete:hover {
          color: $danger-color;
          background: rgba($danger-color, 0.1);
        }
      }
    }
  }

  .task-title {
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: $primary-color;
    line-height: 1.3;
  }

  .task-description {
    margin: 0 0 0.75rem 0;
    font-size: 0.8rem;
    color: #666;
    line-height: 1.4;
  }

  .task-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;

    .assignee, .due-date {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: #666;

      &.overdue {
        color: $danger-color;
        font-weight: 500;
      }
    }
  }

  .hover-border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid transparent;
    border-radius: 8px;
    pointer-events: none;
    transition: all 0.3s ease;
    opacity: 0;

    &.visible {
      border-color: $secondary-color;
      opacity: 1;
    }
  }
}
</style>