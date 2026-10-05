import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/redis";
import { getEnquiryData } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ cmd: string }> },
): Promise<NextResponse> {
    try {
        const { cmd } = await params;
        if (!cmd) {
            return NextResponse.json(
                { success: false, error: "Command parameter is required" },
                { status: 400 },
            );
        }

        const session = await getSession();
        if (!session?.token) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Active session required" },
                { status: 401 },
            );
        }

        const schema = await getEnquiryData(cmd, session.token);

        if (!schema) {
            return NextResponse.json(
                { success: false, error: `Inquiry schema not found for command "${cmd}"` },
                { status: 404 },
            );
        }

        return NextResponse.json({ success: true, data: schema }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal Inquiry Schema Fetch Error";
        return NextResponse.json(
            {
                success: false,
                error: message,
            },
            { status: 500 },
        );
    }
}
