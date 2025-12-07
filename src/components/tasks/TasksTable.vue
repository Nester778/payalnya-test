<template>
  <div class="tasks-table-container">
    <div class="table-responsive">
      <table class="tasks-table">
        <thead>
        <tr>
          <th
              v-for="column in columns"
              :key="column.key"
              :style="{ width: column.width + 'px' }"
              class="resizable-header"
          >
            <div class="header-content">
              <div class="header-text">
                {{ column.label }}
              </div>
              <div
                  class="resize-handle"
                  @mousedown="startResize(column.key, $event)"
              ></div>
            </div>
          </th>
          <th :style="{ width: actionsColumnWidth + 'px' }">Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="task in tasks" :key="task._id" class="task-row">
          <td
              v-for="column in columns"
              :key="column.key"
              :style="{ width: column.width + 'px' }"
          >
            <template v-if="column.key === 'title'">
              <div class="task-title-cell">
                <strong>{{ task.title }}</strong>
              </div>
            </template>

            <template v-else-if="column.key === 'description'">
              <p class="task-description">{{ task.description }}</p>
            </template>

            <template v-else-if="column.key === 'assignee'">
              <span v-if="task.assignee" class="assignee-badge">
                {{ task.assignee }}
              </span>
              <span v-else class="unassigned">Unassigned</span>
            </template>

            <template v-else-if="column.key === 'status'">
              <span :class="`status-badge status-${task.status}`">
                {{ formatStatus(task.status) }}
              </span>
            </template>

            <template v-else-if="column.key === 'priority'">
              <span :class="`priority-badge priority-${task.priority}`">
                {{ task.priority }}
              </span>
            </template>

            <template v-else-if="column.key === 'dueDate'">
              <div class="due-date-cell" :class="{ overdue: isOverdue(task.dueDate, task.status) }">
                {{ formatDate(task.dueDate) }}
                <span v-if="isOverdue(task.dueDate, task.status)" class="overdue-badge">Overdue</span>
              </div>
            </template>
          </td>

          <td :style="{ width: actionsColumnWidth + 'px' }">
            <div class="action-buttons">
              <button
                  class="action-btn edit-btn"
                  @click="$emit('edit-task', task)"
                  title="Edit task"
              >
                <Pencil :size="16" />
              </button>
              <button
                  class="action-btn delete-btn"
                  @click="$emit('delete-task', task)"
                  title="Delete task"
              >
                <Trash2 :size="16" />
              </button>
              <select
                  v-model="task.status"
                  @change="updateTaskStatus(task._id, task.status)"
                  class="status-select"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import type { Task } from '@/types'

interface Props {
  tasks: Task[]
  projectId: string
  columnWidths?: Record<string, number>
  tableId?: string
}

const props = withDefaults(defineProps<Props>(), {
  tableId: 'tasksTable',
  columnWidths: () => ({})
})

const emit = defineEmits<{
  'edit-task': [task: Task]
  'delete-task': [task: Task]
  'update-task': [taskId: string, updates: any]
  'update:columnWidths': [widths: Record<string, number>]
}>()

const defaultColumnWidths = {
  title: 200,
  description: 300,
  assignee: 150,
  status: 150,
  priority: 150,
  dueDate: 150
}

const columns = ref([
  { key: 'title', label: 'Title', width: defaultColumnWidths.title },
  { key: 'description', label: 'Description', width: defaultColumnWidths.description },
  { key: 'assignee', label: 'Assignee', width: defaultColumnWidths.assignee },
  { key: 'status', label: 'Status', width: defaultColumnWidths.status },
  { key: 'priority', label: 'Priority', width: defaultColumnWidths.priority },
  { key: 'dueDate', label: 'Due Date', width: defaultColumnWidths.dueDate }
])

const actionsColumnWidth = ref(200)

const isResizing = ref(false)
const resizingColumn = ref('')
const startX = ref(0)
const startWidth = ref(0)

const storageKey = computed(() => `${props.tableId}_${props.projectId}_columnWidths`)

const loadColumnWidths = () => {
  const saved = localStorage.getItem(storageKey.value)
  if (saved) {
    try {
      const savedWidths = JSON.parse(saved)
      columns.value = columns.value.map(column => ({
        ...column,
        width: savedWidths[column.key] || column.width
      }))

      emitColumnWidths()
    } catch (err) {
      console.error('Error loading column widths:', err)
    }
  }
}

const saveColumnWidths = () => {
  const widths = columns.value.reduce((acc, column) => {
    acc[column.key] = column.width
    return acc
  }, {} as Record<string, number>)

  localStorage.setItem(storageKey.value, JSON.stringify(widths))
  emitColumnWidths()
}

