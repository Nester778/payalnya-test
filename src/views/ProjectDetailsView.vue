<template>
  <div class="project-details-view">
    <div class="project-header">
      <nav class="breadcrumb">
        <router-link to="/" class="breadcrumb-link">
          <ChevronLeft :size="16" />
          Back to Projects
        </router-link>
      </nav>

      <div class="project-title-section">
        <div class="title-left">
          <h1>{{ project?.name || 'Project Details' }}</h1>
          <p class="project-description">{{ project?.description || '' }}</p>
        </div>
        <div class="title-right">
          <span :class="`status-badge status-${project?.status.toLowerCase().replace(' ', '-')}`">
            {{ project?.status }}
          </span>
          <span class="tasks-count">{{ totalTasks }} tasks</span>
        </div>
      </div>
    </div>

    <div class="project-stats">
      <div class="stat-card">
        <div class="stat-icon todo">
          <ListTodo :size="24" />
        </div>
        <div class="stat-info">
          <h3>{{ todoTasks }}</h3>
          <p>To Do</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon in-progress">
          <RefreshCw :size="24" />
        </div>
        <div class="stat-info">
          <h3>{{ inProgressTasks }}</h3>
          <p>In Progress</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon done">
          <CheckCircle :size="24" />
        </div>
        <div class="stat-info">
          <h3>{{ doneTasks }}</h3>
          <p>Done</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon overdue">
          <AlertCircle :size="24" />
        </div>
        <div class="stat-info">
          <h3>{{ overdueTasks }}</h3>
          <p>Overdue</p>
        </div>
      </div>
    </div>

    <div class="chart-section">
      <div class="chart-header">
        <h2>Task Statistics</h2>
      </div>
      <div class="chart-container">
        <VChart
            v-if="chartData.length > 0"
            :option="chartOptions"
            :autoresize="true"
            class="chart"
        />
        <div v-else class="no-data">
          <BarChart3 :size="48" />
          <p>No data available for chart</p>
        </div>
      </div>
    </div>

    <div class="view-controls">
      <div class="view-toggle">
        <button
            :class="['view-btn', { active: viewMode === 'table' }]"
            @click="viewMode = 'table'"
        >
          <Table :size="20" />
          Table View
        </button>
        <button
            :class="['view-btn', { active: viewMode === 'kanban' }]"
            @click="viewMode = 'kanban'"
        >
          <Columns :size="20" />
          Kanban View
        </button>
      </div>

      <div class="filters-section">
        <div class="search-box">
          <Search :size="20" />
          <input
              v-model="localSearch"
              @input="handleSearch"
              placeholder="Search tasks..."
              type="text"
          />
        </div>

        <div class="filter-group">
          <label>Status:</label>
          <select v-model="localStatus" @change="handleStatusChange">
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Assignee:</label>
          <select v-model="localAssignee" @change="handleAssigneeChange">
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            <option v-for="assignee in assignees" :key="assignee" :value="assignee">
              {{ assignee }}
            </option>
          </select>
        </div>

        <button class="clear-filters" @click="clearFilters">
          <X :size="16" />
          Clear Filters
        </button>

        <button class="new-task-btn" @click="openCreateModal">
          <Plus :size="20" />
          New Task
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <Loader2 class="loading-spinner" :size="32" />
      <span>Loading tasks...</span>
    </div>

    <TasksTable
        v-if="!isLoading && viewMode === 'table' && filteredTasks.length > 0"
        :tasks="filteredTasks"
        :project-id="projectId"
        @edit-task="openEditModal"
        @delete-task="confirmDelete"
        @update-task="handleUpdateTask"
    />

    <div v-if="!isLoading && viewMode === 'kanban'" class="kanban-container">
      <KanbanBoard
          :tasks="tasksByStatus"
          @task-moved="handleTaskMove"
          @edit-task="openEditModal"
          @delete-task="confirmDelete"
          @add-task="openCreateModal"
      />
    </div>

    <div v-if="!isLoading && filteredTasks.length === 0" class="empty-state">
      <ClipboardList :size="64" />
      <h3>No tasks found</h3>
      <p v-if="hasActiveFilters">Try clearing your filters</p>
      <p v-else>Create your first task for this project</p>
      <button class="create-btn" @click="openCreateModal">
        <Plus :size="20" />
        Create First Task
      </button>
    </div>

    <TaskModal
        v-if="showTaskModal"
        :task="editingTask"
        :project-id="projectId"
        :mode="taskModalMode"
        @close="closeTaskModal"
        @save="handleSaveTask"
    />

    <ConfirmationModal
        v-if="showDeleteModal"
        title="Delete Task"
        :message="`Are you sure you want to delete ${taskToDelete?.title}? This action cannot be undone.`"
        confirm-text="Delete"
        cancel-text="Cancel"
        type="danger"
        @confirm="handleDeleteTask"
        @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  ChevronLeft,
  ListTodo,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Table,
  Columns,
  Search,
  X,
  Plus,
  Loader2,
  ClipboardList
} from 'lucide-vue-next'
import TasksTable from '@/components/tasks/TasksTable.vue'
import KanbanBoard from '@/components/tasks/KanbanBoard.vue'
import TaskModal from '@/components/tasks/modals/TaskModal.vue'
import ConfirmationModal from '@/components/projects/modals/ConfirmationModal.vue'

