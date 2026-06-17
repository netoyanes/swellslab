'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  createTask, updateTaskStatus, setAssignees, addComment, deleteTask, updateTask,
} from '@/app/studio/tasks/actions'
import type { Task, TaskStatus, TaskPriority, StudioUser, Brand } from '@/lib/supabase/types'

type TaskRow = Task & { task_assignees: { user_id: string }[] }

interface Props {
  initialTasks: TaskRow[]
  users: StudioUser[]
  brands: Brand[]
}

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'Por hacer' },
  { key: 'in_progress', label: 'En progreso' },
  { key: 'review', label: 'Revisión' },
  { key: 'done', label: 'Hecho' },
]

const PRIORITY: Record<TaskPriority, { label: string; cls: string }> = {
  low: { label: 'Baja', cls: 'bg-border text-muted' },
  medium: { label: 'Media', cls: 'bg-sky-100 text-sky-700' },
  high: { label: 'Alta', cls: 'bg-amber-100 text-amber-700' },
  urgent: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
}

function userLabel(u: StudioUser) {
  return u.full_name || u.email || 'Sin nombre'
}
function initials(u: StudioUser) {
  const s = u.full_name || u.email || '?'
  return s.slice(0, 2).toUpperCase()
}

export function TaskBoard({ initialTasks, users, brands }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks)
  const [view, setView] = useState<'board' | 'list'>('board')
  const [creating, setCreating] = useState(false)
  const [openTask, setOpenTask] = useState<TaskRow | null>(null)
  const [filterUser, setFilterUser] = useState<string>('')
  const dragId = useState<{ id: string | null }>({ id: null })[0]

  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])
  const brandById = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b])), [brands])

  const filtered = filterUser
    ? tasks.filter((t) => t.task_assignees.some((a) => a.user_id === filterUser))
    : tasks

  async function moveTask(id: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    await updateTaskStatus(id, status)
  }

  function onDrop(status: TaskStatus) {
    const id = dragId.id
    dragId.id = null
    if (id) moveTask(id, status)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Borrar esta tarea?')) return
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setOpenTask(null)
    await deleteTask(id)
  }

  function TaskCard({ t }: { t: TaskRow }) {
    const brand = t.brand_id ? brandById[t.brand_id] : null
    const overdue = t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date(new Date().toDateString())
    return (
      <div
        draggable
        onDragStart={() => { dragId.id = t.id }}
        onClick={() => setOpenTask(t)}
        className="bg-canvas border border-border rounded-sm p-3.5 cursor-pointer hover:border-ink/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-ink leading-snug">{t.title}</p>
          <span className={['text-2xs uppercase tracking-widest px-1.5 py-0.5 rounded-full flex-none', PRIORITY[t.priority].cls].join(' ')}>
            {PRIORITY[t.priority].label}
          </span>
        </div>
        {brand && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: brand.accent_color || '#E8E7E3' }} />
            <span className="text-2xs text-muted truncate">{brand.name}</span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {t.task_assignees.slice(0, 3).map((a) => {
              const u = userById[a.user_id]
              if (!u) return null
              return (
                <span key={a.user_id} title={userLabel(u)} className="w-6 h-6 rounded-full bg-ink text-canvas text-[9px] flex items-center justify-center border border-canvas">
                  {initials(u)}
                </span>
              )
            })}
          </div>
          {t.due_date && (
            <span className={['text-2xs tabular-nums', overdue ? 'text-red-500' : 'text-muted'].join(' ')}>
              {new Date(t.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-2xs uppercase tracking-widest text-muted mb-3">Operación</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink font-light">Tareas</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="text-xs bg-transparent border-b border-border pb-1 outline-none focus:border-ink">
            <option value="">Todos</option>
            {users.map((u) => <option key={u.id} value={u.id}>{userLabel(u)}</option>)}
          </select>
          <div className="flex border border-border rounded-sm overflow-hidden">
            <button onClick={() => setView('board')} className={['px-3 py-1.5 text-2xs uppercase tracking-widest transition-colors', view === 'board' ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'].join(' ')}>Kanban</button>
            <button onClick={() => setView('list')} className={['px-3 py-1.5 text-2xs uppercase tracking-widest transition-colors', view === 'list' ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'].join(' ')}>Lista</button>
          </div>
          <button onClick={() => setCreating(true)} className="px-5 py-2.5 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 transition-colors">Nueva tarea</button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.key)
            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(col.key)}
                className="bg-surface/50 border border-border rounded-sm p-3 min-h-[200px]"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-2xs uppercase tracking-widest text-muted">{col.label}</span>
                  <span className="text-2xs text-muted tabular-nums">{colTasks.length}</span>
                </div>
                <div className="space-y-2.5">
                  {colTasks.map((t) => <TaskCard key={t.id} t={t} />)}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {filtered.map((t) => (
            <li key={t.id} onClick={() => setOpenTask(t)} className="flex items-center justify-between py-4 cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0">
                <span className={['text-2xs uppercase tracking-widest px-1.5 py-0.5 rounded-full flex-none', PRIORITY[t.priority].cls].join(' ')}>{PRIORITY[t.priority].label}</span>
                <span className="text-sm text-ink truncate group-hover:opacity-60 transition">{t.title}</span>
              </div>
              <div className="flex items-center gap-4 flex-none">
                <span className="text-2xs uppercase tracking-widest text-muted">{COLUMNS.find((c) => c.key === t.status)?.label}</span>
                {t.due_date && <span className="text-2xs text-muted tabular-nums">{new Date(t.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {filtered.length === 0 && <p className="text-muted text-sm mt-6">No hay tareas. Crea la primera.</p>}

      {creating && (
        <TaskModal
          users={users} brands={brands}
          onClose={() => setCreating(false)}
          onCreate={async (input) => {
            await createTask(input)
            setCreating(false)
            router.refresh()
          }}
        />
      )}

      {openTask && (
        <TaskDetail
          task={openTask} users={users} brands={brands} userById={userById}
          onClose={() => setOpenTask(null)}
          onChanged={() => router.refresh()}
          onDelete={() => handleDelete(openTask.id)}
        />
      )}
    </main>
  )
}

/* ----------------------------- Create modal ----------------------------- */
function TaskModal({ users, brands, onClose, onCreate }: {
  users: StudioUser[]; brands: Brand[]; onClose: () => void
  onCreate: (input: { title: string; description?: string; priority?: TaskPriority; due_date?: string | null; brand_id?: string | null; client_id?: string | null; assignees?: string[] }) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [brandId, setBrandId] = useState('')
  const [assignees, setAssigneesState] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const field = 'w-full bg-transparent border-b border-border pb-2 text-sm text-ink placeholder:text-muted/50 outline-none focus:border-ink transition-colors'
  const lbl = 'block text-2xs uppercase tracking-widest text-muted mb-1.5'

  function toggle(id: string) {
    setAssigneesState((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  return (
    <Overlay onClose={onClose}>
      <h2 className="font-display text-2xl text-ink font-light mb-6">Nueva tarea</h2>
      <div className="space-y-5">
        <div><label className={lbl}>Título</label><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="Diseñar propuesta de logo" /></div>
        <div><label className={lbl}>Descripción</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${field} resize-none`} /></div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={lbl}>Prioridad</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={field}>
              <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="urgent">Urgente</option>
            </select>
          </div>
          <div><label className={lbl}>Fecha límite</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} /></div>
        </div>
        <div>
          <label className={lbl}>Marca (opcional)</label>
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={field}>
            <option value="">—</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Asignar a</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {users.map((u) => (
              <button key={u.id} onClick={() => toggle(u.id)} className={['px-3 py-1.5 rounded-full text-2xs uppercase tracking-widest border transition-colors', assignees.includes(u.id) ? 'bg-ink text-canvas border-ink' : 'border-border text-muted hover:border-ink'].join(' ')}>
                {userLabel(u)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-8">
        <button onClick={onClose} className="px-4 py-2.5 text-2xs uppercase tracking-widest text-muted hover:text-ink transition-colors">Cancelar</button>
        <button
          disabled={!title || saving}
          onClick={async () => { setSaving(true); await onCreate({ title, description, priority, due_date: dueDate || null, brand_id: brandId || null, assignees }) }}
          className="px-5 py-2.5 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Creando…' : 'Crear tarea'}
        </button>
      </div>
    </Overlay>
  )
}

/* ----------------------------- Detail drawer ----------------------------- */
function TaskDetail({ task, users, brands, userById, onClose, onChanged, onDelete }: {
  task: TaskRow; users: StudioUser[]; brands: Brand[]; userById: Record<string, StudioUser>
  onClose: () => void; onChanged: () => void; onDelete: () => void
}) {
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [assignees, setAssigneesState] = useState<string[]>(task.task_assignees.map((a) => a.user_id))
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const lbl = 'block text-2xs uppercase tracking-widest text-muted mb-1.5'
  const field = 'w-full bg-transparent border-b border-border pb-2 text-sm text-ink outline-none focus:border-ink transition-colors'

  async function toggleAssignee(id: string) {
    const next = assignees.includes(id) ? assignees.filter((x) => x !== id) : [...assignees, id]
    setAssigneesState(next)
    await setAssignees(task.id, next, task.title)
    onChanged()
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <h2 className="font-display text-2xl text-ink font-light leading-snug">{task.title}</h2>
        <button onClick={onDelete} className="text-2xs uppercase tracking-widest text-muted hover:text-red-500 transition-colors flex-none">Borrar</button>
      </div>
      {task.description && <p className="text-sm text-muted leading-relaxed mb-6">{task.description}</p>}

      <div className="grid grid-cols-2 gap-5 mb-6">
        <div>
          <label className={lbl}>Estado</label>
          <select value={status} onChange={async (e) => { const s = e.target.value as TaskStatus; setStatus(s); await updateTaskStatus(task.id, s); onChanged() }} className={field}>
            {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Prioridad</label>
          <select value={priority} onChange={async (e) => { const p = e.target.value as TaskPriority; setPriority(p); await updateTask(task.id, { priority: p }); onChanged() }} className={field}>
            <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className={lbl}>Asignados</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {users.map((u) => (
            <button key={u.id} onClick={() => toggleAssignee(u.id)} className={['px-3 py-1.5 rounded-full text-2xs uppercase tracking-widest border transition-colors', assignees.includes(u.id) ? 'bg-ink text-canvas border-ink' : 'border-border text-muted hover:border-ink'].join(' ')}>
              {userLabel(u)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={lbl}>Comentar</label>
        <div className="flex gap-2">
          <input value={comment} onChange={(e) => setComment(e.target.value)} className={field} placeholder="Escribe un comentario…" onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
          <button
            disabled={!comment || posting}
            onClick={async () => { setPosting(true); await addComment(task.id, comment, task.title); setComment(''); setPosting(false); onChanged() }}
            className="px-4 py-2 bg-ink text-canvas text-2xs uppercase tracking-widest hover:bg-ink/90 disabled:opacity-40 transition-colors flex-none"
          >Enviar</button>
        </div>
        <p className="mt-2 text-2xs text-muted">Los asignados recibirán una notificación.</p>
      </div>
    </Overlay>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-canvas border border-border rounded-sm p-7 max-h-[90vh] overflow-y-auto animate-fade-up">
        {children}
      </div>
    </div>
  )
}
