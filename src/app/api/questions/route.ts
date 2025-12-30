// import { NextResponse } from "next/server";
// import { getQuestions } from "@/lib/questions";
// import { requireAuthedEmail } from "@/lib/auth";

// export async function GET() {
//   try {
//     await requireAuthedEmail();

//     const questions = await getQuestions();
//     return NextResponse.json({ questions });
//   } catch (e: any) {
//     // kalau redirect terjadi di API, lebih baik balikin 401
//     const msg = e?.message ?? "";
//     if (msg.includes("NEXT_REDIRECT")) {
//       return NextResponse.json({ error: "unauthorized" }, { status: 401 });
//     }

//     return NextResponse.json({ error: msg || "Unknown error" }, { status: 500 });
//   }
// }