import type { Task, TaskFormData } from '@/types'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const route = useRoute()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const projectId = computed(() => route.params.id as string)

const viewMode = ref<'table' | 'kanban'>('table')
const showTaskModal = ref(false)
const showDeleteModal = ref(false)
const taskModalMode = ref<'create' | 'edit'>('create')
const editingTask = ref<Task | null>(null)
const taskToDelete = ref<Task | null>(null)

const taskFilters = computed(() => taskStore.filters)

const localSearch = ref(taskFilters.value.search)
const localStatus = ref(taskFilters.value.status)
const localAssignee = ref(taskFilters.value.assignee)

const isLoading = computed(() => taskStore.isLoading || projectStore.isLoading)
const error = computed(() => taskStore.error || projectStore.error)
const project = computed(() => projectStore.currentProject || projectStore.projects.find(p => p._id === projectId.value))
const totalTasks = computed(() => taskStore.totalTasks)
const todoTasks = computed(() => taskStore.todoTasks)
const inProgressTasks = computed(() => taskStore.inProgressTasks)
const doneTasks = computed(() => taskStore.doneTasks)
const overdueTasks = computed(() => taskStore.overdueTasks.length)

const filteredTasks = computed(() => taskStore.filteredTasks)

const tasksByStatus = computed(() => {
  const allTasks = taskStore.filteredTasks
  const result = {
    todo: [] as Task[],
    in_progress: [] as Task[],
    done: [] as Task[]
  }

  allTasks.forEach(task => {
    if (result[task.status as keyof typeof result]) {
      result[task.status as keyof typeof result].push(task)
    }
  })

  Object.keys(result).forEach(status => {
    result[status as keyof typeof result].sort((a, b) => a.order - b.order)
  })

  return result
})

const assignees = computed(() => taskStore.assignees)
const hasActiveFilters = computed(() => {
  const filters = taskFilters.value
  return filters.status !== 'all' ||
      filters.assignee !== 'all' ||
      filters.search !== ''
})

const chartData = computed(() => {
  return [
    { value: todoTasks.value, name: 'To Do' },
    { value: inProgressTasks.value, name: 'In Progress' },
    { value: doneTasks.value, name: 'Done' }
  ].filter(item => item.value > 0)
})

const chartOptions = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: {
        fontSize: 12
      }
    },
    series: [{
      name: 'Tasks',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}: {c}'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: chartData.value.map(item => ({
        ...item,
        itemStyle: {
          color: getStatusColor(item.name)
        }
      }))
    }],
    backgroundColor: 'transparent'
  }
})

onMounted(async () => {
  await loadProjectDetails()
  await loadTasks()
  loadSavedState()
})

onUnmounted(() => {
  taskStore.clearCurrentProject()
})

const loadProjectDetails = async () => {
  try {
    await projectStore.fetchProjectById(projectId.value)
  } catch (err) {
    console.error('Error loading project details:', err)
  }
}

const loadTasks = async () => {
  try {
    await taskStore.fetchTasksByProject(projectId.value)
  } catch (err) {
    console.error('Error loading tasks:', err)
  }
}

const loadSavedState = () => {
  const savedState = localStorage.getItem(`projectDetails_${projectId.value}`)
  if (savedState) {
    const state = JSON.parse(savedState)

    viewMode.value = state.viewMode || 'table'

    if (state.filters) {
      const { search = '', status = 'all', assignee = 'all' } = state.filters

      taskStore.setFilters({ search, status, assignee })

      localSearch.value = search
      localStatus.value = status
      localAssignee.value = assignee
    }
  }
}

