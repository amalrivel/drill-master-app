import { NextResponse } from "next/server";
import { getQuestions } from "@/lib/questions";

export async function GET() {
  try {
    const questions = await getQuestions();
    return NextResponse.json({ questions });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
