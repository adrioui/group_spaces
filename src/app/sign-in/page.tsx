"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, useSendOTP, useVerifyOTP } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Link from "next/link";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const sendOTP = useSendOTP();
  const verifyOTP = useVerifyOTP();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (session?.user) {
      const callbackUrl = searchParams.get("callbackUrl") || "/spaces";
      router.push(callbackUrl);
    }
  }, [session, router, searchParams]);

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

      // Small delay to ensure session is established
      setTimeout(() => {
        const callbackUrl = searchParams.get("callbackUrl") || "/spaces";
        router.push(callbackUrl);
      }, 100);
    } catch (err: any) {
      setError(err?.message || "Verification failed");
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

  const registered = searchParams.get("registered") === "true";

  return (
    <div className="min-h-dvh grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            {step === "phone" ? "Enter your phone number to sign in" : "Enter the verification code"}
          </p>
          {registered && (
            <p className="mt-2 text-xs text-emerald-600">Registration successful. Please sign in.</p>
          )}
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
        ) : (
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
              {loading ? "Verifying..." : "Verify and sign in"}
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
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}