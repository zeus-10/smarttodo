'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { TaskFormData } from '@/types/task'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long'),
  deadline: z.date().min(new Date(), 'Deadline must be in the future'),
  priority: z.number().min(1).max(5),
  estimated_duration: z.number().min(1, 'Duration must be at least 1 minute'),
  tags: z.array(z.string()),
  is_recurring: z.boolean(),
  recurrence_pattern: z.string()
})

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void
  onCancel: () => void
  initialData?: Partial<TaskFormData>
}

export default function TaskForm({ onSubmit, onCancel, initialData }: TaskFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [newTag, setNewTag] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      deadline: initialData?.deadline || new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      priority: initialData?.priority || 3,
      estimated_duration: initialData?.estimated_duration || 60,
      tags: initialData?.tags || [],
      is_recurring: initialData?.is_recurring || false,
      recurrence_pattern: initialData?.recurrence_pattern || 'none'
    }
  })

  const isRecurring = watch('is_recurring')

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      setValue('tags', updatedTags)
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove)
    setTags(updatedTags)
    setValue('tags', updatedTags)
  }

  const handleFormSubmit = (data: TaskFormData) => {
    onSubmit({
      ...data,
      tags
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              {...register('title')}
              type="text"
              id="title"
              className={`input ${errors.title ? 'border-danger-500' : ''}`}
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-danger-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              className={`input ${errors.description ? 'border-danger-500' : ''}`}
              placeholder="Enter task description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-danger-600">{errors.description.message}</p>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline *
            </label>
            <DatePicker
              selected={watch('deadline')}
              onChange={(date) => setValue('deadline', date as Date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className={`input ${errors.deadline ? 'border-danger-500' : ''}`}
              minDate={new Date()}
            />
            {errors.deadline && (
              <p className="mt-1 text-sm text-danger-600">{errors.deadline.message}</p>
            )}
          </div>

          {/* Priority and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                {...register('priority', { valueAsNumber: true })}
                id="priority"
                className="input"
              >
                <option value={1}>Very Low</option>
                <option value={2}>Low</option>
                <option value={3}>Medium</option>
                <option value={4}>High</option>
                <option value={5}>Very High</option>
              </select>
            </div>

            <div>
              <label htmlFor="estimated_duration" className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (minutes)
              </label>
              <input
                {...register('estimated_duration', { valueAsNumber: true })}
                type="number"
                id="estimated_duration"
                min="1"
                className={`input ${errors.estimated_duration ? 'border-danger-500' : ''}`}
              />
              {errors.estimated_duration && (
                <p className="mt-1 text-sm text-danger-600">{errors.estimated_duration.message}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-secondary"
              >
                Add
              </button>
            </div>
          </div>

          {/* Recurring Task */}
          <div>
            <div className="flex items-center mb-4">
              <input
                {...register('is_recurring')}
                type="checkbox"
                id="is_recurring"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">
                Recurring Task
              </label>
            </div>

            {isRecurring && (
              <div>
                <label htmlFor="recurrence_pattern" className="block text-sm font-medium text-gray-700 mb-2">
                  Recurrence Pattern
                </label>
                <select
                  {...register('recurrence_pattern')}
                  id="recurrence_pattern"
                  className="input"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : (initialData ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
} 