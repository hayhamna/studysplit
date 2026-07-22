"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { listProjects, saveProject, deleteProject } from "@/lib/storage";
import { Member, Project, ProjectSummary, Task } from "@/lib/types";

interface DraftMember {
  id: string;
  name: string;
  strengths: string;
  hoursPerWeek: string;
}

function newDraftMember(): DraftMember {
  return { id: uuidv4(), name: "", strengths: "", hoursPerWeek: "6" };
}

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectName, setProjectName] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [members, setMembers] = useState<DraftMember[]>([newDraftMember(), newDraftMember()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProjects(listProjects());
  }, []);

  function updateMember(id: string, field: keyof DraftMember, value: string) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  function addMember() {
    setMembers((prev) => [...prev, newDraftMember()]);
  }

  function removeMember(id: string) {
    setMembers((prev) => (prev.length > 2 ? prev.filter((m) => m.id !== id) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validMembers = members.filter((m) => m.name.trim().length > 0);
    if (!projectName.trim() || !assignmentDescription.trim() || validMembers.length < 2) {
      setError("Please add a project name, the assignment description, and at least 2 named teammates.");
      return;
    }

    setLoading(true);
    try {
      const membersForApi = validMembers.map((m) => ({
        id: m.id,
        name: m.name.trim(),
        strengths: m.strengths.trim(),
        hoursPerWeek: Number(m.hoursPerWeek) || 0,
      }));

      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentDescription, members: membersForApi }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate task breakdown.");

      const memberObjs: Member[] = membersForApi.map((m) => ({ ...m, available: true }));
      const taskObjs: Task[] = data.tasks.map((t: any) => ({
        id: uuidv4(),
        title: t.title,
        description: t.description,
        estimatedHours: t.estimatedHours,
        assigneeId: t.assigneeId,
        status: "todo" as const,
      }));

      const project: Project = {
        id: uuidv4(),
        name: projectName.trim(),
        assignmentDescription,
        members: memberObjs,
        tasks: taskObjs,
        createdAt: Date.now(),
        breakdownRationale: data.rationale,
        rebalanceHistory: [],
      };

      saveProject(project);
      router.push(`/project/${project.id}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    deleteProject(id);
    setProjects(listProjects());
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-10">
        <p className="font-mono text-xs tracking-wide text-teal-dark uppercase mb-2">
          for group projects that fall apart when someone flakes
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink">
          StudySplit
        </h1>
        <p className="mt-3 text-ink/60 max-w-xl">
          Paste your assignment, list your teammates, and get a fair task split in
          seconds. When someone disappears mid-project, one click hands their work
          to the rest of the group — instantly, and fairly.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white/70 rounded-xl border border-cardline p-5 sm:p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Project name</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Marketing 302 — Final Campaign"
              className="w-full rounded-md border border-cardline bg-white px-3 py-2 text-sm focus-visible:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">
              Assignment description
            </label>
            <textarea
              value={assignmentDescription}
              onChange={(e) => setAssignmentDescription(e.target.value)}
              rows={5}
              placeholder="Paste the assignment brief, rubric, or a description of what your group needs to deliver."
              className="w-full rounded-md border border-cardline bg-white px-3 py-2 text-sm focus-visible:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-ink/70">Teammates</label>
              <button
                type="button"
                onClick={addMember}
                className="text-xs font-mono text-teal-dark hover:underline"
              >
                + add teammate
              </button>
            </div>
            <div className="space-y-3">
              {members.map((m, idx) => (
                <div key={m.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={m.name}
                    onChange={(e) => updateMember(m.id, "name", e.target.value)}
                    placeholder={`Teammate ${idx + 1} name`}
                    className="col-span-4 rounded-md border border-cardline bg-white px-2 py-1.5 text-sm focus-visible:outline-none"
                  />
                  <input
                    value={m.strengths}
                    onChange={(e) => updateMember(m.id, "strengths", e.target.value)}
                    placeholder="strengths (e.g. writing, coding)"
                    className="col-span-5 rounded-md border border-cardline bg-white px-2 py-1.5 text-sm focus-visible:outline-none"
                  />
                  <input
                    value={m.hoursPerWeek}
                    onChange={(e) => updateMember(m.id, "hoursPerWeek", e.target.value)}
                    type="number"
                    min={0}
                    placeholder="hrs/wk"
                    className="col-span-2 rounded-md border border-cardline bg-white px-2 py-1.5 text-sm focus-visible:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    disabled={members.length <= 2}
                    className="col-span-1 text-ink/30 hover:text-coral disabled:opacity-20 text-sm"
                    aria-label="Remove teammate"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-teal text-white font-medium py-2.5 hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Splitting fairly…" : "Generate fair task split"}
          </button>
        </form>

        <div className="lg:col-span-2">
          <h2 className="font-display text-sm font-medium text-ink/60 uppercase tracking-wide mb-3">
            Your projects
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-ink/40 border border-dashed border-cardline rounded-lg p-4">
              No projects yet. Create one to see it here.
            </p>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="group flex items-center justify-between bg-white/70 border border-cardline rounded-lg px-3 py-2.5 hover:border-teal/40 transition-colors"
                >
                  <button
                    onClick={() => router.push(`/project/${p.id}`)}
                    className="text-left flex-1"
                  >
                    <p className="font-medium text-sm text-ink">{p.name}</p>
                    <p className="text-xs text-ink/45 font-mono">
                      {p.memberCount} members · {p.taskCount} tasks
                    </p>
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-ink/25 hover:text-coral text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2"
                    aria-label="Delete project"
                  >
                    delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
