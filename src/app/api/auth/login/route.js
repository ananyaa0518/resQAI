import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../../models/User";
import { generateToken } from "../../../../lib/jwt";

export async function POST(request) {
  try {
    await connectDB();

    const { phoneNumber, password } = await request.json();

    // Validate required fields
    if (!phoneNumber || !password) {
      return NextResponse.json(
        { error: "Phone number and password are required" },
        { status: 400 }
      );
    }

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    // Return user data (without password) and token
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
