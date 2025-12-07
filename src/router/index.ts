import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const ProjectsView = () => import('@/views/ProjectsView.vue')
const ProjectDetailsView = () => import('@/views/ProjectDetailsView.vue')

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: '',
                name: 'Projects',
                component: ProjectsView,
                meta: {
                    title: 'Projects',
                    requiresAuth: false
                }
            },
            {
                path: 'projects/:id',
                name: 'ProjectDetails',
                component: ProjectDetailsView,
                props: true,
                meta: {
                    title: 'Project Details',
                    requiresAuth: false,
                    breadcrumb: [
                        { name: 'Projects', path: '/' }
                    ]
                }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL || '/'),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        return { top: 0 }
    }
})

router.beforeEach((to, from, next) => {
    const pageTitle = to.meta.title as string || 'Project Management'
    document.title = `${pageTitle} | Project Manager`

    next()
})

export default router