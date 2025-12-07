<template>
  <div class="projects-table-container">
    <div class="table-responsive">
      <table class="projects-table">
        <thead>
        <tr>
          <th
              v-for="column in columns"
              :key="column.key"
              :style="{ width: column.width + 'px' }"
              class="resizable-header"
          >
            <div class="header-content">
              <button class="sortable-header" @click="$emit('sort-by', column.key)">
                <span>{{ column.label }}</span>
                <ChevronUp v-if="sortField === column.key && sortDirection === 'asc'" :size="14" />
                <ChevronDown v-else-if="sortField === column.key && sortDirection === 'desc'" :size="14" />
              </button>
              <div
                  class="resize-handle"
                  @mousedown="startResize(column.key, $event)"
              ></div>
            </div>
          </th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="project in projects"
            :key="project._id"
            class="project-row"
            @click="$emit('navigate-to-project', project._id)"
        >
          <td>{{ project._id.substring(0, 8) }}...</td>
          <td>
            <div class="project-name-cell">
              <strong>{{ project.name }}</strong>
              <p class="project-description">{{ project.description }}</p>
            </div>
          </td>
          <td>
            <span class="task-count">{{ project.tasksCount }}</span>
          </td>
          <td>
              <span :class="`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`">
                {{ project.status }}
              </span>
          </td>
          <td>
            {{ formatDate(project.createdAt) }}
          </td>
          <td @click.stop>
            <div class="action-buttons">
              <button
                  class="action-btn edit-btn"
                  @click="$emit('edit-project', project)"
                  title="Edit project"
              >
                <Pencil :size="16" />
              </button>
              <button
                  class="action-btn delete-btn"
                  @click="$emit('delete-project', project)"
                  title="Delete project"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>

      <div v-if="projects.length === 0" class="empty-state">
        <FolderOpen :size="64" />
        <h3>No projects found</h3>
        <p>Try changing your filters or create a new project</p>
      </div>
    </div>

    <div class="table-footer">
      <div class="table-stats">
        Showing {{ projects.length }} project{{ projects.length !== 1 ? 's' : '' }}
      </div>
      <div class="table-actions">
        <button
            class="export-btn"
            @click="exportToCSV"
            :disabled="projects.length === 0"
        >
          <Download :size="16" />
          Export CSV
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { ChevronUp, ChevronDown, Pencil, Trash2, FolderOpen, Download } from 'lucide-vue-next'
import type { Project } from '@/types'

interface Props {
  projects: Project[]
  columns: Array<{ key: string; label: string; width: number }>
  sortField: string
  sortDirection: 'asc' | 'desc'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'edit-project': [project: Project]
  'delete-project': [project: Project]
  'navigate-to-project': [projectId: string]
  'sort-by': [field: string]
  'resize-column': [columnKey: string, width: number]
}>()

const isResizing = ref(false)
const resizingColumn = ref('')
const startX = ref(0)
const startWidth = ref(0)

const startResize = (columnKey: string, event: MouseEvent) => {
  isResizing.value = true
  resizingColumn.value = columnKey
  startX.value = event.clientX

  const column = props.columns.find(col => col.key === columnKey)
  if (column) {
    startWidth.value = column.width
  }

  event.preventDefault()
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isResizing.value) return

  const delta = event.clientX - startX.value
  const newWidth = Math.max(50, startWidth.value + delta)
  emit('resize-column', resizingColumn.value, newWidth)
}

const stopResize = () => {
  isResizing.value = false
  resizingColumn.value = ''
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const exportToCSV = () => {
  const headers = ['ID', 'Name', 'Description', 'Status', 'Tasks', 'Created Date']
  const csvData = props.projects.map(project => [
    project._id,
    project.name,
    project.description,
    project.status,
    project.tasksCount,
    formatDate(project.createdAt)
  ])

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `projects-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
})

document.addEventListener('mousemove', handleMouseMove)
document.addEventListener('mouseup', stopResize)
</script>

<style scoped lang="scss">
@import '@/assets/styles/main.scss';

.projects-table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  @include card-shadow;

  .table-responsive {
    overflow-x: auto;
    min-height: 400px;
  }

  .projects-table {
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
        position: relative;
        user-select: none;

        &:last-child {
          border-right: none;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .sortable-header {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: none;
            border: none;
            font: inherit;
            color: inherit;
            cursor: pointer;
            padding: 0;
            text-align: left;

            &:hover {
              color: $secondary-color;

              svg {
                opacity: 1;
              }
            }

            svg {
              opacity: 0.6;
              flex-shrink: 0;
            }
          }

          .resize-handle {
            width: 5px;
            height: 100%;
            cursor: col-resize;
            position: absolute;
            right: 0;
            top: 0;
            background: transparent;

            &:hover {
              background: $secondary-color;
            }
          }
        }
      }
    }

    tbody {
      tr.project-row {
        border-bottom: 1px solid $border-color;
        transition: all 0.2s ease;
        cursor: pointer;

        &:hover {
          background: rgba($secondary-color, 0.05);
        }

        &:last-child {
          border-bottom: none;
        }

        td {
          padding: 1rem;
          vertical-align: top;
          border-right: 1px solid $border-color;

          &:last-child {
            border-right: none;
          }

          .project-name-cell {
            strong {
              display: block;
              margin-bottom: 0.25rem;
              color: $primary-color;
              font-weight: 600;
            }

            .project-description {
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
          }

          .task-count {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: rgba($secondary-color, 0.1);
            color: $secondary-color;
            border-radius: 20px;
            font-weight: 500;
            font-size: 0.875rem;
          }

          .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
            white-space: nowrap;

            &.status-to-do {
              background: rgba(#FF6B6B, 0.1);
              color: #FF6B6B;
            }

            &.status-in-progress {
              background: rgba(#4ECDC4, 0.1);
              color: #4ECDC4;
            }

            &.status-done {
              background: rgba(#45B7D1, 0.1);
              color: #45B7D1;
            }
          }
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;

          .action-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            @include flex-center;
            transition: all 0.3s ease;

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
        }
      }
    }
  }

  .empty-state {
    @include flex-center;
    flex-direction: column;
    padding: 4rem;
    text-align: center;

    svg {
      color: #ddd;
      margin-bottom: 1rem;
    }

    h3 {
      color: $primary-color;
      margin-bottom: 0.5rem;
      font-size: 1.5rem;
    }

    p {
      color: #666;
      margin-bottom: 0;
      font-size: 1rem;
    }
  }
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid $border-color;
  background: #f8f9fa;

  .table-stats {
    color: #666;
    font-size: 0.9rem;
  }

  .table-actions {
    .export-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: white;
      color: $primary-color;
      border: 1px solid $border-color;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        background: $secondary-color;
        color: white;
        border-color: $secondary-color;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      svg {
        flex-shrink: 0;
      }
    }
  }
}

@media (max-width: 768px) {
  .projects-table {
    min-width: 700px;
  }

  .table-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }
}
</style>