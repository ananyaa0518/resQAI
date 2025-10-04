import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Since we're using cookies, the logout is handled on the client side
    // This endpoint is here for consistency and future server-side logout logic
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}