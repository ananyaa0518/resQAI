import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Report from "../../../../../models/Report";
import User from "../../../../../models/User";
import { verifyToken } from "../../../../../lib/jwt";

export async function POST(request, { params }) {
  try {
    await connectDB();

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = params;
    const { status, notes } = await request.json();

    if (!['Verified', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'Verified' or 'Rejected'" },
        { status: 400 }
      );
    }

    // Update report
    const report = await Report.findByIdAndUpdate(
      id,
      {
        status,
        verifiedBy: user._id,
        verificationNotes: notes,
        verifiedAt: new Date()
      },
      { new: true }
    ).populate('reportedBy', 'name phoneNumber');

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: `Report ${status.toLowerCase()} successfully`,
      report: {
        id: report._id,
        status: report.status,
        verifiedBy: user.name,
        verificationNotes: report.verificationNotes,
        verifiedAt: report.verifiedAt
      }
    });

  } catch (error) {
    console.error("Report verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
