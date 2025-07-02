'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Task, TaskStatus } from '@/types/task'
import { formatDistanceToNow } from 'date-fns'

interface DashboardProps {
  tasks: Task[]
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void
  onDeleteTask: (taskId: string) => void
}

export default function Dashboard({ tasks, onUpdateTaskStatus, onDeleteTask }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const ongoingTasks = tasks.filter(task => task.status === 'ongoing')
  const completedTasks = tasks.filter(task => task.status === 'success')
  const failedTasks = tasks.filter(task => task.status === 'failure')
  const overdueTasks = tasks.filter(task => task.is_overdue)
  const dueToday = tasks.filter(task => {
    const today = new Date()
    const taskDate = new Date(task.deadline)
    return task.status === 'ongoing' && 
           taskDate.getDate() === today.getDate() &&
           taskDate.getMonth() === today.getMonth() &&
           taskDate.getFullYear() === today.getFullYear()
  })

  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0
  const averagePriority = tasks.length > 0 
    ? tasks.reduce((sum, task) => sum + task.priority, 0) / tasks.length 
    : 0

  const stats = [
    {
      name: 'Total Tasks',
      value: tasks.length,
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Completed',
      value: completedTasks.length,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Ongoing',
      value: ongoingTasks.length,
      icon: ClockIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Failed',
      value: failedTasks.length,
      icon: XCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="card-body">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Completion Rate</h3>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold text-gray-900">
                {completionRate.toFixed(1)}%
              </span>
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {completedTasks.length} of {tasks.length} tasks completed
            </p>
          </div>
        </motion.div>

        {/* Priority Overview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Priority Overview</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(priority => {
                const priorityTasks = tasks.filter(task => task.priority === priority)
                const percentage = tasks.length > 0 ? (priorityTasks.length / tasks.length) * 100 : 0
                
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-3 h-3 rounded-full priority-${priority}`} />
                      <span className="text-sm text-gray-600">Priority {priority}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: priority === 5 ? '#ef4444' :
                                           priority === 4 ? '#f97316' :
                                           priority === 3 ? '#eab308' :
                                           priority === 2 ? '#3b82f6' : '#6b7280'
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {priorityTasks.length}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Urgent Tasks */}
      {(overdueTasks.length > 0 || dueToday.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="card-header">
                          <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Urgent Tasks</h3>
              </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {overdueTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-600">
                      Overdue by {formatDistanceToNow(task.deadline, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, 'success')}
                      className="btn-success text-sm"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="btn-danger text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              
              {dueToday.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-600">
                      Due today at {task.deadline.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, 'success')}
                      className="btn-success text-sm"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, 'failure')}
                      className="btn-warning text-sm"
                    >
                      Mark Failed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {tasks
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
              .slice(0, 5)
              .map(task => (
                <div key={task.id} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    task.status === 'success' ? 'bg-success-100' :
                    task.status === 'failure' ? 'bg-danger-100' : 'bg-primary-100'
                  }`}>
                    {task.status === 'success' ? (
                      <CheckCircleIcon className="h-4 w-4 text-success-600" />
                    ) : task.status === 'failure' ? (
                      <XCircleIcon className="h-4 w-4 text-danger-600" />
                    ) : (
                      <ClockIcon className="h-4 w-4 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(task.updated_at, { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`badge ${
                    task.status === 'success' ? 'badge-success' :
                    task.status === 'failure' ? 'badge-danger' : 'badge-primary'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 