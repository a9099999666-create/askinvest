import { NextResponse } from "next/server";
import { savePropertyVersion } from "@/lib/crm/content";
import { requireUser } from "@/lib/auth/session";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser("editContent");
    const { id } = await ctx.params;
    const body = await req.json();
    const version = await savePropertyVersion(
      user,
      id,
      body.expectedUpdatedAt || "",
      body,
    );
    return NextResponse.json({ version });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof Error && e.message === "VERSION_CONFLICT") {
      return NextResponse.json(
        {
          error: "VERSION_CONFLICT",
          current: (e as Error & { current: unknown }).current,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
