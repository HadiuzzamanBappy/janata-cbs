import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { getSession, updateSession } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChangePasswordBody {
  oldPassword?: string;
  newPassword?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: "Session expired. Please sign in again." },
        { status: 401 },
      );
    }

    const { oldPassword, newPassword } = (await req.json()) as ChangePasswordBody;
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "Old password and new password are required." },
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
