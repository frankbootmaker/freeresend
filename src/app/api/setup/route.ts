import { NextResponse } from "next/server";
import { initializeDefaultUser } from "@/lib/auth";

export async function POST() {
  try {
    const result = await initializeDefaultUser();

    const message = result.skipped
      ? "ADMIN_EMAIL and ADMIN_PASSWORD are not set in the web container"
      : result.created
        ? "Platform admin initialized successfully"
        : "Platform admin password synced from ADMIN_EMAIL / ADMIN_PASSWORD";

    return NextResponse.json({
      success: !result.skipped,
      message,
      mcpToken: result.mcpToken,
      hint: result.mcpToken
        ? "Store the platform MCP token now; it is not shown again."
        : undefined,
    }, { status: result.skipped ? 400 : 200 });
  } catch (error: unknown) {
    const errorObj = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: errorObj.message,
      },
      { status: 500 }
    );
  }
}
