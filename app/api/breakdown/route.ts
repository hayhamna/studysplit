import { NextRequest, NextResponse } from "next/server";
import { breakdownAssignment } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assignmentDescription, members } = body;

    if (!assignmentDescription || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: "assignmentDescription and at least one member are required." },
        { status: 400 }
      );
    }

    const result = await breakdownAssignment(assignmentDescription, members);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Something went wrong generating the task breakdown." },
      { status: 500 }
    );
  }
}
