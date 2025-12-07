import { defineStore } from 'pinia';
import type {
    Project,
    ProjectFilters,
    ProjectFormData,
    ProjectStats,
    ApiResponse
} from '@/types';
import api from '@/services/api';

const localStorageUtils = {
    get(key: string, defaultValue: any) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    },
    set(key: string, value: any) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem(key: string) {
        localStorage.removeItem(key);
    }
};

export const useProjectStore = defineStore('project', {
    state: () => ({
        projects: [] as Project[],
        currentProject: null as Project | null,
        isLoading: false,
        error: null as string | null,
        filters: {
            status: 'all',
            search: '',
            sort: 'createdAt:desc'
        } as ProjectFilters,
        stats: [] as ProjectStats[],
    }),

    getters: {
        filteredProjects: (state) => {
            let filtered = [...state.projects];

            if (state.filters.status && state.filters.status !== 'all') {
                filtered = filtered.filter(project =>
                    project.status.toLowerCase() === state.filters.status?.toLowerCase()
                );
            }

            if (state.filters.search) {
                const searchTerm = state.filters.search.toLowerCase();
                filtered = filtered.filter(project =>
                    project.name.toLowerCase().includes(searchTerm) ||
                    project.description.toLowerCase().includes(searchTerm)
                );
            }

            if (state.filters.sort) {
                const [field, order] = state.filters.sort.split(':');
                filtered.sort((a, b) => {
                    let aValue: any = a[field as keyof Project];
                    let bValue: any = b[field as keyof Project];

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

        projectsByStatus: (state) => {
            return state.projects.reduce((acc, project) => {
                const status = project.status;
                if (!acc[status]) {
                    acc[status] = [];
                }
                acc[status].push(project);
                return acc;
            }, {} as Record<string, Project[]>);
        },

        totalProjects: (state) => state.projects.length,

        activeProjects: (state) =>
            state.projects.filter(p => p.status === 'In progress').length,

        completedProjects: (state) =>
            state.projects.filter(p => p.status === 'Done').length,
    },

    // Actions
    actions: {
        async fetchProjects() {
            this.isLoading = true;
            this.error = null;

            try {
                const queryParams = new URLSearchParams();
                if (this.filters.status && this.filters.status !== 'all') {
                    queryParams.append('status', this.filters.status);
                }
                if (this.filters.search) {
                    queryParams.append('search', this.filters.search);
                }
                if (this.filters.sort) {
                    queryParams.append('sort', this.filters.sort);
                }

                const queryString = queryParams.toString();
                const url = `/projects${queryString ? `?${queryString}` : ''}`;

                const response = await api.get<ApiResponse<Project[]>>(url);

                if (response.success) {
                    this.projects = response.data;
                    localStorageUtils.set('projects', this.projects);
                } else {
                    throw new Error(response.error || 'Failed to fetch projects');
                }
            } catch (err: any) {
                this.error = err.message || 'Error fetching projects';
                console.error('Error fetching projects:', err);

                const cachedProjects = localStorageUtils.get('projects', []);
                if (cachedProjects.length > 0) {
                    this.projects = cachedProjects;
                    console.warn('Loaded projects from cache due to network error');
                }
            } finally {
                this.isLoading = false;
            }
        },

        async fetchProjectById(id: string) {
            this.isLoading = true;
            this.error = null;

            try {
                const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);

                if (response.success) {
                    this.currentProject = response.data;
                    localStorageUtils.set(`project_${id}`, response.data);
                } else {
                    throw new Error(response.error || 'Project not found');
                }
            } catch (err: any) {
                this.error = err.message || 'Error fetching project';
                console.error('Error fetching project:', err);

                const cachedProject = localStorageUtils.get(`project_${id}`, null);
                if (cachedProject) {
                    this.currentProject = cachedProject;
                }
            } finally {
                this.isLoading = false;
            }
        },

        async createProject(projectData: ProjectFormData) {
            this.isLoading = true;
            this.error = null;

            try {
                const response = await api.post<ApiResponse<Project>>('/projects', projectData);

                if (response.success) {
                    this.projects.unshift(response.data);
                    localStorageUtils.set('projects', this.projects);
                    return response.data;
                } else {
                    throw new Error(response.error || 'Failed to create project');
                }
            } catch (err: any) {
                this.error = err.message || 'Error creating project';
                console.error('Error creating project:', err);
                throw err;
            } finally {
                this.isLoading = false;
            }
        },

        async updateProject(id: string, projectData: Partial<ProjectFormData>) {
            this.isLoading = true;
            this.error = null;

            try {
                const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, projectData);

                if (response.success) {
                    const index = this.projects.findIndex(p => p._id === id);
                    if (index !== -1) {
                        this.projects[index] = { ...this.projects[index], ...response.data };
                    }

                    if (this.currentProject?._id === id) {
                        this.currentProject = { ...this.currentProject, ...response.data };
                    }

                    localStorageUtils.set('projects', this.projects);
                    return response.data;
                } else {
                    throw new Error(response.error || 'Failed to update project');
                }
            } catch (err: any) {
                this.error = err.message || 'Error updating project';
                console.error('Error updating project:', err);
                throw err;
            } finally {
                this.isLoading = false;
            }
        },

        async deleteProject(id: string) {
            this.isLoading = true;
            this.error = null;

            try {
                const response = await api.delete<ApiResponse<{}>>(`/projects/${id}`);

                if (response.success) {
                    this.projects = this.projects.filter(p => p._id !== id);

                    if (this.currentProject?._id === id) {
                        this.currentProject = null;
                    }

                    localStorageUtils.set('projects', this.projects);
                } else {
                    throw new Error(response.error || 'Failed to delete project');
                }
            } catch (err: any) {
                this.error = err.message || 'Error deleting project';
                console.error('Error deleting project:', err);
                throw err;
            } finally {
                this.isLoading = false;
            }
        },

        async fetchProjectStats() {
            try {
                const response = await api.get<ApiResponse<ProjectStats[]>>('/projects/stats/summary');

                if (response.success) {
                    this.stats = response.data;
                }
            } catch (err) {
                console.error('Error fetching project stats:', err);
            }
        },

        setFilters(newFilters: Partial<ProjectFilters>) {
            this.filters = { ...this.filters, ...newFilters };
            localStorageUtils.set('projectFilters', this.filters);
        },

        clearFilters() {
            this.filters = {
                status: 'all',
                search: '',
                sort: 'createdAt:desc'
            };
            localStorageUtils.removeItem('projectFilters');
        },

        clearError() {
            this.error = null;
        },

        loadFromLocalStorage() {
            const cachedProjects = localStorageUtils.get('projects', []);
            if (cachedProjects.length > 0) {
                this.projects = cachedProjects;
            }

            const cachedFilters = localStorageUtils.get('projectFilters', null);
            if (cachedFilters) {
                this.filters = cachedFilters;
            }
        },

        initialize() {
            this.loadFromLocalStorage();
        }
    },

    persist: {
        key: 'project-store',
        paths: ['filters'],
        storage: localStorage,
    }
});