const saveState = () => {
  const state = {
    viewMode: viewMode.value,
    filters: {
      search: localSearch.value,
      status: localStatus.value,
      assignee: localAssignee.value
    }
  }
  localStorage.setItem(`projectDetails_${projectId.value}`, JSON.stringify(state))
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'To Do':
      return '#FF6B6B'
    case 'In Progress':
      return '#4ECDC4'
    case 'Done':
      return '#45B7D1'
    default:
      return '#999'
  }
}

let searchTimeout: NodeJS.Timeout | null = null

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    taskStore.setFilters({ search: localSearch.value })
    saveState()
  }, 300)
}

const handleStatusChange = () => {
  taskStore.setFilters({ status: localStatus.value })
  saveState()
}

const handleAssigneeChange = () => {
  taskStore.setFilters({ assignee: localAssignee.value })
  saveState()
}

const clearFilters = () => {
  taskStore.clearFilters()
  localSearch.value = ''
  localStatus.value = 'all'
  localAssignee.value = 'all'
  saveState()
}

watch(() => taskFilters.value.search, (newSearch) => {
  localSearch.value = newSearch
})

watch(() => taskFilters.value.status, (newStatus) => {
  localStatus.value = newStatus
})

watch(() => taskFilters.value.assignee, (newAssignee) => {
  localAssignee.value = newAssignee
})

const handleTaskMove = async (movedTask: Task, newStatus: string, newOrder: number) => {
  try {
    await taskStore.reorderTask({
      taskId: movedTask._id,
      status: newStatus,
      order: newOrder,
      prevStatus: movedTask.status,
      prevOrder: movedTask.order
    })
  } catch (err) {
    console.error('Error moving task:', err)
  }
}

const handleUpdateTask = async (taskId: string, updates: Partial<TaskFormData>) => {
  try {
    await taskStore.updateTask(taskId, updates)
  } catch (err) {
    console.error('Error updating task:', err)
  }
}

const openCreateModal = () => {
  taskModalMode.value = 'create'
  editingTask.value = null
  showTaskModal.value = true
}

const openEditModal = (task: Task) => {
  taskModalMode.value = 'edit'
  editingTask.value = task
  showTaskModal.value = true
}

const closeTaskModal = () => {
  showTaskModal.value = false
  editingTask.value = null
}

const handleSaveTask = async (taskData: TaskFormData) => {
  try {
    if (taskModalMode.value === 'create') {
      await taskStore.createTask(taskData)
    } else if (editingTask.value) {
      await taskStore.updateTask(editingTask.value._id, taskData)
    }
    closeTaskModal()
  } catch (err) {
    console.error('Error saving task:', err)
  }
}

const confirmDelete = (task: Task) => {
  taskToDelete.value = task
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  taskToDelete.value = null
}

const handleDeleteTask = async () => {
  if (!taskToDelete.value) return

  try {
    await taskStore.deleteTask(taskToDelete.value._id)
    closeDeleteModal()
  } catch (err) {
    console.error('Error deleting task:', err)
  }
}

// Watch
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await loadProjectDetails()
    await loadTasks()
    loadSavedState()
  }
})

watch([viewMode, localSearch, localStatus, localAssignee], () => {
  saveState()
}, { deep: true })
</script>

<style scoped lang="scss">
@import '@/assets/styles/main.scss';

.project-details-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.project-header {
  margin-bottom: 2rem;

  .breadcrumb {
    margin-bottom: 1rem;

    .breadcrumb-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: $secondary-color;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        color: darken($secondary-color, 10%);
      }
    }
  }

  .project-title-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
    padding: 1.5rem;
    background: white;
    border-radius: 12px;
    @include card-shadow;

    .title-left {
      flex: 1;

      h1 {
        font-size: 2rem;
        color: $primary-color;
        margin-bottom: 0.5rem;
        font-weight: 700;
      }

      .project-description {
        color: #666;
        font-size: 1.1rem;
        line-height: 1.5;
        margin: 0;
      }
    }

    .title-right {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: flex-end;

      .status-badge {
        display: inline-block;
        padding: 0.375rem 1.25rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
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

      .tasks-count {
        font-size: 1rem;
        color: #666;
        font-weight: 500;
      }
    }
  }
}