const emitColumnWidths = () => {
  const widths = columns.value.reduce((acc, column) => {
    acc[column.key] = column.width
    return acc
  }, {} as Record<string, number>)

  emit('update:columnWidths', widths)
}

const startResize = (columnKey: string, event: MouseEvent) => {
  isResizing.value = true
  resizingColumn.value = columnKey
  startX.value = event.clientX

  const column = columns.value.find(col => col.key === columnKey)
  if (column) {
    startWidth.value = column.width
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isResizing.value) return

  const delta = event.clientX - startX.value
  const newWidth = Math.max(50, startWidth.value + delta)

  const columnIndex = columns.value.findIndex(col => col.key === resizingColumn.value)
  if (columnIndex !== -1) {
    columns.value[columnIndex].width = newWidth
  }
}

const stopResize = () => {
  if (isResizing.value) {
    isResizing.value = false
    resizingColumn.value = ''
    saveColumnWidths()
  }

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
})

onMounted(() => {
  loadColumnWidths()

  if (Object.keys(props.columnWidths).length > 0) {
    columns.value = columns.value.map(column => ({
      ...column,
      width: props.columnWidths[column.key] || column.width
    }))
    saveColumnWidths()
  }
})

const formatStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const isOverdue = (dateString: string, status: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(dateString)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today && status !== 'done'
}

const updateTaskStatus = (taskId: string, newStatus: string) => {
  emit('update-task', taskId, { status: newStatus })
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/main.scss' as *;

.tasks-table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  @include card-shadow;

  .table-responsive {
    overflow-x: auto;
  }

  .tasks-table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: #f8f9fa;
      border-bottom: 2px solid $border-color;

      th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: $primary-color;
        border-right: 1px solid $border-color;
        white-space: nowrap;
        position: relative;
        user-select: none;

        &:last-child {
          border-right: none;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .header-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .resize-handle {
            width: 5px;
            height: 100%;
            cursor: col-resize;
            position: absolute;
            right: 0;
            top: 0;
            background: transparent;
            transition: background-color 0.2s ease;

            &:hover {
              background: $secondary-color;
            }
          }
        }
      }
    }

    tbody {
      tr.task-row {
        border-bottom: 1px solid $border-color;
        transition: all 0.2s ease;

        &:hover {
          background: rgba($secondary-color, 0.05);
        }

        &:last-child {
          border-bottom: none;
        }

        td {
          padding: 1rem;
          vertical-align: middle;
          border-right: 1px solid $border-color;
          overflow: hidden;

          &:last-child {
            border-right: none;
          }

          .task-title-cell {
            strong {
              display: block;
              color: $primary-color;
              font-weight: 600;
              font-size: 1rem;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          .task-description {
            font-size: 0.875rem;
            color: #666;
            line-height: 1.4;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .assignee-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: rgba($secondary-color, 0.1);
            color: $secondary-color;
            border-radius: 20px;
            font-weight: 500;
            font-size: 0.875rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          .unassigned {
            color: #999;
            font-style: italic;
            font-size: 0.875rem;
            white-space: nowrap;
          }

          .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;

            &.status-todo {
              background: rgba(#FF6B6B, 0.1);
              color: #FF6B6B;
            }

            &.status-in_progress {
              background: rgba(#4ECDC4, 0.1);
              color: #4ECDC4;
            }

            &.status-done {
              background: rgba(#45B7D1, 0.1);
              color: #45B7D1;
            }
          }

          .priority-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;

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

          .due-date-cell {
            font-size: 0.875rem;
            color: $primary-color;
            white-space: nowrap;

            &.overdue {
              color: $danger-color;
            }

            .overdue-badge {
              display: block;
              font-size: 0.75rem;
              color: $danger-color;
              font-weight: 500;
              margin-top: 0.25rem;
            }
          }
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;

          .action-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            @include flex-center;
            transition: all 0.3s ease;
            flex-shrink: 0;

            &.edit-btn {
              background: rgba($secondary-color, 0.1);
              color: $secondary-color;

              &:hover {
                background: $secondary-color;
                color: white;
              }
            }

            &.delete-btn {
              background: rgba($danger-color, 0.1);
              color: $danger-color;

              &:hover {
                background: $danger-color;
                color: white;
              }
            }

            svg {
              flex-shrink: 0;
            }
          }

          .status-select {
            padding: 0.375rem 0.75rem;
            border: 1px solid $border-color;
            border-radius: 6px;
            background: white;
            color: $primary-color;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 100px;
            flex-shrink: 0;

            &:hover {
              border-color: $secondary-color;
            }

            &:focus {
              outline: none;
              border-color: $secondary-color;
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .tasks-table {
    min-width: 800px;
  }
}
</style>