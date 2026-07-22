"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { getProject, saveProject } from "@/lib/storage";
import { Project, Task, TaskStatus } from "@/lib/types";
import LoadBar from "@/components/LoadBar";
import TaskBoard from "@/components/TaskBoard";
import RationalePanel from "@/components/RationalePanel";

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
    return <main className="max-w-5xl mx-auto px-6 py-16 text-ink/50">Loading…</main>;
  }

  if (project === null) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-ink/60">Project not found on this device/browser.</p>
        <button onClick={() => router.push("/")} className="mt-4 text-teal-dark underline text-sm">
          Back home
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

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <button onClick={() => router.push("/")} className="text-xs font-mono text-ink/40 hover:text-teal-dark mb-4">
        ← all projects
      </button>

      <h1 className="font-display text-3xl font-semibold text-ink mb-1">{project.name}</h1>
      <p className="text-sm text-ink/50 mb-6 max-w-2xl">{project.assignmentDescription}</p>

      {project.breakdownRationale && (
        <div className="mb-6">
          <RationalePanel
            label="original split"
            text={project.breakdownRationale}
            tone="teal"
            onDismiss={() => updateProject((p) => ({ ...p, breakdownRationale: undefined }))}
          />
        </div>
      )}

      {rationale && (
        <div className="mb-6">
          <RationalePanel {...rationale} onDismiss={() => setRationale(null)} />
        </div>
      )}

      {error && <p className="text-sm text-coral mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
    </main>
  );
}
