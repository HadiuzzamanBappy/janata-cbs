import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/core-config";
import { changePasswordSchema } from "@/lib/data-schemas";
import { getSession, updateSession } from "@/lib/infra-redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session expired. Please sign in again." },
        { status: 401 },
      );
    }

    const rawBody = await req.json();
    const parsed = changePasswordSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid password data.",
          errors: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    // 2. Update active Redis session to set initLogin = false
    await updateSession({
      currUser: {
        ...session.currUser,
        initLogin: false,
      },
    });

    // 3. Remove the initLogin HTTP cookie restriction
    const store = await cookies();
    store.delete(appConfig.auth.initLoginCookie);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update password.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
