<template>
  <div class="kanban-board">
    <div class="kanban-columns">
      <div
          v-for="status in statuses"
          :key="status.key"
          class="kanban-column"
          :class="`column-${status.key}`"
      >
        <div class="column-header">
          <div class="column-title">
            <span class="status-icon" :class="status.key">
              <component :is="status.icon" :size="16" />
            </span>
            <h3>{{ status.label }}</h3>
            <span class="task-count">{{ getTaskCount(status.key) }}</span>
          </div>
          <button class="add-task-btn" @click="$emit('add-task', status.key)">
            <Plus :size="16" />
          </button>
        </div>

        <Container
            :group-name="'tasks'"
            :get-child-payload="getChildPayload(status.key)"
            @drop="handleDrop(status.key, $event)"
            @drag-start="isDragging = true"
            @drag-end="isDragging = false"
            :drop-placeholder="dropPlaceholderOptions"
            :drag-class="'dragging-card'"
            :should-accept-drop="shouldAcceptDrop"
            :behaviour="'move'"
        >
          <Draggable v-for="task in tasks[status.key]" :key="task._id">
            <TaskCard
                :task="task"
                @edit="$emit('edit-task', $event)"
                @delete="$emit('delete-task', $event)"
                class="draggable-card"
            />
          </Draggable>
        </Container>

        <div v-if="(!tasks[status.key] || tasks[status.key].length === 0) && !isDragging"
             class="empty-column">
          <p>No tasks</p>
          <button class="add-task-empty" @click="$emit('add-task', status.key)">
            <Plus :size="16" />
            Add Task
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Container, Draggable } from 'vue3-smooth-dnd'
import {
  Circle,
  RefreshCw,
  CheckCircle,
  Plus
} from 'lucide-vue-next'
import type { Task } from '@/types'

import TaskCard from '@/components/tasks/TaskCard.vue'

interface Props {
  tasks: Record<string, Task[]>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'task-moved': [task: Task, newStatus: string, newOrder: number]
  'edit-task': [task: Task]
  'delete-task': [task: Task]
  'add-task': [status: string]
}>()

const statuses = [
  { key: 'todo', label: 'To Do', icon: Circle, color: '#FF6B6B' },
  { key: 'in_progress', label: 'In Progress', icon: RefreshCw, color: '#4ECDC4' },
  { key: 'done', label: 'Done', icon: CheckCircle, color: '#45B7D1' }
]

const isDragging = ref(false)

const dropPlaceholderOptions = {
  className: 'drop-preview',
  animationDuration: 150,
  showOnTop: true
}

const getTaskCount = (status: string) => {
  return props.tasks[status]?.length || 0
}

const getChildPayload = (status: string) => (index: number) => {
  return props.tasks[status]?.[index]
}

const shouldAcceptDrop = (sourceContainerOptions: any, payload: any) => {
  return true
}

const handleDrop = (status: string, dropResult: any) => {
  const { removedIndex, addedIndex, payload } = dropResult

  if (removedIndex !== null) {
    if (addedIndex !== null && removedIndex !== addedIndex) {
      const task = payload
      emit('task-moved', task, status, addedIndex)
    }
  } else if (addedIndex !== null) {
    const task = payload
    emit('task-moved', task, status, addedIndex)
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/main.scss' as *;

.kanban-board {
  .kanban-columns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    min-height: 500px;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  .kanban-column {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    min-height: 500px;

    &.column-todo {
      border-top: 4px solid #FF6B6B;
    }

    &.column-in_progress {
      border-top: 4px solid #4ECDC4;
    }

    &.column-done {
      border-top: 4px solid #45B7D1;
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid rgba(0, 0, 0, 0.05);

      .column-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .status-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          @include flex-center;

          &.todo {
            background: rgba(#FF6B6B, 0.1);
            color: #FF6B6B;
          }

          &.in_progress {
            background: rgba(#4ECDC4, 0.1);
            color: #4ECDC4;
          }

          &.done {
            background: rgba(#45B7D1, 0.1);
            color: #45B7D1;
          }
        }

        h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: $primary-color;
        }

        .task-count {
          background: white;
          color: #666;
          padding: 0.125rem 0.5rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }
      }

      .add-task-btn {
        width: 32px;
        height: 32px;
        background: white;
        border: 1px solid $border-color;
        border-radius: 8px;
        color: $secondary-color;
        cursor: pointer;
        @include flex-center;
        transition: all 0.3s ease;

        &:hover {
          background: $secondary-color;
          color: white;
          border-color: $secondary-color;
        }
      }
    }

    .smooth-dnd-container {
      flex: 1;
      min-height: 100px;
      padding: 0.5rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.5);
    }

    .draggable-card {
      cursor: grab;
      user-select: none;
    }

    .empty-column {
      flex: 1;
      @include flex-center;
      flex-direction: column;
      gap: 1rem;
      color: #ccc;
      padding: 2rem;
      border: 2px dashed $border-color;
      border-radius: 8px;

      p {
        margin: 0;
        font-size: 0.9rem;
      }

      .add-task-empty {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid $border-color;
        border-radius: 6px;
        color: $secondary-color;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.3s ease;

        &:hover {
          background: $secondary-color;
          color: white;
          border-color: $secondary-color;
        }
      }
    }
  }
}

:deep(.drop-preview) {
  background-color: rgba($secondary-color, 0.1);
  border: 2px dashed $secondary-color;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  max-width: 95.1%;
}

:deep(.dragging-card) {
  cursor: grabbing !important;
  opacity: 0.8;
  transform: rotate(3deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
  z-index: 1000;
}

@media (max-width: 768px) {
  .kanban-board {
    .kanban-columns {
      gap: 1rem;
    }

    .kanban-column {
      min-height: 400px;

      .smooth-dnd-container {
        max-height: calc(400px - 80px);
      }
    }
  }
}
</style>