import { NextResponse } from "next/server";
import { initializeDefaultUser } from "@/lib/auth";

export async function POST() {
  try {
    const result = await initializeDefaultUser();

    return NextResponse.json({
      success: true,
      message: result.created
        ? "Platform admin initialized successfully"
        : "Platform admin already exists",
      mcpToken: result.mcpToken,
      hint: result.mcpToken
        ? "Store the platform MCP token now; it is not shown again."
        : undefined,
    });
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
