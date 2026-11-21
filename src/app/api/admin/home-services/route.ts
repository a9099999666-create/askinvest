import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { setHomeFeaturedServices } from "@/lib/crm/content";

export async function POST(req: Request) {
  try {
    const user = await requireUser("publish");
    const body = (await req.json()) as { ids?: string[] };
    const ids = await setHomeFeaturedServices(user, body.ids || []);
    return NextResponse.json({ ids });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
