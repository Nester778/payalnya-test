<template>
  <div class="projects-view">
    <ProjectsHeader
        @create-project="openCreateModal"
    />

    <ProjectsFilters
        :search-query="searchQuery"
        :status-filter="statusFilter"
        :sort-field="sortField"
        :sort-direction="sortDirection"
        @update:search-query="handleSearch"
        @update:status-filter="handleFilterChange"
        @update:sort-field="handleSortChange"
        @update:sort-direction="toggleSortDirection"
        @clear-filters="clearFilters"
    />

    <div v-if="isLoading" class="loading-state">
      <Loader2 class="loading-spinner" :size="32" />
      <span>Loading projects...</span>
    </div>

    <div v-if="error" class="error-state">
      <AlertCircle :size="32" />
      <span>{{ error }}</span>
      <button @click="fetchProjects">
        <RefreshCw :size="16" />
        Retry
      </button>
    </div>

    <ProjectsTable
        v-if="!isLoading && !error"
        :projects="filteredProjects"
        :columns="columns"
        :sort-field="sortField"
        :sort-direction="sortDirection"
        @edit-project="openEditModal"
        @delete-project="confirmDelete"
        @navigate-to-project="navigateToProject"
        @sort-by="sortBy"
        @resize-column="updateColumnWidth"
    />

    <ProjectModal
        v-if="showModal"
        :project="editingProject"
        :mode="modalMode"
        @close="closeModal"
        @save="handleSaveProject"
    />

    <ConfirmationModal
        v-if="showDeleteModal"
        title="Delete Project"
        :message="`Are you sure you want to delete ${projectToDelete?.name}? This action cannot be undone.`"
        confirm-text="Delete"
        cancel-text="Cancel"
        type="danger"
        @confirm="handleDeleteProject"
        @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projectStore'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-vue-next'
import ProjectsHeader from '@/components/projects/ProjectsHeader.vue'
import ProjectsFilters from '@/components/projects/ProjectsFilters.vue'
import ProjectsTable from '@/components/projects/ProjectsTable.vue'
import ProjectModal from '@/components/projects/modals/ProjectModal.vue'
import ConfirmationModal from '@/components/projects/modals/ConfirmationModal.vue'
import type { Project, ProjectFormData } from '@/types'

const router = useRouter()
const projectStore = useProjectStore()

const searchQuery = ref('')
const statusFilter = ref('all')
const sortField = ref('createdAt')
const sortDirection = ref('desc')
const showModal = ref(false)
const showDeleteModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingProject = ref<Project | null>(null)
const projectToDelete = ref<Project | null>(null)

const columns = ref([
  { key: '_id', label: 'ID', width: 120 },
  { key: 'name', label: 'Project Name', width: 300 },
  { key: 'tasksCount', label: 'Tasks', width: 100 },
  { key: 'status', label: 'Status', width: 150 },
  { key: 'createdAt', label: 'Created Date', width: 150 }
])

const isLoading = computed(() => projectStore.isLoading)
const error = computed(() => projectStore.error)
const projects = computed(() => projectStore.projects)

const filteredProjects = computed(() => {
  let filtered = [...projects.value]

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(project => project.status === statusFilter.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
    )
  }

  filtered.sort((a, b) => {
    let aValue: any = a[sortField.value as keyof Project]
    let bValue: any = b[sortField.value as keyof Project]

    if (sortField.value === 'createdAt') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (sortDirection.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue > bValue ? -1 : 1
    }
  })

  return filtered
})

onMounted(async () => {
  await loadProjects()
  loadSavedState()
})

const loadProjects = async () => {
  try {
    await projectStore.fetchProjects()
  } catch (err) {
    console.error('Error loading projects:', err)
  }
}

const loadSavedState = () => {
  const savedState = localStorage.getItem('projectsTableState')
  if (savedState) {
    const state = JSON.parse(savedState)
    searchQuery.value = state.searchQuery || ''
    statusFilter.value = state.statusFilter || 'all'
    sortField.value = state.sortField || 'createdAt'
    sortDirection.value = state.sortDirection || 'desc'

    if (state.columnWidths) {
      columns.value = columns.value.map(col => ({
        ...col,
        width: state.columnWidths[col.key] || col.width
      }))
    }
  }
}

const saveState = () => {
  const state = {
    searchQuery: searchQuery.value,
    statusFilter: statusFilter.value,
    sortField: sortField.value,
    sortDirection: sortDirection.value,
    columnWidths: columns.value.reduce((acc, col) => {
      acc[col.key] = col.width
      return acc
    }, {} as Record<string, number>)
  }
  localStorage.setItem('projectsTableState', JSON.stringify(state))
}

const handleSearch = (value: string) => {
  searchQuery.value = value
  saveState()
}

const handleFilterChange = (value: string) => {
  statusFilter.value = value
  saveState()
}

const handleSortChange = (value: string) => {
  sortField.value = value
  saveState()
}

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  saveState()
}

const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'desc'
  }
  saveState()
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  sortField.value = 'createdAt'
  sortDirection.value = 'desc'
  saveState()
}

const updateColumnWidth = (columnKey: string, width: number) => {
  const columnIndex = columns.value.findIndex(col => col.key === columnKey)
  if (columnIndex !== -1) {
    columns.value[columnIndex].width = Math.max(50, width)
    saveState()
  }
}

const openCreateModal = () => {
  modalMode.value = 'create'
  editingProject.value = null
  showModal.value = true
}

const openEditModal = (project: Project) => {
  modalMode.value = 'edit'
  editingProject.value = project
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingProject.value = null
}

const handleSaveProject = async (projectData: ProjectFormData) => {
  try {
    if (modalMode.value === 'create') {
      await projectStore.createProject(projectData)
    } else if (editingProject.value) {
      await projectStore.updateProject(editingProject.value._id, projectData)
    }
    closeModal()
  } catch (err) {
    console.error('Error saving project:', err)
  }
}

const confirmDelete = (project: Project) => {
  projectToDelete.value = project
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  projectToDelete.value = null
}

const handleDeleteProject = async () => {
  if (!projectToDelete.value) return

  try {
    await projectStore.deleteProject(projectToDelete.value._id)
    closeDeleteModal()
  } catch (err) {
    console.error('Error deleting project:', err)
  }
}

const navigateToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`)
}

const fetchProjects = () => {
  loadProjects()
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/main.scss' as *;

.projects-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
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

.error-state {
  @include flex-center;
  flex-direction: column;
  gap: 1rem;
  padding: 4rem;
  background: white;
  border-radius: 12px;
  @include card-shadow;

  svg {
    color: $danger-color;
  }

  span {
    font-size: 1.2rem;
    color: #666;
  }

  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: $danger-color;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      background: darken-color($danger-color, 10%);
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
  .projects-view {
    padding: 1rem;
  }
}
</style>