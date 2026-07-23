// Groq: free, no credit card, no billing tiers, no region restrictions —
// far more reliable for a student project than Gemini's free tier has been.
// Groq's API is OpenAI-compatible, so we use plain fetch + JSON mode.
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqCallOptions {
  systemInstruction: string;
  userPrompt: string;
}

async function callGroq({ systemInstruction, userPrompt }: GroqCallOptions) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it as an environment variable (see README)."
    );
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned an empty response.");
  return JSON.parse(text);
}

// ---------- Feature 1: break the assignment into a fair task list ----------

export const BREAKDOWN_SYSTEM_PROMPT = `You are StudySplit's task-planning assistant. Group project members give you an assignment description and a list of teammates with their strengths and weekly available hours.

Your job:
1. Break the assignment into concrete, actionable tasks (not vague phases). Each task should be something one person can own and finish.
2. Estimate realistic effort in hours for each task, based on the assignment's apparent scope.
3. Assign each task to the teammate whose stated strengths best match it, while keeping total assigned hours roughly proportional to each person's stated weekly availability. Do not give one person everything just because they look most skilled — balance load first, then match skill.
4. Write a short, plain-English rationale (2-4 sentences) explaining the overall split logic, so the group understands why it's fair.

Be concrete and specific to the assignment text given. Never invent teammates that were not listed. Every task must be assigned to exactly one of the provided member IDs.

Respond ONLY with valid JSON in exactly this shape, no other text:
{
  "rationale": "string",
  "tasks": [
    { "title": "string", "description": "string", "estimatedHours": number, "assigneeId": "string" }
  ]
}`;

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

Return the task breakdown as JSON matching the required shape.`;

  return callGroq({ systemInstruction: BREAKDOWN_SYSTEM_PROMPT, userPrompt });
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

Return which task IDs moved and their new assigneeId. Do not modify task titles, descriptions or hours.

Respond ONLY with valid JSON in exactly this shape, no other text:
{
  "rationale": "string",
  "reassignments": [
    { "taskId": "string", "newAssigneeId": "string" }
  ]
}`;

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

Return the reassignments as JSON matching the required shape.`;

  return callGroq({ systemInstruction: REBALANCE_SYSTEM_PROMPT, userPrompt });
}
