export type TaskStatus = 'ongoing' | 'success' | 'failure'

export interface Task {
  id: string
  title: string
  description: string
  deadline: Date
  status: TaskStatus
  priority: number
  estimated_duration: number
  actual_duration?: number
  created_at: Date
  updated_at: Date
  tags: string[]
  is_overdue: boolean
  time_until_deadline: number
  completion_rate: number
  is_recurring?: boolean
  recurrence_pattern?: string
  template_id?: string
}

export interface TaskFormData {
  title: string
  description: string
  deadline: Date
  priority: number
  estimated_duration: number
  tags: string[]
  is_recurring: boolean
  recurrence_pattern: string
}

export interface TaskTemplate {
  id: string
  name: string
  title: string
  description: string
  estimated_duration: number
  priority: number
  created_at: Date
  updated_at: Date
}

export interface TaskComment {
  id: string
  content: string
  author: {
    id: number
    username: string
    email: string
  }
  created_at: Date
  updated_at: Date
}

export interface TaskAttachment {
  id: string
  file: string
  filename: string
  uploaded_by: {
    id: number
    username: string
    email: string
  }
  uploaded_at: Date
} 