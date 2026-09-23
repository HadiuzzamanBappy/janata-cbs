import { type NextRequest, NextResponse } from "next/server";
import { dispatch, type Envelope } from "@/lib/core/dispatch";
import { getSession } from "@/lib/core/redis-session";
import { env } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProxyBody {
  requestType?: string;
  servicePath?: string;
  controlName?: string;
  recordFunction?: string;
  recordId?: string;
  authLevel?: number;
  data?: Record<string, unknown>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session || !session.currUser) {
      return NextResponse.json(
        {
          status: "FAIL",
          statusCode: 401,
          message: "User session expired or unauthorized",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    const { token, userId, currUser } = session;
    const body = (await req.json()) as ProxyBody;

    if (!body.requestType) {
      return NextResponse.json(
        {
          status: "FAIL",
          statusCode: 400,
          message: "Request type is missing in proxy payload",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const servicePath = body.servicePath
      ? body.servicePath
      : env.NEXT_PUBLIC_DEFAULT_SERVICE_PATH || "default";

    const envelope: Envelope = {
      servicePath,
      requestType: body.requestType,
      controlName: body.controlName ?? "",
      branchCode: currUser.branchCode,
      recordFunction: body.recordFunction || "S",
      recordId: body.recordId || "",
      authLevel: body.authLevel ?? 1,
      userId,
      clientId: "WEB-CLIENT",
      data: body.data ?? {},
    };

    const response = await dispatch(envelope, token);
    return NextResponse.json(response, { status: response.statusCode || 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "ERROR",
        statusCode: 500,
        message: err?.message || "Internal Proxy Dispatch Error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