.project-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: white;
    border-radius: 12px;
    @include card-shadow;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      @include flex-center;

      &.todo {
        background: rgba(#FF6B6B, 0.1);
        color: #FF6B6B;
      }

      &.in-progress {
        background: rgba(#4ECDC4, 0.1);
        color: #4ECDC4;
      }

      &.done {
        background: rgba(#45B7D1, 0.1);
        color: #45B7D1;
      }

      &.overdue {
        background: rgba($danger-color, 0.1);
        color: $danger-color;
      }
    }

    .stat-info {
      h3 {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
        color: $primary-color;
      }

      p {
        font-size: 0.9rem;
        color: #666;
        margin: 0;
      }
    }
  }
}

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  @include card-shadow;

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    h2 {
      font-size: 1.25rem;
      color: $primary-color;
      margin: 0;
    }

    .chart-select {
      padding: 0.5rem 1rem;
      border: 1px solid $border-color;
      border-radius: 6px;
      background: white;
      color: $primary-color;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: $secondary-color;
      }
    }
  }

  .chart-container {
    height: 300px;
    position: relative;

    .chart {
      width: 100%;
      height: 100%;
    }

    .no-data {
      @include flex-center;
      flex-direction: column;
      height: 100%;
      gap: 1rem;
      color: #ccc;

      p {
        margin: 0;
        font-size: 1rem;
      }
    }
  }
}

.view-controls {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  @include card-shadow;

  .view-toggle {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;

    .view-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #f8f9fa;
      border: 2px solid transparent;
      border-radius: 8px;
      color: #666;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #e9ecef;
      }

      &.active {
        background: $secondary-color;
        color: white;
        border-color: $secondary-color;
      }

      svg {
        flex-shrink: 0;
      }
    }
  }

  .filters-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;

    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;

      svg {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #999;
      }

      input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 3rem;
        border: 2px solid $border-color;
        border-radius: 8px;
        font-size: 0.9rem;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: $secondary-color;
          box-shadow: 0 0 0 3px rgba($secondary-color, 0.1);
        }
      }
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      label {
        font-weight: 500;
        color: $primary-color;
        white-space: nowrap;
        font-size: 0.9rem;
      }

      select {
        padding: 0.625rem 1rem;
        border: 1px solid $border-color;
        border-radius: 6px;
        background: white;
        color: $primary-color;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 140px;

        &:hover {
          border-color: $secondary-color;
        }
      }
    }

    .clear-filters {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: rgba($danger-color, 0.1);
      color: $danger-color;
      border: 1px solid rgba($danger-color, 0.2);
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;

      &:hover {
        background: rgba($danger-color, 0.2);
      }

      svg {
        flex-shrink: 0;
      }
    }

    .new-task-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: $secondary-color;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;

      &:hover {
        background: darken($secondary-color, 10%);
        transform: translateY(-2px);
      }

      svg {
        flex-shrink: 0;
      }
    }
  }
}

.kanban-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  @include card-shadow;
}

.loading-state {
  @include flex-center;
  flex-direction: column;
  gap: 1rem;
  padding: 4rem;
  background: white;
  border-radius: 12px;
  @include card-shadow;

  .loading-spinner {
    color: $secondary-color;
    animation: spin 1s linear infinite;
  }

  span {
    font-size: 1.2rem;
    color: #666;
  }
}

.empty-state {
  @include flex-center;
  flex-direction: column;
  gap: 1rem;
  padding: 4rem;
  background: white;
  border-radius: 12px;
  @include card-shadow;
  text-align: center;

  svg {
    color: #ddd;
  }

  h3 {
    color: $primary-color;
    margin: 0;
    font-size: 1.5rem;
  }

  p {
    color: #666;
    margin: 0;
    font-size: 1rem;
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: $secondary-color;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 1rem;

    &:hover {
      background: darken($secondary-color, 10%);
      transform: translateY(-2px);
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

@media (max-width: 1024px) {
  .project-title-section {
    flex-direction: column;
    gap: 1rem;

    .title-right {
      flex-direction: row;
      width: 100%;
      justify-content: space-between;
    }
  }

  .view-controls {
    .filters-section {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;

      .search-box {
        min-width: unset;
      }

      .filter-group {
        width: 100%;
        justify-content: space-between;
      }
    }
  }
}

@media (max-width: 768px) {
  .project-details-view {
    padding: 1rem;
  }

  .project-stats {
    grid-template-columns: 1fr 1fr;
  }

  .view-toggle {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .project-stats {
    grid-template-columns: 1fr;
  }

  .project-title-section {
    .title-right {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
}
</style>