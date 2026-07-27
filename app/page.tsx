"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { listProjects, saveProject, deleteProject } from "@/lib/storage";
import { Member, Project, ProjectSummary, Task } from "@/lib/types";
import TopNav from "@/components/TopNav";

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
    <main>
      {/* Nav */}
      <TopNav
        maxWidth="max-w-5xl"
        rightSlot={
          <a
            href="#create"
            className="text-sm font-medium text-ink/70 hover:text-teal-dark transition-colors px-3.5 py-2 rounded-lg hover:bg-ink/[0.04]"
          >
            New project
          </a>
        }
      />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          <div>
            <p className="font-mono text-xs tracking-wide text-teal-dark uppercase mb-3">
              for group projects that fall apart when someone flakes
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink leading-[1.05]">
              Fair work.
              <br />
              Happier teams.
            </h1>
            <p className="mt-4 text-ink/60 max-w-md leading-relaxed">
              Paste your assignment, list your teammates, and StudySplit's AI turns it
              into a fair task split in seconds — balancing effort against real
              availability, not just who looks most capable.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a
                href="#create"
                className="inline-flex items-center justify-center rounded-lg bg-teal text-white font-medium px-5 py-3 transition-all duration-150 hover:bg-teal-dark active:scale-[0.99]"
              >
                Start a project
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-cardline bg-white text-ink/70 font-medium px-5 py-3 transition-colors hover:border-teal/40 hover:text-teal-dark"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Static preview illustration of the load-bar / rebalance concept */}
          <div className="hidden lg:block" aria-hidden="true">
            <div className="bg-white rounded-2xl border border-cardline shadow-sm p-5">
              <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40 mb-3">
                Team load
              </p>
              <div className="space-y-3">
                {[
                  { name: "Priya", pct: 62, available: true },
                  { name: "Marcus", pct: 88, available: true },
                  { name: "Ahmed", pct: 0, available: false },
                ].map((m) => (
                  <div key={m.name} className={`rounded-lg border bg-white p-2.5 ${m.available ? "border-cardline" : "border-cardline border-l-[3px] border-l-coral"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-ink">{m.name}</span>
                      {!m.available && (
                        <span className="text-[10px] font-mono text-coral">unavailable</span>
                      )}
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-card overflow-hidden">
                      <div
                        className={`h-full rounded-full ${m.pct > 80 ? "bg-coral" : "bg-teal"}`}
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                disabled
                className="mt-4 w-full rounded-lg bg-coral/90 text-white text-xs font-medium py-2 cursor-default"
              >
                Rebalance tasks
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <h2 className="font-display text-sm font-medium text-ink/60 uppercase tracking-wide mb-6 text-center">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              step: "1",
              title: "Describe the assignment",
              text: "Paste the brief and list your teammates with their strengths and available hours.",
            },
            {
              step: "2",
              title: "AI creates a fair split",
              text: "Tasks are estimated in hours and assigned by balancing skill against real availability.",
            },
            {
              step: "3",
              title: "Rebalance in one click",
              text: "If someone drops out, their unfinished work is redistributed instantly, with an explanation.",
            },
          ].map((s) => (
            <div key={s.step} className="bg-white rounded-xl border border-cardline p-5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-gold text-ink font-mono text-xs font-medium mb-3 bg-white">
                {s.step}
              </span>
              <p className="font-display font-medium text-ink text-sm mb-1.5">{s.title}</p>
              <p className="text-sm text-ink/55 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Create + your projects */}
      <section id="create" className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 scroll-mt-6">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-ink tracking-tight">
            Start a project
          </h2>
          <p className="text-sm text-ink/55 mt-1">
            Fill this in once — the AI split and task board are generated automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-3 bg-white rounded-2xl border border-cardline p-5 sm:p-7 space-y-6 shadow-sm"
          >
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">Project name</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Marketing 302 — Final Campaign"
                className="w-full rounded-lg border border-cardline bg-white px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">
                Assignment description
              </label>
              <textarea
                value={assignmentDescription}
                onChange={(e) => setAssignmentDescription(e.target.value)}
                rows={5}
                placeholder="Paste the assignment brief, rubric, or a description of what your group needs to deliver."
                className="w-full rounded-lg border border-cardline bg-white px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/15"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-sm font-medium text-ink/70">Teammates</label>
                <button
                  type="button"
                  onClick={addMember}
                  className="text-xs font-mono text-teal-dark hover:text-teal-dark hover:underline underline-offset-2"
                >
                  + add teammate
                </button>
              </div>
              <div className="space-y-2.5">
                {members.map((m, idx) => (
                  <div key={m.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      value={m.name}
                      onChange={(e) => updateMember(m.id, "name", e.target.value)}
                      placeholder={`Teammate ${idx + 1} name`}
                      className="col-span-4 rounded-lg border border-cardline bg-white px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/15"
                    />
                    <input
                      value={m.strengths}
                      onChange={(e) => updateMember(m.id, "strengths", e.target.value)}
                      placeholder="strengths (e.g. writing, coding)"
                      className="col-span-5 rounded-lg border border-cardline bg-white px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/15"
                    />
                    <input
                      value={m.hoursPerWeek}
                      onChange={(e) => updateMember(m.id, "hoursPerWeek", e.target.value)}
                      type="number"
                      min={0}
                      placeholder="hrs/wk"
                      className="col-span-2 rounded-lg border border-cardline bg-white px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/15"
                    />
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      disabled={members.length <= 2}
                      className="col-span-1 h-8 rounded-md text-ink/30 hover:text-coral hover:bg-coral-50 transition-colors disabled:opacity-20 disabled:hover:bg-transparent text-sm"
                      aria-label="Remove teammate"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-coral bg-coral-50 border border-coral/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal text-white font-medium py-3 transition-all duration-150 hover:bg-teal-dark active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulseSoft [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulseSoft [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulseSoft [animation-delay:300ms]" />
                  </span>
                  Splitting fairly…
                </span>
              ) : (
                "Generate fair task split"
              )}
            </button>
          </form>

          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-medium text-ink/60 uppercase tracking-wide mb-3">
              Your projects
            </h3>
            {projects.length === 0 ? (
              <div className="text-sm text-ink/45 border border-dashed border-cardline rounded-xl p-5 text-center">
                <p className="font-medium text-ink/60 mb-1">Start your first project</p>
                <p>Fill in the form and your project will show up here.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="group flex items-center justify-between bg-white border border-cardline rounded-xl px-3.5 py-3 transition-all duration-150 hover:border-teal/40 hover:shadow-sm"
                  >
                    <button
                      onClick={() => router.push(`/project/${p.id}`)}
                      className="text-left flex-1 min-w-0"
                    >
                      <p className="font-medium text-sm text-ink truncate">{p.name}</p>
                      <p className="text-xs text-ink/45 font-mono mt-0.5">
                        {p.memberCount} members · {p.taskCount} tasks
                      </p>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-ink/25 hover:text-coral text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 shrink-0"
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
      </section>
    </main>
  );
}
