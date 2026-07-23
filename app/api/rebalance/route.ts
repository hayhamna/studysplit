import { NextRequest, NextResponse } from "next/server";
import { rebalanceTasks } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { unavailableMember, remainingMembers, affectedTasks } = body;

    if (!unavailableMember || !Array.isArray(remainingMembers) || remainingMembers.length === 0) {
      return NextResponse.json(
        { error: "unavailableMember and at least one remaining member are required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(affectedTasks) || affectedTasks.length === 0) {
      return NextResponse.json({ rationale: "No unfinished tasks to reassign.", reassignments: [] });
    }

    const result = await rebalanceTasks({ unavailableMember, remainingMembers, affectedTasks });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Something went wrong rebalancing tasks." },
      { status: 500 }
    );
  }
}
