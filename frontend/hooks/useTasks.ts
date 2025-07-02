import { useQuery, useMutation, useQueryClient } from 'react-query'
import { apiService, Task, CreateTaskData } from '@/lib/api'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export function useTasks() {
  return useQuery<any, Error>('tasks', async () => {
    const result = await apiService.getTasks()
    return result
  }, {
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000,
    cacheTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchInterval: 30000, // Refetch every 30 seconds to match Celery schedule
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation<Task, Error, CreateTaskData>(
    (taskData) => apiService.createTask(taskData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks')
      },
    }
  )
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation<Task, Error, { taskId: string; taskData: Partial<CreateTaskData> }>(
    ({ taskId, taskData }) => apiService.updateTask(taskId, taskData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks')
      },
    }
  )
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string>(
    (taskId) => apiService.deleteTask(taskId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks')
      },
    }
  )
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  
  return useMutation<Task, Error, { taskId: string; status: Task['status'] }>(
    ({ taskId, status }) => apiService.updateTaskStatus(taskId, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks')
      },
    }
  )
} 