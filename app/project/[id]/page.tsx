"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { getProject, saveProject } from "@/lib/storage";
import { Project, Task, TaskStatus } from "@/lib/types";
import LoadBar from "@/components/LoadBar";
import TaskBoard from "@/components/TaskBoard";
import RationalePanel from "@/components/RationalePanel";
import TopNav from "@/components/TopNav";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [rebalancingMemberId, setRebalancingMemberId] = useState<string | null>(null);
  const [recentlyMovedTaskIds, setRecentlyMovedTaskIds] = useState<Set<string>>(new Set());
  const [rationale, setRationale] = useState<{ label: string; text: string; tone: "teal" | "coral" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setProject(getProject(id));
  }, [id]);

  const assignedHoursByMember = useMemo(() => {
    const map: Record<string, number> = {};
    if (!project) return map;
    for (const m of project.members) map[m.id] = 0;
    for (const t of project.tasks) {
      if (t.status !== "done" && t.assigneeId && map[t.assigneeId] !== undefined) {
        map[t.assigneeId] += t.estimatedHours;
      }
    }
    return map;
  }, [project]);

  if (project === undefined) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-16 flex items-center gap-2 text-ink/50">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-ink/30 animate-pulseSoft [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-ink/30 animate-pulseSoft [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-ink/30 animate-pulseSoft [animation-delay:300ms]" />
        </span>
        Loading project…
      </main>
    );
  }

  if (project === null) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-ink/60">Project not found on this device/browser.</p>
        <button onClick={() => router.push("/")} className="mt-4 text-teal-dark hover:underline underline-offset-2 text-sm">
          ← Back home
        </button>
      </main>
    );
  }

  function updateProject(updater: (p: Project) => Project) {
    setProject((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveProject(next);
      return next;
    });
  }

  function handleStatusChange(taskId: string, status: TaskStatus) {
    updateProject((p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
  }

  async function handleRebalance(memberId: string) {
    if (!project) return;
    const member = project.members.find((m) => m.id === memberId);
    if (!member) return;

    setError(null);
    setRebalancingMemberId(memberId);

    try {
      const affectedTasks = project.tasks.filter(
        (t) => t.assigneeId === memberId && t.status !== "done"
      );

      if (affectedTasks.length === 0) {
        updateProject((p) => ({
          ...p,
          members: p.members.map((m) => (m.id === memberId ? { ...m, available: false } : m)),
        }));
        setRationale({
          label: "no change needed",
          text: `${member.name} has no unfinished tasks, so there's nothing to redistribute.`,
          tone: "teal",
        });
        setRebalancingMemberId(null);
        return;
      }

      const remainingMembers = project.members
        .filter((m) => m.id !== memberId && m.available)
        .map((m) => ({
          id: m.id,
          name: m.name,
          strengths: m.strengths,
          hoursPerWeek: m.hoursPerWeek,
          currentAssignedHours: assignedHoursByMember[m.id] ?? 0,
        }));

      if (remainingMembers.length === 0) {
        setError("No other available members to reassign tasks to.");
        setRebalancingMemberId(null);
        return;
      }

      const res = await fetch("/api/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unavailableMember: { id: member.id, name: member.name },
          remainingMembers,
          affectedTasks: affectedTasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            estimatedHours: t.estimatedHours,
            status: t.status,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rebalance tasks.");

      const movedIds = new Set<string>(data.reassignments.map((r: any) => r.taskId));

      updateProject((p) => ({
        ...p,
        members: p.members.map((m) => (m.id === memberId ? { ...m, available: false } : m)),
        tasks: p.tasks.map((t) => {
          const reassignment = data.reassignments.find((r: any) => r.taskId === t.id);
          return reassignment ? { ...t, assigneeId: reassignment.newAssigneeId } : t;
        }),
        rebalanceHistory: [
          ...p.rebalanceHistory,
          {
            id: uuidv4(),
            timestamp: Date.now(),
            unavailableMemberName: member.name,
            rationale: data.rationale,
            movedTaskIds: Array.from(movedIds),
          },
        ],
      }));

      setRecentlyMovedTaskIds(movedIds);
      setTimeout(() => setRecentlyMovedTaskIds(new Set()), 1200);

      setRationale({ label: "rebalanced", text: data.rationale, tone: "coral" });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong rebalancing tasks.");
    } finally {
      setRebalancingMemberId(null);
    }
  }

  const totalHours = project.tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const doneCount = project.tasks.filter((t) => t.status === "done").length;

  return (
    <main className="pb-12">
      <TopNav
        rightSlot={
          <button
            onClick={() => router.push("/")}
            className="text-xs font-mono text-ink/40 hover:text-teal-dark transition-colors"
          >
            ← all projects
          </button>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-1.5 tracking-tight">
          {project.name}
        </h1>
        <p className="text-sm text-ink/50 mb-3 max-w-2xl leading-relaxed">{project.assignmentDescription}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-[11px] font-mono text-ink/55 bg-white border border-cardline rounded-md px-2 py-1">
            {project.members.length} teammates
          </span>
          <span className="text-[11px] font-mono text-ink/55 bg-white border border-cardline rounded-md px-2 py-1">
            {doneCount}/{project.tasks.length} tasks done
          </span>
          <span className="text-[11px] font-mono text-ink/55 bg-white border border-cardline rounded-md px-2 py-1">
            {totalHours}h total effort
          </span>
        </div>

        <div className="space-y-4 mb-2">
          {project.breakdownRationale && (
            <RationalePanel
              label="original split"
              text={project.breakdownRationale}
              tone="teal"
              onDismiss={() => updateProject((p) => ({ ...p, breakdownRationale: undefined }))}
            />
          )}

          {rationale && <RationalePanel {...rationale} onDismiss={() => setRationale(null)} />}

          {error && (
            <p className="text-sm text-coral bg-coral-50 border border-coral/20 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          <aside className="lg:col-span-1 space-y-3">
            <h2 className="font-display text-sm font-medium text-ink/60 uppercase tracking-wide">
              Team load
            </h2>
            {project.members.map((m) => (
              <LoadBar
                key={m.id}
                name={m.name}
                strengths={m.strengths}
                assignedHours={assignedHoursByMember[m.id] ?? 0}
                capacityHours={m.hoursPerWeek}
                available={m.available}
                rebalancing={rebalancingMemberId === m.id}
                onToggleUnavailable={() => handleRebalance(m.id)}
              />
            ))}
          </aside>

          <section className="lg:col-span-3">
            <h2 className="font-display text-sm font-medium text-ink/60 uppercase tracking-wide mb-3">
              Tasks
            </h2>
            <TaskBoard
              tasks={project.tasks}
              members={project.members}
              onStatusChange={handleStatusChange}
              recentlyMovedTaskIds={recentlyMovedTaskIds}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
