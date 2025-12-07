<template>
  <div class="projects-filters">
    <div class="search-box">
      <Search :size="20" />
      <input
          v-model="localSearchQuery"
          @input="handleSearchInput"
          placeholder="Search projects by name or description..."
          type="text"
      />
    </div>

    <div class="filter-controls">
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="localStatusFilter" @change="handleFilterSelect">
          <option value="all">All Statuses</option>
          <option value="To do">To Do</option>
          <option value="In progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Sort by:</label>
        <select v-model="localSortField" @change="handleSortSelect">
          <option value="createdAt">Created Date</option>
          <option value="name">Project Name</option>
          <option value="status">Status</option>
          <option value="tasksCount">Task Count</option>
        </select>
        <button class="sort-direction" @click="handleSortDirection">
          <ArrowUp v-if="localSortDirection === 'asc'" :size="16" />
          <ArrowDown v-else :size="16" />
        </button>
      </div>

      <button class="clear-filters" @click="handleClearFilters">
        <X :size="16" />
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, ArrowUp, ArrowDown, X } from 'lucide-vue-next'

interface Props {
  searchQuery: string
  statusFilter: string
  sortField: string
  sortDirection: 'asc' | 'desc'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:search-query': [value: string]
  'update:status-filter': [value: string]
  'update:sort-field': [value: string]
  'update:sort-direction': []
  'clear-filters': []
}>()

const localSearchQuery = ref(props.searchQuery)
const localStatusFilter = ref(props.statusFilter)
const localSortField = ref(props.sortField)
const localSortDirection = ref(props.sortDirection)

watch(() => props.searchQuery, (value) => {
  localSearchQuery.value = value
})

watch(() => props.statusFilter, (value) => {
  localStatusFilter.value = value
})

watch(() => props.sortField, (value) => {
  localSortField.value = value
})

watch(() => props.sortDirection, (value) => {
  localSortDirection.value = value
})

const handleSearchInput = () => {
  emit('update:search-query', localSearchQuery.value)
}

const handleFilterSelect = () => {
  emit('update:status-filter', localStatusFilter.value)
}

const handleSortSelect = () => {
  emit('update:sort-field', localSortField.value)
}

const handleSortDirection = () => {
  emit('update:sort-direction')
}

const handleClearFilters = () => {
  localSearchQuery.value = ''
  localStatusFilter.value = 'all'
  localSortField.value = 'createdAt'
  localSortDirection.value = 'desc'
  emit('clear-filters')
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/main.scss';

.projects-filters {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  @include card-shadow;

  .search-box {
    position: relative;
    margin-bottom: 1.5rem;

    svg {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #999;
    }

    input {
      width: 100%;
      padding: 0.875rem 1rem 0.875rem 3rem;
      border: 2px solid $border-color;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: $secondary-color;
        box-shadow: 0 0 0 3px rgba($secondary-color, 0.1);
      }

      &::placeholder {
        color: #999;
      }
    }
  }

  .filter-controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;

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

        &:focus {
          outline: none;
          border-color: $secondary-color;
          box-shadow: 0 0 0 2px rgba($secondary-color, 0.2);
        }
      }

      .sort-direction {
        background: none;
        border: 1px solid $border-color;
        border-radius: 6px;
        padding: 0.625rem;
        cursor: pointer;
        color: $primary-color;
        transition: all 0.3s ease;
        @include flex-center;

        &:hover {
          background: rgba($secondary-color, 0.1);
          border-color: $secondary-color;
        }

        svg {
          flex-shrink: 0;
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
        border-color: rgba($danger-color, 0.3);
      }

      svg {
        flex-shrink: 0;
      }
    }
  }
}

@media (max-width: 1024px) {
  .projects-filters {
    .filter-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;

      .filter-group {
        width: 100%;
        justify-content: space-between;
      }

      .clear-filters {
        justify-content: center;
      }
    }
  }
}

@media (max-width: 480px) {
  .projects-filters {
    padding: 1rem;

    .filter-group {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 0.5rem;

      select {
        width: 100%;
      }
    }
  }
}
</style>