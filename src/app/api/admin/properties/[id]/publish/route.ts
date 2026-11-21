import { NextResponse } from "next/server";
import { publishProperty } from "@/lib/crm/content";
import { requireUser } from "@/lib/auth/session";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser("publish");
    const { id } = await ctx.params;
    const version = await publishProperty(user, id);
    return NextResponse.json({ version });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 403 },
    );
  }
}
