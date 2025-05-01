export type Task = {
    id: string,
    title: string,
    description: string,
    priority: 'high' | 'low' | 'medium',
    assignedTo: string
  }