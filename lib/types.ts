export type TaskStatus = "todo" | "in_progress" | "done";

export interface Member {
  id: string;
  name: string;
  strengths: string;
  hoursPerWeek: number;
  available: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  assigneeId: string | null;
  status: TaskStatus;
}

export interface RebalanceEvent {
  id: string;
  timestamp: number;
  unavailableMemberName: string;
  rationale: string;
  movedTaskIds: string[];
}

export interface Project {
  id: string;
  name: string;
  assignmentDescription: string;
  members: Member[];
  tasks: Task[];
  createdAt: number;
  breakdownRationale?: string;
  rebalanceHistory: RebalanceEvent[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: number;
  memberCount: number;
  taskCount: number;
}
