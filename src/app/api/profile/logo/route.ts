import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";
import { supabaseServer } from "@/lib/supabase/server";

// POST /api/profile/logo - Upload logo
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Logo upload - userId:", userId); // Debug log

    const data = await request.formData();
    const file = data.get("logo") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "png";
    const fileName = `${userId}-${uuidv4()}.${fileExtension}`;
    const filePath = `logos/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } =
      await supabaseServer.storage
        .from("profile-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true // Replace if exists
        });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to upload logo: ${uploadError.message}`
        },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl }
    } = supabaseServer.storage.from("profile-assets").getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: { url: publicUrl },
      message: "Logo uploaded successfully"
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/logo - Remove logo
export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current profile
    const { data: existingProfile } = await supabaseServer
      .from("user_profiles")
      .select("logo_url")
      .eq("user_id", userId)
      .single();

    if (!existingProfile?.logo_url) {
      return NextResponse.json(
        { success: false, error: "No logo to delete" },
        { status: 400 }
      );
    }

    // Delete logo file from storage
    try {
      // Extract file path from URL
      const url = new URL(existingProfile.logo_url);
      const filePath = url.pathname.split("/").slice(-2).join("/"); // Get last two parts (bucket/filename)

      await supabaseServer.storage.from("profile-assets").remove([filePath]);
    } catch (error) {
      console.log("Could not delete logo file:", error);
    }

    // Update profile to remove logo URL
    const { error: updateError } = await supabaseServer
      .from("user_profiles")
      .update({ logo_url: null })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Logo removed successfully"
    });
  } catch (error) {
    console.error("Logo removal error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove logo" },
      { status: 500 }
    );
  }
}
