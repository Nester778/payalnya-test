export interface BaseEntity {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface Project extends BaseEntity {
    name: string;
    description: string;
    status: 'To do' | 'In progress' | 'Done';
    tasksCount: number;
    createdBy: string;
}

export interface Task extends BaseEntity {
    title: string;
    description: string;
    assignee: string | null;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    projectId: string;
    order: number;
}

export interface ProjectFilters {
    status?: string;
    search?: string;
    sort?: string;
}

export interface TaskFilters {
    status?: string;
    assignee?: string;
    search?: string;
    sort?: string;
}

export interface ProjectFormData {
    name: string;
    description: string;
    status?: 'To do' | 'In progress' | 'Done';
}

export interface TaskFormData {
    title: string;
    description?: string;
    assignee?: string | null;
    status: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    projectId: string;
}

export interface TaskReorderData {
    taskId: string;
    status: 'todo' | 'in_progress' | 'done';
    order: number;
    prevStatus?: 'todo' | 'in_progress' | 'done';
    prevOrder?: number;
}

export interface ProjectStats {
    _id: string;
    count: number;
    totalTasks: number;
}

export interface TaskStats {
    statusStats: Array<{
        _id: string;
        count: number;
        highPriority: number;
    }>;
    assignees: string[];
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    count?: number;
    error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    count: number;
    total?: number;
    page?: number;
    pages?: number;
}