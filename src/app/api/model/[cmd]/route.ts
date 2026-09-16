import { NextRequest, NextResponse } from "next/server";
import { parseGMC } from "@/lib/schema/schema-parser";
import { STATIC_SPECS } from "@/lib/mocks";
import { grpcProcess } from "@/lib/core/grpc";
import { getServiceUrl } from "@/lib/core/services";
import { getOrSet } from "@/lib/core/cache";
import { env } from "@/lib/env";
import { type FormSchema } from "@/lib/schema/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchSchemaFromBackend(
  command: string,
  token?: string
): Promise<FormSchema | null> {
  const cleanCmd = command.split(",")[0].trim().toUpperCase();

  if (env.MODEL_SOURCE === "static") {
    const rawMock = STATIC_SPECS[cleanCmd];
    if (!rawMock) return null;
    const parsed = parseGMC(rawMock, cleanCmd);
    return parsed.success ? parsed.data : null;
  }

  try {
    const targetServiceKey =
      process.env.NODE_ENV === "development" ? "defaultdev" : "default";
    const address = getServiceUrl(targetServiceKey);

    const res = await grpcProcess(
      address,
      "nonfinancial",
      {
        idempotencyKey: "",
        clientId: "WEB-CLIENT",
        requestType: env.MODEL_REQUEST_TYPE || "GMC",
        controlName: "?",
        recordFunction: "S",
        recordId: cleanCmd,
        branchCode: env.NEXT_PUBLIC_CENTRAL_BRANCH || "JB9999",
        authLevel: 1,
        userId: "SYSUSER",
        data: {},
      },
      { token }
    );

    if (res.statusCode !== 200 || !res.data) {
      const rawMock = STATIC_SPECS[cleanCmd];
      if (!rawMock) return null;
      const parsed = parseGMC(rawMock, cleanCmd);
      return parsed.success ? parsed.data : null;
    }

    const parsed = parseGMC(res.data, cleanCmd);
    if (parsed.success) return parsed.data;

    const rawMock = STATIC_SPECS[cleanCmd];
    if (!rawMock) return null;
    const fallbackParsed = parseGMC(rawMock, cleanCmd);
    return fallbackParsed.success ? fallbackParsed.data : null;
  } catch (err) {
    console.warn(`[model-api] gRPC GMC fetch failed for ${cleanCmd}, falling back to static mock:`, err);
    const rawMock = STATIC_SPECS[cleanCmd];
    if (!rawMock) return null;
    const parsed = parseGMC(rawMock, cleanCmd);
    return parsed.success ? parsed.data : null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cmd: string }> }
): Promise<NextResponse> {
  try {
    const { cmd } = await params;
    if (!cmd) {
      return NextResponse.json(
        { success: false, error: "Command parameter is required" },
        { status: 400 }
      );
    }

    const cleanCommand = cmd.toUpperCase();
    const cacheKey = `spec:${cleanCommand}`;

    const schema = await getOrSet(
      cacheKey,
      () => fetchSchemaFromBackend(cleanCommand),
      env.SPEC_TTL_SECONDS || 3600
    );

    if (!schema) {
      return NextResponse.json(
        { success: false, error: `Schema not found for command "${cleanCommand}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: schema }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal Schema Fetch Error" },
      { status: 500 }
    );
  }
}
