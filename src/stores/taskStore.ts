import { defineStore } from 'pinia';
import type {
    Task,
    TaskFilters,
    TaskFormData,
    TaskReorderData,
    TaskStats,
    ApiResponse
} from '@/types';
import api from '@/services/api';

export const useTaskStore = defineStore('task', {
    // State
    state: () => ({
        tasks: [] as Task[],
        currentTask: null as Task | null,
        isLoading: false,
        error: null as string | null,
        filters: {
            status: 'all',
            assignee: 'all',
            search: '',
            sort: 'order:asc'
        } as TaskFilters,
        stats: null as TaskStats | null,
        currentProjectId: null as string | null,
    }),

    // Getters
    getters: {
        filteredTasks(state) {
            let filtered = [...state.tasks];

            if (state.filters.status && state.filters.status !== 'all') {
                filtered = filtered.filter(task => task.status === state.filters.status);
            }

            if (state.filters.assignee && state.filters.assignee !== 'all') {
                if (state.filters.assignee === 'unassigned') {
                    filtered = filtered.filter(task => !task.assignee);
                } else {
                    filtered = filtered.filter(task => task.assignee === state.filters.assignee);
                }
            }

            if (state.filters.search) {
                const searchTerm = state.filters.search.toLowerCase();
                filtered = filtered.filter(task =>
                    task.title.toLowerCase().includes(searchTerm) ||
                    task.description.toLowerCase().includes(searchTerm)
                );
            }

            if (state.filters.sort) {
                const [field, order] = state.filters.sort.split(':');
                filtered.sort((a, b) => {
                    let aValue: any = a[field as keyof Task];
                    let bValue: any = b[field as keyof Task];

                    if (field.includes('Date') || field.includes('At')) {
                        aValue = new Date(aValue).getTime();
                        bValue = new Date(bValue).getTime();
                    }

                    if (typeof aValue === 'string') {
                        aValue = aValue.toLowerCase();
                        bValue = bValue.toLowerCase();
                    }

                    if (order === 'desc') {
                        return aValue > bValue ? -1 : 1;
                    }
                    return aValue > bValue ? 1 : -1;
                });
            }

            return filtered;
        },

        tasksByStatus(state) {
            const result = state.tasks.reduce((acc, task) => {
                const status = task.status;
                if (!acc[status]) {
                    acc[status] = [];
                }
                acc[status].push(task);
                return acc;
            }, {} as Record<string, Task[]>);

            Object.keys(result).forEach(status => {
                result[status].sort((a, b) => a.order - b.order);
            });

            return result;
        },

        assignees(state) {
            const assigneeSet = new Set<string>();
            state.tasks.forEach(task => {
                if (task.assignee) {
                    assigneeSet.add(task.assignee);
                }
            });
            return Array.from(assigneeSet);
        },

        overdueTasks(state) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return state.tasks.filter(task => {
                if (task.status === 'done') return false;
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate < today;
            });
        },

        totalTasks: (state) => state.tasks.length,

        todoTasks: (state) => state.tasks.filter(t => t.status === 'todo').length,

        inProgressTasks: (state) => state.tasks.filter(t => t.status === 'in_progress').length,

        doneTasks: (state) => state.tasks.filter(t => t.status === 'done').length,
    },

    actions: {
        async fetchTasksByProject(projectId: string) {
            this.isLoading = true;
            this.error = null;
            this.currentProjectId = projectId;

            try {
                const queryParams = new URLSearchParams();
                if (this.filters.status && this.filters.status !== 'all') {
                    queryParams.append('status', this.filters.status);
                }
                if (this.filters.assignee && this.filters.assignee !== 'all') {
                    queryParams.append('assignee', this.filters.assignee);
                }
                if (this.filters.search) {
                    queryParams.append('search', this.filters.search);
                }
                if (this.filters.sort) {
                    queryParams.append('sort', this.filters.sort);
                }

                const queryString = queryParams.toString();
                const url = `/projects/${projectId}/tasks${queryString ? `?${queryString}` : ''}`;

                const response = await api.get<ApiResponse<Task[]>>(url);

                if (response.success) {
                    this.tasks = response.data;
                } else {
                    throw new Error(response.error || 'Failed to fetch tasks');
                }
            } catch (err: any) {
                this.error = err.message || 'Error fetching tasks';
                console.error('Error fetching tasks:', err);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchTaskById(id: string) {
            this.isLoading = true;
            this.error = null;

            try {
                const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);

                if (response.success) {
                    this.currentTask = response.data;
                } else {
                    throw new Error(response.error || 'Task not found');
                }
            } catch (err: any) {
                this.error = err.message || 'Error fetching task';
                console.error('Error fetching task:', err);
            } finally {
                this.isLoading = false;
            }
        },

        async createTask(taskData: TaskFormData) {
            this.isLoading = true;
            this.error = null;

            try {
                const tempTask: Task = {
                    _id: `temp_${Date.now()}`,
                    title: taskData.title,
                    description: taskData.description || '',
                    assignee: taskData.assignee || '',
                    status: taskData.status,
                    priority: taskData.priority,
                    dueDate: taskData.dueDate,
                    projectId: taskData.projectId,
                    order: this.tasks.filter(t => t.status === taskData.status).length,
                    createdBy: 'local',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                this.tasks.push(tempTask);

                const realTask = await this.sendCreateRequest(taskData);

                const tempIndex = this.tasks.findIndex(t => t._id === tempTask._id);
                if (tempIndex !== -1) {
                    this.tasks[tempIndex] = realTask;
                }

                return realTask;
            } catch (err: any) {
                this.tasks = this.tasks.filter(t => !t._id.startsWith('temp_'));

                this.error = err.message || 'Error creating task';
                console.error('Error creating task:', err);
                throw err;
            } finally {
                this.isLoading = false;
            }
        },

        async sendCreateRequest(taskData: TaskFormData) {
            const response = await api.post<ApiResponse<Task>>(
                `/projects/${taskData.projectId}/tasks`,
                taskData
            );

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to create task');
            }
        },

        async updateTask(id: string, taskData: Partial<TaskFormData>) {
            this.isLoading = true;
            this.error = null;

            try {
                const index = this.tasks.findIndex(t => t._id === id);
                if (index === -1) {
                    throw new Error('Task not found');
                }

                const oldTask = { ...this.tasks[index] };

                this.tasks[index] = {
                    ...this.tasks[index],
                    ...taskData,
                    updatedAt: new Date().toISOString()
                };

                if (this.currentTask?._id === id) {
                    this.currentTask = { ...this.currentTask, ...taskData };
                }

                this.sendUpdateRequest(id, taskData).catch(err => {
                    console.error('Background update failed:', err);
                    this.tasks[index] = oldTask;
                });

                return this.tasks[index];
            } catch (err: any) {
                this.error = err.message || 'Error updating task';
                console.error('Error updating task:', err);
                throw err;
            } finally {
                this.isLoading = false;
            }
        },

        async sendUpdateRequest(id: string, taskData: Partial<TaskFormData>) {
            const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, taskData);

            if (response.success) {
                console.log('Task updated on server:', response.data);
            } else {
                throw new Error(response.error || 'Failed to update task on server');
            }
        },

        async reorderTask(reorderData: TaskReorderData) {
            try {
                const taskIndex = this.tasks.findIndex(t => t._id === reorderData.taskId);

                if (taskIndex === -1) {
                    throw new Error('Task not found');
                }

                const taskToMove = { ...this.tasks[taskIndex] };
                const prevStatus = reorderData.prevStatus || taskToMove.status;
                const prevOrder = reorderData.prevOrder !== undefined ? reorderData.prevOrder : taskToMove.order;

                this.updateTaskOrderLocally(taskToMove, reorderData.status, reorderData.order, prevStatus, prevOrder);

                this.sendReorderRequest(reorderData).catch(err => {
                    console.error('Background reorder failed:', err);
                });

                return taskToMove;
            } catch (err: any) {
                this.error = err.message || 'Error reordering task';
                console.error('Error reordering task:', err);
                throw err;
            }
        },

        updateTaskOrderLocally(task: Task, newStatus: string, newOrder: number, prevStatus: string, prevOrder: number) {
            this.tasks = this.tasks.map(t => {
                if (t._id !== task._id && t.status === prevStatus && t.order > prevOrder) {
                    return { ...t, order: t.order - 1 };
                }
                return t;
            });

            this.tasks = this.tasks.map(t => {
                if (t._id !== task._id && t.status === newStatus && t.order >= newOrder) {
                    return { ...t, order: t.order + 1 };
                }
                return t;
            });

            const updatedTask = {
                ...task,
                status: newStatus,
                order: newOrder,
                updatedAt: new Date().toISOString()
            };

            const taskIndex = this.tasks.findIndex(t => t._id === task._id);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = updatedTask;
            }

            this.tasks.sort((a, b) => {
                if (a.status === b.status) return a.order - b.order;
                return a.status.localeCompare(b.status);
            });
        },

        async sendReorderRequest(reorderData: TaskReorderData) {
            const response = await api.put<ApiResponse<Task>>(
                `/tasks/${reorderData.taskId}/reorder`,
                reorderData
            );

            if (response.success) {
                console.log('Task reordered on server:', response.data);
            } else {
                throw new Error(response.error || 'Failed to reorder task on server');
            }
        },

        async deleteTask(id: string) {
            this.isLoading = true;
            this.error = null;

            try {
                const deletedTask = this.tasks.find(t => t._id === id);
                if (!deletedTask) {
                    throw new Error('Task not found');
                }

                this.tasks = this.tasks.filter(t => t._id !== id);

                this.tasks = this.tasks.map(task => {
                    if (task.status === deletedTask.status && task.order > deletedTask.order) {
                        return { ...task, order: task.order - 1 };
                    }
                    return task;
                });

                if (this.currentTask?._id === id) {
                    this.currentTask = null;
                }

                this.sendDeleteRequest(id).catch(err => {
                    console.error('Background delete failed:', err);
                    if (deletedTask) {
                        this.tasks.push(deletedTask);
                        this.tasks.sort((a, b) => {
                            if (a.status === b.status) return a.order - b.order;
                            return a.status.localeCompare(b.status);
                        });
                    }
                });
            } catch (err: any) {
                this.error = err.message || 'Error deleting task';
                console.error('Error deleting task:', err);
                throw err;
            } finally {
                this.isLoading = false;
            }
        },

        async sendDeleteRequest(id: string) {
            const response = await api.delete<ApiResponse<{}>>(`/tasks/${id}`);

            if (response.success) {
                console.log('Task deleted on server:', id);
            } else {
                throw new Error(response.error || 'Failed to delete task on server');
            }
        },

        async fetchTaskStats(projectId: string) {
            try {
                const response = await api.get<ApiResponse<TaskStats>>(`/projects/${projectId}/tasks/stats`);

                if (response.success) {
                    this.stats = response.data;
                }
            } catch (err) {
                console.error('Error fetching task stats:', err);
            }
        },

        setFilters(newFilters: Partial<TaskFilters>) {
            this.filters = { ...this.filters, ...newFilters };
        },

        clearFilters() {
            this.filters = {
                status: 'all',
                assignee: 'all',
                search: '',
                sort: 'order:asc'
            };
        },

        clearError() {
            this.error = null;
        },

        clearCurrentProject() {
            this.tasks = [];
            this.currentTask = null;
            this.currentProjectId = null;
            this.stats = null;
            this.clearFilters();
        },
    },

    persist: {
        key: 'task-store',
        paths: ['filters'],
        storage: localStorage,
    }
});