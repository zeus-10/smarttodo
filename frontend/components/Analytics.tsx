'use client'

import { motion } from 'framer-motion'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { Task } from '@/types/task'

interface AnalyticsProps {
  tasks: Task[]
}

export default function Analytics({ tasks }: AnalyticsProps) {
  // Prepare data for charts
  const statusData = [
    { name: 'Completed', value: tasks.filter(t => t.status === 'success').length, color: '#22c55e' },
    { name: 'Ongoing', value: tasks.filter(t => t.status === 'ongoing').length, color: '#3b82f6' },
    { name: 'Failed', value: tasks.filter(t => t.status === 'failure').length, color: '#ef4444' }
  ]

  const priorityData = [1, 2, 3, 4, 5].map(priority => ({
    priority: `P${priority}`,
    count: tasks.filter(t => t.priority === priority).length,
    completed: tasks.filter(t => t.priority === priority && t.status === 'success').length
  }))

  const dailyData = tasks.reduce((acc, task) => {
    const date = new Date(task.created_at).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = { date, total: 0, completed: 0, failed: 0 }
    }
    acc[date].total++
    if (task.status === 'success') acc[date].completed++
    if (task.status === 'failure') acc[date].failed++
    return acc
  }, {} as Record<string, { date: string; total: number; completed: number; failed: number }>)

  const dailyChartData = Object.values(dailyData).slice(-7) // Last 7 days

  const tagData = tasks.reduce((acc, task) => {
    task.tags.forEach(tag => {
      if (!acc[tag]) acc[tag] = 0
      acc[tag]++
    })
    return acc
  }, {} as Record<string, number>)

  const topTags = Object.entries(tagData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))

  const completionRate = tasks.length > 0 ? (tasks.filter(t => t.status === 'success').length / tasks.length) * 100 : 0
  const averagePriority = tasks.length > 0 ? tasks.reduce((sum, t) => sum + t.priority, 0) / tasks.length : 0
  const overdueRate = tasks.length > 0 ? (tasks.filter(t => t.is_overdue).length / tasks.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="card-body text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Completion Rate</h3>
            <div className="text-3xl font-bold text-success-600 mb-2">
              {completionRate.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-success-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="card-body text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Average Priority</h3>
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {averagePriority.toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">
              {averagePriority >= 4 ? 'High priority focus' : 
               averagePriority >= 3 ? 'Balanced priorities' : 'Low priority focus'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="card-body text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Overdue Rate</h3>
            <div className="text-3xl font-bold text-danger-600 mb-2">
              {overdueRate.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">
              {overdueRate > 20 ? 'Needs attention' : 
               overdueRate > 10 ? 'Moderate delays' : 'Good time management'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Task Status Distribution</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Priority Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Priority Analysis</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Total Tasks" />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Daily Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Daily Task Trends (Last 7 Days)</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Tasks" />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" name="Completed" />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top Tags */}
      {topTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Most Used Tags</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {topTags.map((tag, index) => (
                <div key={tag.tag} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-4 h-4 rounded-full bg-primary-600"></span>
                    <span className="font-medium text-gray-900">{tag.tag}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(tag.count / Math.max(...topTags.map(t => t.count))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {tag.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Productivity Insights</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {completionRate >= 80 && (
              <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                <h4 className="font-medium text-success-800 mb-2">🎉 Excellent Performance!</h4>
                <p className="text-success-700">
                  Your completion rate of {completionRate.toFixed(1)}% shows excellent task management skills. Keep up the great work!
                </p>
              </div>
            )}
            
            {overdueRate > 15 && (
              <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <h4 className="font-medium text-warning-800 mb-2">⚠️ Time Management Alert</h4>
                <p className="text-warning-700">
                  {overdueRate.toFixed(1)}% of your tasks are overdue. Consider setting more realistic deadlines or breaking down complex tasks.
                </p>
              </div>
            )}
            
            {averagePriority >= 4 && (
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <h4 className="font-medium text-primary-800 mb-2">📋 High Priority Focus</h4>
                <p className="text-primary-700">
                  You're focusing on high-priority tasks (avg: {averagePriority.toFixed(1)}). This is good for important goals, but don't forget to balance with lower-priority maintenance tasks.
                </p>
              </div>
            )}
            
            {tasks.length === 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">📝 Get Started</h4>
                <p className="text-gray-700">
                  No tasks yet! Create your first task to start tracking your productivity and see insights here.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 