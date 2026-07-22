"use client";

import { Task, TaskStatus, Member } from "@/lib/types";

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

interface TaskBoardProps {
  tasks: Task[];
  members: Member[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  recentlyMovedTaskIds: Set<string>;
}

function memberName(members: Member[], id: string | null) {
  if (!id) return "Unassigned";
  return members.find((m) => m.id === id)?.name ?? "Unknown";
}

export default function TaskBoard({ tasks, members, onStatusChange, recentlyMovedTaskIds }: TaskBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className="bg-card/50 rounded-xl p-3 min-h-[200px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-display font-medium text-sm text-ink/70">{col.label}</h3>
              <span className="font-mono text-xs text-ink/40">{colTasks.length}</span>
            </div>
            <div className="space-y-2">
              {colTasks.length === 0 && (
                <p className="text-xs text-ink/35 px-1 py-4 text-center">Nothing here.</p>
              )}
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg border border-cardline p-3 shadow-sm ${
                    recentlyMovedTaskIds.has(task.id) ? "animate-slideIn ring-1 ring-teal/40" : ""
                  }`}
                >
                  <p className="font-medium text-sm text-ink">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-ink/55 mt-1 leading-relaxed">{task.description}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-teal-dark bg-teal/10 rounded px-1.5 py-0.5">
                      {memberName(members, task.assigneeId)} · {task.estimatedHours}h
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
                      <button
                        key={c.key}
                        onClick={() => onStatusChange(task.id, c.key)}
                        className="text-[11px] rounded px-1.5 py-1 bg-ink/5 text-ink/60 hover:bg-ink/10 transition-colors"
                      >
                        → {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
