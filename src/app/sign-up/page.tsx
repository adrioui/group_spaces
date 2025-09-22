"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, useSendOTP, useVerifyOTP } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Link from "next/link";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export default function SignUpPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const sendOTP = useSendOTP();
  const verifyOTP = useVerifyOTP();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (session?.user && !isNewUser) {
      router.push("/spaces");
    }
  }, [session, router, isNewUser]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const formatPhoneDisplay = (phone: string) => {
    try {
      if (isValidPhoneNumber(phone)) {
        const parsed = parsePhoneNumber(phone);
        return parsed ? parsed.formatInternational() : phone;
      }
    } catch {}
    return phone;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate phone number
      if (!phoneNumber.trim()) {
        setError("Please enter a phone number");
        return;
      }

      // Check if valid phone number
      if (!isValidPhoneNumber(phoneNumber)) {
        setError("Please enter a valid phone number with country code (e.g., +1234567890)");
        return;
      }

      // Parse and format phone number
      const parsed = parsePhoneNumber(phoneNumber);
      if (!parsed) {
        setError("Invalid phone number format");
        return;
      }

      const formattedPhone = parsed.format('E.164');

      const { error } = await sendOTP.mutateAsync({
        phoneNumber: formattedPhone,
      });

      if (error) {
        setError(error.message || "Failed to send OTP");
        return;
      }

      setStep("otp");
      setResendTimer(60); // 60 second cooldown
      setOtpCode(""); // Clear any previous OTP
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse phone number again for consistency
      const parsed = parsePhoneNumber(phoneNumber);
      if (!parsed) {
        setError("Invalid phone number");
        return;
      }

      const formattedPhone = parsed.format('E.164');

      const { error } = await verifyOTP.mutateAsync({
        phoneNumber: formattedPhone,
        code: otpCode,
      });

      if (error) {
        setError(error.message || "Invalid verification code");
        return;
      }

      // Check if this is a new user who needs to set up their profile
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();

      if (sessionData?.user && !sessionData.user.name) {
        // New user, needs to complete profile
        setIsNewUser(true);
        setStep("profile");
      } else {
        // Existing user, redirect to spaces
        setTimeout(() => router.push("/spaces"), 100);
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!name.trim()) {
        setError("Please enter your name");
        return;
      }

      // Update user profile with name
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Redirect to spaces after profile update
      router.push("/spaces");
    } catch (err: any) {
      setError(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError(null);

    try {
      const parsed = parsePhoneNumber(phoneNumber);
      if (!parsed) {
        setError("Invalid phone number");
        return;
      }

      const formattedPhone = parsed.format('E.164');

      const { error } = await sendOTP.mutateAsync({
        phoneNumber: formattedPhone,
      });

      if (error) {
        setError(error.message || "Failed to resend OTP");
        return;
      }

      setResendTimer(60);
      setOtpCode("");
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">
            {step === "profile" ? "Complete your profile" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "phone" ? "Enter your phone number to get started"
            : step === "otp" ? "Enter the verification code"
            : "Tell us a bit about yourself"}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                autoComplete="tel"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US, +44 for UK)
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending code..." : "Send verification code"}
            </Button>
          </form>
        ) : step === "otp" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Phone number</Label>
              <p className="text-sm text-muted-foreground">{formatPhoneDisplay(phoneNumber)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <InputOTP
                value={otpCode}
                onChange={setOtpCode}
                maxLength={6}
                onComplete={handleVerifyOTP}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to your phone
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              onClick={handleVerifyOTP}
              className="w-full"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? "Verifying..." : "Verify code"}
            </Button>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                  setOtpCode("");
                }}
                disabled={loading}
              >
                Change phone number
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={loading || resendTimer > 0}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                This is how you'll appear to other users
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Complete setup"}
            </Button>
          </form>
        )}

        {step !== "profile" && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}