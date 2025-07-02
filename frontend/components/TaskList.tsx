'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  TrashIcon,
  PencilIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Task, TaskStatus } from '@/types/task'
import { formatDistanceToNow } from 'date-fns'

interface TaskListProps {
  tasks: Task[]
  onUpdateStatus: (taskId: string, status: TaskStatus) => void
  onDelete: (taskId: string) => void
  onEdit?: (task: Task) => void
}

export default function TaskList({ tasks, onUpdateStatus, onDelete, onEdit }: TaskListProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-gray-100 text-gray-600'
      case 2: return 'bg-blue-100 text-blue-600'
      case 3: return 'bg-yellow-100 text-yellow-600'
      case 4: return 'bg-orange-100 text-orange-600'
      case 5: return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'failure':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'ongoing':
        return <ClockIcon className="h-5 w-5 text-blue-600" />
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50'
      case 'failure':
        return 'border-l-4 border-red-500 bg-red-50'
      case 'ongoing':
        return 'border-l-4 border-blue-500 bg-blue-50'
    }
  }

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Overdue'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          {getStatusIcon('ongoing')}
        </div>
        <p className="text-gray-500 text-sm">No tasks found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`card ${getStatusColor(task.status)} hover:shadow-md transition-shadow duration-200`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </h4>
                    <span className={`badge ${getPriorityColor(task.priority)}`}>
                      P{task.priority}
                    </span>
                    {task.is_overdue && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-danger-500" />
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>
                      Due: {formatDistanceToNow(task.deadline, { addSuffix: true })}
                    </span>
                    {task.status === 'ongoing' && (
                      <span className={task.is_overdue ? 'text-danger-600 font-medium' : ''}>
                        {formatTimeRemaining(task.time_until_deadline)}
                      </span>
                    )}
                    <span>
                      {task.estimated_duration}min
                    </span>
                  </div>
                  
                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {task.status === 'ongoing' && (
                    <>
                      <button
                        onClick={() => onUpdateStatus(task.id, 'success')}
                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors duration-200"
                        title="Mark as completed"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onUpdateStatus(task.id, 'failure')}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                        title="Mark as failed"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  
                  {onEdit && (
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200"
                      title="Edit task"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-1 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors duration-200"
                    title="Delete task"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {task.status === 'success' && task.completion_rate > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Completion</span>
                    <span>{task.completion_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.completion_rate}%` }}
                  />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
} 