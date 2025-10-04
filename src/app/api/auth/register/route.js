import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { generateToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    await connectDB();

    const { phoneNumber, password, name } = await request.json();

    // Validate required fields
    if (!phoneNumber || !password || !name) {
      return NextResponse.json(
        { error: "Phone number, password, and name are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this phone number already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      phoneNumber,
      password,
      name,
    });

    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    // Return user data (without password) and token
    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          role: user.role,
        },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
