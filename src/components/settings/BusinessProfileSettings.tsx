"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  BuildingIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  UploadIcon,
  XIcon,
  SaveIcon,
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface BusinessProfileData {
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  logo_url: string;
}

export function BusinessProfileSettings() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<BusinessProfileData>({
    business_name: "",
    business_email: "",
    business_phone: "",
    business_address: "",
    logo_url: ""
  });

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const result = await response.json();
          console.log("data", result);
          if (result.data) {
            setFormData({
              business_name: result.data.business_name || "",
              business_email:
                result.data.business_email ||
                user.emailAddresses[0]?.emailAddress ||
                "",
              business_phone: result.data.business_phone || "",
              business_address: result.data.business_address || "",
              logo_url: result.data.logo_url || ""
            });
          } else {
            // Set default email if no profile exists
            setFormData((prev) => ({
              ...prev,
              business_email: user.emailAddresses[0]?.emailAddress || ""
            }));
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  // Handle form field changes
  const handleChange = (field: keyof BusinessProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle logo upload (only uploads file, doesn't save profile)
  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    try {
      setUploadingLogo(true);

      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/profile/logo", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload logo");
      }

      const result = await response.json();

      // Update the form state with the new logo URL
      const newLogoUrl = result.data.url;
      setFormData((prev) => ({ ...prev, logo_url: newLogoUrl }));
      setHasUnsavedChanges(true);

      toast.success(
        "Logo uploaded successfully! Remember to save your changes."
      );
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload logo"
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle logo removal
  const handleRemoveLogo = async () => {
    try {
      setUploadingLogo(true);

      const response = await fetch("/api/profile/logo", {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove logo");
      }

      setFormData((prev) => ({ ...prev, logo_url: "" }));
      toast.success("Logo removed successfully");
    } catch (error) {
      console.error("Logo removal error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove logo"
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Business name is required
    if (!formData.business_name.trim()) {
      newErrors.business_name = "Business name is required";
    }

    // Email validation
    if (formData.business_email && formData.business_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.business_email.trim())) {
        newErrors.business_email = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle saving profile changes
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast.error("You must be logged in to save settings");
      return;
    }

    try {
      setLoading(true);

      // Prepare data for submission
      const submitData = {
        business_name: formData.business_name.trim(),
        business_email: formData.business_email.trim(),
        business_phone: formData.business_phone.trim() || null,
        business_address: formData.business_address.trim() || null,
        logo_url: formData.logo_url || null,
        default_currency: "USD"
      };

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      const result = await response.json();
      setHasUnsavedChanges(false);
      toast.success(result.message || "Profile saved successfully");
    } catch (error) {
      console.error("Profile save error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  if (loadingProfile) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Company Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            {formData.logo_url ? (
              <div className="relative">
                <img
                  src={formData.logo_url}
                  alt="Company logo"
                  className="w-24 h-24 object-contain border border-gray-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={uploadingLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}

            <div className="flex-1">
              <Label htmlFor="logo" className="text-sm font-medium">
                Upload Logo
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                JPG, PNG or GIF. Max size 5MB.
              </p>
              <div className="flex items-center gap-2">
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("logo")?.click()}
                  disabled={uploadingLogo}
                  className="gap-2"
                >
                  <UploadIcon className="w-4 h-4" />
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BuildingIcon className="w-5 h-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="flex items-center gap-2">
              <BuildingIcon className="w-4 h-4" />
              Business Name *
            </Label>
            <Input
              id="businessName"
              type="text"
              value={formData.business_name}
              onChange={(e) => handleChange("business_name", e.target.value)}
              placeholder="Enter your business or company name"
              className={errors.business_name ? "border-red-500" : ""}
              disabled={loading}
              required
            />
            {errors.business_name && (
              <p className="text-red-500 text-sm">{errors.business_name}</p>
            )}
          </div>

          <Separator />

          {/* Business Email */}
          <div className="space-y-2">
            <Label htmlFor="businessEmail" className="flex items-center gap-2">
              <MailIcon className="w-4 h-4" />
              Business Email *
            </Label>
            <Input
              id="businessEmail"
              type="email"
              value={formData.business_email}
              onChange={(e) => handleChange("business_email", e.target.value)}
              placeholder="Enter your business email address"
              className={errors.business_email ? "border-red-500" : ""}
              disabled={loading}
              required
            />
            {errors.business_email && (
              <p className="text-red-500 text-sm">{errors.business_email}</p>
            )}
            <p className="text-gray-500 text-sm">
              This email will appear on your invoices and be used for customer
              communication
            </p>
          </div>

          <Separator />

          {/* Business Phone */}
          <div className="space-y-2">
            <Label htmlFor="businessPhone" className="flex items-center gap-2">
              <PhoneIcon className="w-4 h-4" />
              Business Phone
            </Label>
            <Input
              id="businessPhone"
              type="tel"
              value={formData.business_phone}
              onChange={(e) => handleChange("business_phone", e.target.value)}
              placeholder="Enter your business phone number (optional)"
              disabled={loading}
            />
            <p className="text-gray-500 text-sm">
              Will be displayed on invoices for client contact
            </p>
          </div>

          <Separator />

          {/* Business Address */}
          <div className="space-y-2">
            <Label
              htmlFor="businessAddress"
              className="flex items-center gap-2"
            >
              <MapPinIcon className="w-4 h-4" />
              Business Address
            </Label>
            <Textarea
              id="businessAddress"
              value={formData.business_address}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleChange("business_address", e.target.value)
              }
              placeholder="Enter your complete business address (optional)"
              rows={3}
              disabled={loading}
            />
            <p className="text-gray-500 text-sm">
              Will be displayed on invoices as your business address
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={loading || uploadingLogo}
          className="gap-2"
          variant={hasUnsavedChanges ? "default" : "outline"}
        >
          <SaveIcon className="w-4 h-4" />
          {loading
            ? "Saving..."
            : hasUnsavedChanges
            ? "Save Changes"
            : "No Changes"}
        </Button>
      </div>
    </form>
  );
}
