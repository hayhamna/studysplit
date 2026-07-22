// gemini-2.0-flash is no longer part of the free tier lineup (as of 2026, free
// tier covers only 2.5 Pro / 2.5 Flash / 2.5 Flash-Lite) and returns a hard
// limit:0 quota error on free-tier keys. gemini-2.5-flash-lite has the most
// generous free daily quota of the current lineup, so it's the safest default
// for a student project. Swap to "gemini-2.5-flash" for higher quality if you
// have quota to spare.
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiCallOptions {
  systemInstruction: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
}

async function callGemini({
  systemInstruction,
  userPrompt,
  responseSchema,
}: GeminiCallOptions) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it as an environment variable (see README)."
    );
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.4,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  return JSON.parse(text);
}

// ---------- Feature 1: break the assignment into a fair task list ----------

export const BREAKDOWN_SYSTEM_PROMPT = `You are StudySplit's task-planning assistant. Group project members give you an assignment description and a list of teammates with their strengths and weekly available hours.

Your job:
1. Break the assignment into concrete, actionable tasks (not vague phases). Each task should be something one person can own and finish.
2. Estimate realistic effort in hours for each task, based on the assignment's apparent scope.
3. Assign each task to the teammate whose stated strengths best match it, while keeping total assigned hours roughly proportional to each person's stated weekly availability. Do not give one person everything just because they look most skilled — balance load first, then match skill.
4. Write a short, plain-English rationale (2-4 sentences) explaining the overall split logic, so the group understands why it's fair.

Be concrete and specific to the assignment text given. Never invent teammates that were not listed. Every task must be assigned to exactly one of the provided member IDs.`;

const breakdownSchema = {
  type: "object",
  properties: {
    rationale: { type: "string" },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          estimatedHours: { type: "number" },
          assigneeId: { type: "string" },
        },
        required: ["title", "description", "estimatedHours", "assigneeId"],
      },
    },
  },
  required: ["rationale", "tasks"],
};

export async function breakdownAssignment(
  assignmentDescription: string,
  members: { id: string; name: string; strengths: string; hoursPerWeek: number }[]
) {
  const userPrompt = `Assignment description:
"""
${assignmentDescription}
"""

Team members (use these exact IDs when assigning tasks):
${members
  .map(
    (m) =>
      `- id: ${m.id} | name: ${m.name} | strengths: ${m.strengths || "not specified"} | available hours/week: ${m.hoursPerWeek}`
  )
  .join("\n")}

Return the task breakdown as JSON matching the schema.`;

  return callGemini({
    systemInstruction: BREAKDOWN_SYSTEM_PROMPT,
    userPrompt,
    responseSchema: breakdownSchema,
  });
}

// ---------- Feature 2: rebalance tasks when someone becomes unavailable ----------

export const REBALANCE_SYSTEM_PROMPT = `You are StudySplit's rebalancing assistant. A member of a group project has just become unavailable partway through. You must redistribute ONLY that person's unfinished tasks among the remaining available members.

Rules:
1. Never touch tasks that are already marked "done" — leave them assigned to the original owner for the record.
2. Never touch tasks already owned by someone other than the unavailable member.
3. Redistribute the unavailable member's "todo" and "in_progress" tasks across the remaining available members.
4. Balance by remaining workload: consider each remaining member's current total assigned hours and their stated weekly available hours, so nobody gets overloaded. Prefer members with more spare capacity and relevant strengths for each specific task.
5. It is fine to split load unevenly if strengths clearly justify it, but always explain why in the rationale.
6. Write a short, plain-English rationale (2-4 sentences) a stressed group of students would actually find reassuring and clear.

Return which task IDs moved and their new assigneeId. Do not modify task titles, descriptions or hours.`;

const rebalanceSchema = {
  type: "object",
  properties: {
    rationale: { type: "string" },
    reassignments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          newAssigneeId: { type: "string" },
        },
        required: ["taskId", "newAssigneeId"],
      },
    },
  },
  required: ["rationale", "reassignments"],
};

export async function rebalanceTasks(params: {
  unavailableMember: { id: string; name: string };
  remainingMembers: {
    id: string;
    name: string;
    strengths: string;
    hoursPerWeek: number;
    currentAssignedHours: number;
  }[];
  affectedTasks: {
    id: string;
    title: string;
    description: string;
    estimatedHours: number;
    status: string;
  }[];
}) {
  const { unavailableMember, remainingMembers, affectedTasks } = params;

  const userPrompt = `Unavailable member: ${unavailableMember.name} (id: ${unavailableMember.id})

Their unfinished tasks that need reassignment:
${affectedTasks
  .map(
    (t) =>
      `- id: ${t.id} | title: "${t.title}" | ${t.estimatedHours}h | status: ${t.status} | notes: ${t.description}`
  )
  .join("\n")}

Remaining available members (use these exact IDs):
${remainingMembers
  .map(
    (m) =>
      `- id: ${m.id} | name: ${m.name} | strengths: ${m.strengths || "not specified"} | available hours/week: ${m.hoursPerWeek} | currently assigned: ${m.currentAssignedHours}h`
  )
  .join("\n")}

Return the reassignments as JSON matching the schema.`;

  return callGemini({
    systemInstruction: REBALANCE_SYSTEM_PROMPT,
    userPrompt,
    responseSchema: rebalanceSchema,
  });
}
