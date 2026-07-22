import { Project, ProjectSummary } from "./types";

const INDEX_KEY = "studysplit:index";
const projectKey = (id: string) => `studysplit:project:${id}`;

function readIndex(): ProjectSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as ProjectSummary[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(index: ProjectSummary[]) {
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function listProjects(): ProjectSummary[] {
  return readIndex().sort((a, b) => b.createdAt - a.createdAt);
}

export function getProject(id: string): Project | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(projectKey(id));
    return raw ? (JSON.parse(raw) as Project) : null;
  } catch {
    return null;
  }
}

export function saveProject(project: Project) {
  window.localStorage.setItem(projectKey(project.id), JSON.stringify(project));
  const index = readIndex();
  const existing = index.findIndex((p) => p.id === project.id);
  const summary: ProjectSummary = {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    memberCount: project.members.length,
    taskCount: project.tasks.length,
  };
  if (existing >= 0) {
    index[existing] = summary;
  } else {
    index.push(summary);
  }
  writeIndex(index);
}

export function deleteProject(id: string) {
  window.localStorage.removeItem(projectKey(id));
  writeIndex(readIndex().filter((p) => p.id !== id));
}
