'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notify'
import type { TaskPriority, TaskStatus } from '@/lib/supabase/types'

async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  due_date?: string | null
  brand_id?: string | null
  client_id?: string | null
  assignees?: string[]
}

export async function createTask(input: CreateTaskInput): Promise<string | null> {
  const supabase = await createClient()
  const user = await currentUser()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? 'medium',
      due_date: input.due_date ?? null,
      brand_id: input.brand_id ?? null,
      client_id: input.client_id ?? null,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return null
  const taskId = (data as { id: string }).id

  const assignees = input.assignees ?? []
  if (assignees.length > 0) {
    await supabase.from('task_assignees').insert(assignees.map((user_id) => ({ task_id: taskId, user_id })))
    await notify({
      userIds: assignees.filter((id) => id !== user?.id),
      type: 'task_assigned',
      title: 'Nueva tarea asignada',
      body: input.title,
      link: '/studio/tasks',
    })
  }

  revalidatePath('/studio/tasks')
  return taskId
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const supabase = await createClient()
  await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/studio/tasks')
}

export async function updateTask(
  id: string,
  patch: { title?: string; description?: string | null; priority?: TaskPriority; due_date?: string | null; brand_id?: string | null },
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('tasks').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/studio/tasks')
}

export async function setAssignees(taskId: string, userIds: string[], taskTitle: string): Promise<void> {
  const supabase = await createClient()
  const user = await currentUser()

  const { data: existing } = await supabase.from('task_assignees').select('user_id').eq('task_id', taskId)
  const before = new Set(((existing ?? []) as { user_id: string }[]).map((r) => r.user_id))

  await supabase.from('task_assignees').delete().eq('task_id', taskId)
  if (userIds.length > 0) {
    await supabase.from('task_assignees').insert(userIds.map((user_id) => ({ task_id: taskId, user_id })))
  }

  const added = userIds.filter((id) => !before.has(id) && id !== user?.id)
  if (added.length > 0) {
    await notify({
      userIds: added,
      type: 'task_assigned',
      title: 'Te asignaron una tarea',
      body: taskTitle,
      link: '/studio/tasks',
    })
  }
  revalidatePath('/studio/tasks')
}

export async function addComment(taskId: string, body: string, taskTitle: string): Promise<void> {
  const supabase = await createClient()
  const user = await currentUser()

  await supabase.from('task_comments').insert({ task_id: taskId, author_id: user?.id ?? null, body })

  // Notify assignees + creator (except the commenter)
  const [{ data: assignees }, { data: task }] = await Promise.all([
    supabase.from('task_assignees').select('user_id').eq('task_id', taskId),
    supabase.from('tasks').select('created_by').eq('id', taskId).single(),
  ])
  const recipients = new Set<string>()
  ;((assignees ?? []) as { user_id: string }[]).forEach((a) => recipients.add(a.user_id))
  const creator = (task as { created_by: string | null } | null)?.created_by
  if (creator) recipients.add(creator)
  if (user?.id) recipients.delete(user.id)

  await notify({
    userIds: [...recipients],
    type: 'task_comment',
    title: 'Nuevo comentario',
    body: `${taskTitle}: ${body.slice(0, 80)}`,
    link: '/studio/tasks',
  })
  revalidatePath('/studio/tasks')
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('tasks').delete().eq('id', id)
  revalidatePath('/studio/tasks')
}
