import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Report from "../../../models/Report";
import User from "../../../models/User";
import { verifyToken } from "../../../lib/jwt";
import { enhancedClassification } from "../../../lib/disasterClassification";

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 3; // 3 requests per hour
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);
  rateLimitMap.set(ip, validRequests);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  
  return true;
}

export async function POST(request) {
  try {
    await connectDB();

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 3 reports per hour." },
        { status: 429 }
      );
    }

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

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const formData = await request.formData();
    const description = formData.get('description');
    const longitude = parseFloat(formData.get('longitude'));
    const latitude = parseFloat(formData.get('latitude'));
    const isSOS = formData.get('isSOS') === 'true';
    const images = formData.getAll('images');

    // Validate required fields
    if (!description || isNaN(longitude) || isNaN(latitude)) {
      return NextResponse.json(
        { error: "Description and valid coordinates are required" },
        { status: 400 }
      );
    }

    // Classify disaster type using ML
    const classification = enhancedClassification(description);

    // Create report
    const report = new Report({
      description,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      disasterType: classification.type,
      confidence: classification.confidence,
      isSOS,
      reportedBy: user._id,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
    });

    await report.save();

    // Populate user data for response
    await report.populate('reportedBy', 'name phoneNumber');

    return NextResponse.json({
      message: "Report submitted successfully",
      report: {
        id: report._id,
        description: report.description,
        disasterType: report.disasterType,
        confidence: report.confidence,
        status: report.status,
        isSOS: report.isSOS,
        createdAt: report.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Report submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const disasterType = searchParams.get('disasterType');
    const isSOS = searchParams.get('isSOS');
    const limit = parseInt(searchParams.get('limit')) || 100;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (disasterType) query.disasterType = disasterType;
    if (isSOS !== null) query.isSOS = isSOS === 'true';

    // Get reports
    const reports = await Report.find(query)
      .populate('reportedBy', 'name phoneNumber')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ reports });

  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
