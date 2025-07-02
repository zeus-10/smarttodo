'use client'

import { motion } from 'framer-motion'
import { 
  LightBulbIcon,
  SparklesIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Task } from '@/types/task'

interface AIInsightsProps {
  tasks: Task[]
}

export default function AIInsights({ tasks }: AIInsightsProps) {
  // Mock AI insights based on task data
  const generateInsights = () => {
    const insights = []
    
    const ongoingTasks = tasks.filter(t => t.status === 'ongoing')
    const completedTasks = tasks.filter(t => t.status === 'success')
    const overdueTasks = tasks.filter(t => t.is_overdue)
    
    // Completion rate insight
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0
    if (completionRate < 60) {
      insights.push({
        type: 'warning',
        title: 'Low Completion Rate',
        description: `Your completion rate is ${completionRate.toFixed(1)}%. Consider breaking down complex tasks into smaller, more manageable pieces.`,
        icon: ExclamationTriangleIcon,
        action: 'Review task complexity'
      })
    } else if (completionRate > 85) {
      insights.push({
        type: 'success',
        title: 'Excellent Performance',
        description: `Great job! Your ${completionRate.toFixed(1)}% completion rate shows excellent task management skills.`,
        icon: CheckCircleIcon,
        action: 'Keep up the momentum'
      })
    }
    
    // Overdue tasks insight
    if (overdueTasks.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Overdue Tasks Detected',
        description: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Consider rescheduling or breaking them down.`,
        icon: ClockIcon,
        action: 'Review deadlines'
      })
    }
    
    // Priority distribution insight
    const highPriorityTasks = tasks.filter(t => t.priority >= 4)
    const lowPriorityTasks = tasks.filter(t => t.priority <= 2)
    
    if (highPriorityTasks.length > lowPriorityTasks.length * 2) {
      insights.push({
        type: 'info',
        title: 'High Priority Focus',
        description: 'You\'re focusing heavily on high-priority tasks. Consider balancing with some lower-priority maintenance tasks.',
        icon: ChartBarIcon,
        action: 'Balance priorities'
      })
    }
    
    // Time estimation insight
    const tasksWithTime = tasks.filter(t => t.actual_duration && t.estimated_duration)
    if (tasksWithTime.length > 0) {
      const avgAccuracy = tasksWithTime.reduce((sum, t) => {
        const accuracy = Math.abs((t.estimated_duration! - t.actual_duration!) / t.estimated_duration!) * 100
        return sum + accuracy
      }, 0) / tasksWithTime.length
      
      if (avgAccuracy > 50) {
        insights.push({
          type: 'warning',
          title: 'Time Estimation Issues',
          description: `Your time estimates are off by ${avgAccuracy.toFixed(1)}% on average. Try tracking actual time spent to improve estimates.`,
          icon: ClockIcon,
          action: 'Improve time tracking'
        })
      }
    }
    
    // Workload balance insight
    if (ongoingTasks.length > 10) {
      insights.push({
        type: 'warning',
        title: 'High Workload',
        description: `You have ${ongoingTasks.length} ongoing tasks. Consider completing some before adding new ones to avoid overwhelm.`,
        icon: ExclamationTriangleIcon,
        action: 'Focus on completion'
      })
    }
    
    return insights
  }

  const insights = generateInsights()

  // Mock AI suggestions
  const suggestions = [
    {
      title: 'Schedule Focus Time',
      description: 'Based on your patterns, you\'re most productive between 9-11 AM. Schedule your most important tasks during this time.',
      confidence: 85,
      category: 'Time Management'
    },
    {
      title: 'Create Task Templates',
      description: 'You frequently create similar tasks. Consider creating templates for recurring workflows to save time.',
      confidence: 78,
      category: 'Efficiency'
    },
    {
      title: 'Batch Similar Tasks',
      description: 'Group similar tasks together to reduce context switching and improve efficiency.',
      confidence: 92,
      category: 'Productivity'
    }
  ]

  return (
    <div className="space-y-6">
      {/* AI Assistant Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200"
      >
        <div className="card-body">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 rounded-full">
              <SparklesIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
              <p className="text-gray-600">Smart insights and recommendations to boost your productivity</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Smart Insights</h3>
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card border-l-4 ${
                  insight.type === 'success' ? 'border-success-500 bg-success-50' :
                  insight.type === 'warning' ? 'border-warning-500 bg-warning-50' :
                  'border-primary-500 bg-primary-50'
                }`}
              >
                <div className="card-body">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${
                      insight.type === 'success' ? 'bg-success-100' :
                      insight.type === 'warning' ? 'bg-warning-100' :
                      'bg-primary-100'
                    }`}>
                      <insight.icon className={`h-5 w-5 ${
                        insight.type === 'success' ? 'text-success-600' :
                        insight.type === 'warning' ? 'text-warning-600' :
                        'text-primary-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                      <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                        {insight.action} →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card"
          >
            <div className="card-body text-center py-8">
              <LightBulbIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No insights available yet. Create more tasks to get personalized recommendations.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* AI Suggestions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Smart Suggestions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-md transition-shadow duration-200"
            >
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
                    {suggestion.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {suggestion.confidence}% confidence
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{suggestion.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{suggestion.description}</p>
                <div className="flex items-center justify-between">
                  <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    Apply suggestion
                  </button>
                  <div className="flex items-center space-x-1">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${suggestion.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Productivity Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Productivity Tips</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-success-100 rounded-full">
                  <CheckCircleIcon className="h-4 w-4 text-success-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Time Blocking</h4>
                  <p className="text-sm text-gray-600">Schedule specific time blocks for different types of tasks to improve focus and efficiency.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary-100 rounded-full">
                  <ChartBarIcon className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Priority Matrix</h4>
                  <p className="text-sm text-gray-600">Use the Eisenhower Matrix to categorize tasks by urgency and importance.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-warning-100 rounded-full">
                  <ClockIcon className="h-4 w-4 text-warning-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Pomodoro Technique</h4>
                  <p className="text-sm text-gray-600">Work in 25-minute focused sessions with 5-minute breaks to maintain concentration.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <LightBulbIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Batch Processing</h4>
                  <p className="text-sm text-gray-600">Group similar tasks together to reduce context switching and improve efficiency.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Learning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
      >
        <div className="card-body">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">AI Learning</h3>
              <p className="text-gray-600">
                Our AI is learning from your patterns to provide better suggestions. 
                The more you use the app, the smarter it gets!
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 