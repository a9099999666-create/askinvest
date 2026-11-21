import { NextResponse } from "next/server";
import { createPropertyDraft } from "@/lib/crm/content";
import { requireUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const user = await requireUser("editContent");
    const body = await req.json();
    const result = await createPropertyDraft(user, body);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
