import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { UpdateUserProfile } from "@/types/database";

// GET /api/profile - Get user profile
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user profile exists
    const { data: existingProfile, error } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If profile doesn't exist, return null
      if (error.code === "PGRST116") {
        return NextResponse.json({
          success: true,
          data: null,
          message: "No profile found"
        });
      }

      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to retrieve profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: existingProfile,
      message: "Profile retrieved successfully"
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve profile" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update or create user profile
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Prepare profile data (only include fields that are provided)
    const profileData: UpdateUserProfile = {};

    // Business information
    if (body.business_name !== undefined) {
      if (!body.business_name?.trim()) {
        return NextResponse.json(
          { success: false, error: "Business name cannot be empty" },
          { status: 400 }
        );
      }
      profileData.business_name = body.business_name.trim();
    }

    if (body.business_email !== undefined) {
      if (body.business_email?.trim()) {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.business_email.trim())) {
          return NextResponse.json(
            { success: false, error: "Please provide a valid email address" },
            { status: 400 }
          );
        }
        profileData.business_email = body.business_email.trim();
      } else {
        profileData.business_email = null;
      }
    }

    if (body.business_phone !== undefined) {
      profileData.business_phone = body.business_phone?.trim() || null;
    }

    if (body.business_address !== undefined) {
      profileData.business_address = body.business_address?.trim() || null;
    }

    if (body.logo_url !== undefined) {
      profileData.logo_url = body.logo_url || null;
    }

    if (body.default_currency !== undefined) {
      profileData.default_currency = body.default_currency || "USD";
    }

    // Update or create profile using upsert
    const upsertData = {
      user_id: userId,
      ...profileData,
      updated_at: new Date().toISOString()
    };

    const { data: profile, error } = await supabaseServer
      .from("user_profiles")
      .upsert(upsertData, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Supabase upsert error:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { success: false, error: `Failed to save profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
      message: "Profile saved successfully"
    });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
