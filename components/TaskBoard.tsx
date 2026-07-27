"use client";

import { Task, TaskStatus, Member } from "@/lib/types";

const COLUMNS: {
  key: TaskStatus;
  label: string;
  dot: string;
  headerText: string;
}[] = [
  { key: "todo", label: "To do", dot: "bg-ink/30", headerText: "text-ink/60" },
  { key: "in_progress", label: "In progress", dot: "bg-gold", headerText: "text-gold-dark" },
  { key: "done", label: "Done", dot: "bg-teal", headerText: "text-teal-dark" },
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
          <div key={col.key} className="bg-card/40 rounded-xl p-3 min-h-[180px]">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} aria-hidden="true" />
              <h3 className={`font-display font-medium text-sm ${col.headerText}`}>{col.label}</h3>
              <span className="font-mono text-xs text-ink/35 ml-auto">{colTasks.length}</span>
            </div>
            <div className="space-y-2.5">
              {colTasks.length === 0 && (
                <p className="text-xs text-ink/35 px-2 py-6 text-center border border-dashed border-cardline rounded-lg">
                  Nothing here
                </p>
              )}
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg border border-cardline p-3.5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gold/50 ${
                    recentlyMovedTaskIds.has(task.id) ? "animate-slideIn ring-2 ring-teal/30" : ""
                  }`}
                >
                  <p className="font-medium text-sm text-ink leading-snug">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-ink/55 mt-1.5 leading-relaxed">{task.description}</p>
                  )}
                  <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
                    <span className="text-[11px] font-mono text-teal-dark bg-teal-50 rounded-md px-1.5 py-0.5">
                      {memberName(members, task.assigneeId)}
                    </span>
                    <span className="text-[11px] font-mono text-ink/45 bg-ink/[0.04] rounded-md px-1.5 py-0.5">
                      {task.estimatedHours}h
                    </span>
                  </div>
                  <div className="mt-2.5 flex gap-1 flex-wrap">
                    {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
                      <button
                        key={c.key}
                        onClick={() => onStatusChange(task.id, c.key)}
                        className="text-[11px] rounded-md px-2 py-1 bg-ink/[0.04] text-ink/55 hover:bg-ink/[0.08] hover:text-ink/80 transition-colors"
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
