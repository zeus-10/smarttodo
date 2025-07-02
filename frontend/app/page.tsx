'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import TaskList from '@/components/TaskList'
import TaskForm from '@/components/TaskForm'
import EditTaskForm from '@/components/EditTaskForm'
import Dashboard from '@/components/Dashboard'
import Analytics from '@/components/Analytics'
import { useTasks, useCreateTask, useUpdateTask, useUpdateTaskStatus, useDeleteTask } from '@/hooks/useTasks'
import { Task as ApiTask } from '@/lib/api'
import { TaskStatus, Task as FrontendTask } from '@/types/task'
import toast from 'react-hot-toast'

// Extend the API Task type with frontend-specific properties
interface Task extends ApiTask {
  is_overdue: boolean
  time_until_deadline: number
  completion_rate: number
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<FrontendTask | null>(null)
  
  // API hooks
  const { data: apiResponse, isLoading, error, refetch } = useTasks()
  
  // Extract tasks from paginated response
  const apiTasks = apiResponse?.results || []
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const updateTaskStatusMutation = useUpdateTaskStatus()
  const deleteTaskMutation = useDeleteTask()

  // Transform API tasks to include frontend-specific properties
  const tasks = Array.isArray(apiTasks) ? apiTasks.map(apiTask => {
    try {
      const deadline = new Date(apiTask.deadline)
      const now = new Date()
      const timeUntilDeadline = Math.max(0, deadline.getTime() - now.getTime()) / 1000
      const isOverdue = deadline < now && apiTask.status === 'ongoing'
      const completionRate = apiTask.status === 'success' ? 100 : 0

      return {
        ...apiTask,
        description: apiTask.description || '',
        deadline: new Date(apiTask.deadline),
        created_at: new Date(apiTask.created_at),
        updated_at: new Date(apiTask.updated_at),
        tags: apiTask.tags || [],
        is_overdue: isOverdue,
        time_until_deadline: timeUntilDeadline,
        completion_rate: completionRate
      } as FrontendTask
    } catch (error) {
      console.error('Error transforming task:', error, 'Task data:', apiTask)
      return null
    }
  }).filter((task): task is FrontendTask => task !== null) : []

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
    { id: 'tasks', name: 'Tasks', icon: CheckCircleIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ]

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status)
  }

  const handleCreateTask = (taskData: any) => {
    createTaskMutation.mutate(taskData, {
      onSuccess: () => {
        toast.success('Task created successfully!')
        setShowTaskForm(false)
      },
      onError: () => {
        toast.error('Failed to create task')
      }
    })
  }

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    updateTaskStatusMutation.mutate({ taskId, status }, {
      onSuccess: () => {
        toast.success('Task status updated!')
      },
      onError: () => {
        toast.error('Failed to update task status')
      }
    })
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        toast.success('Task deleted successfully!')
      },
      onError: () => {
        toast.error('Failed to delete task')
      }
    })
  }

  const handleEditTask = (task: FrontendTask) => {
    setEditingTask(task)
  }

  const handleUpdateTask = (taskData: any) => {
    if (!editingTask) return
    
    updateTaskMutation.mutate({ taskId: editingTask.id, taskData }, {
      onSuccess: () => {
        toast.success('Task updated successfully!')
        setEditingTask(null)
      },
      onError: () => {
        toast.error('Failed to update task')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Smart Todo...</p>
          <p className="text-sm text-gray-500">Fetching tasks from server...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">Failed to load tasks</p>
          <p className="text-sm text-gray-500">Please check if the backend server is running at http://127.0.0.1:8000</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Smart Todo</h1>
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                AI-Powered
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => refetch()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowTaskForm(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Task
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && (
            <>

              
              <Dashboard 
                tasks={tasks}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
              />
            </>
          )}
          
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ongoing Tasks */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">Ongoing</h3>
                      <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTasksByStatus('ongoing').length}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <TaskList
                      tasks={getTasksByStatus('ongoing')}
                      onUpdateStatus={handleUpdateTaskStatus}
                      onDelete={handleDeleteTask}
                      onEdit={handleEditTask}
                    />
                  </div>
                </div>

                {/* Completed Tasks */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">Completed</h3>
                      <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {getTasksByStatus('success').length}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <TaskList
                      tasks={getTasksByStatus('success')}
                      onUpdateStatus={handleUpdateTaskStatus}
                      onDelete={handleDeleteTask}
                      onEdit={handleEditTask}
                    />
                  </div>
                </div>

                {/* Failed Tasks */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">Failed</h3>
                      <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {getTasksByStatus('failure').length}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <TaskList
                      tasks={getTasksByStatus('failure')}
                      onUpdateStatus={handleUpdateTaskStatus}
                      onDelete={handleDeleteTask}
                      onEdit={handleEditTask}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <Analytics tasks={tasks} />
          )}
        </motion.div>
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
        />
      )}

      {/* Edit Task Form Modal */}
      {editingTask && (
        <EditTaskForm
          task={editingTask}
          onSubmit={handleUpdateTask}
          onCancel={() => setEditingTask(null)}
        />
      )}
    </div>
  )
} 