import { createClient } from '@/lib/supabase/server'
import { TaskBoard } from '@/components/studio/TaskBoard'
import type { Task, StudioUser, Brand } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tareas' }

type TaskRow = Task & { task_assignees: { user_id: string }[] }

export default async function TasksPage() {
  const supabase = await createClient()

  const [{ data: taskData }, { data: userData }, { data: brandData }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, task_assignees(user_id)')
      .order('display_order')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('role', ['master', 'staff', 'admin'])
      .order('full_name'),
    supabase.from('brands').select('id, name, slug, client_id, tagline, logo_url, accent_color, active, client_visible, display_order, created_at').order('name'),
  ])

  const tasks = (taskData ?? []) as unknown as TaskRow[]
  const users = (userData ?? []) as StudioUser[]
  const brands = (brandData ?? []) as Brand[]

  return <TaskBoard initialTasks={tasks} users={users} brands={brands} />
}
