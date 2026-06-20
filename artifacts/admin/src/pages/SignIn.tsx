import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/context/AuthContext";
import { authClient } from "@/lib/neonAuth";

type Phase = "email" | "code";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInPage() {
  const [, setLocation] = useLocation();
  const { refreshSession } = useAuthSession();
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const codeValid = code.trim().length >= 6;

  const sendCode = async () => {
    if (!emailValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });
      if (sendError) {
        setError("تعذّر إرسال الرمز. تحقّق من البريد وحاول مرة أخرى.");
        return;
      }
      setPhase("code");
    } catch {
      setError("تعذّر الاتصال بخدمة المصادقة.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!codeValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: verifyError } = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: code.trim(),
      });
      if (verifyError) {
        setError("الرمز غير صحيح أو منتهي.");
        return;
      }
      await refreshSession();
      setLocation("/dashboard");
    } catch {
      setError("تعذّر التحقق من الرمز.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            أدخل بريد المسؤول لاستلام رمز التحقق
          </p>
        </div>

        {phase === "email" ? (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10 text-right"
                dir="ltr"
                onKeyDown={(e) => e.key === "Enter" && void sendCode()}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button
              className="w-full font-bold"
              size="lg"
              disabled={!emailValid || busy}
              onClick={() => void sendCode()}
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "إرسال رمز التحقق"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              أُرسل الرمز إلى <span className="font-medium text-foreground">{email}</span>
            </p>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="------"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={6}
              className="text-center text-2xl tracking-[0.5em] font-bold"
              dir="ltr"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && void verify()}
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button
              className="w-full font-bold"
              size="lg"
              disabled={!codeValid || busy}
              onClick={() => void verify()}
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "تحقق ودخول"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              disabled={busy}
              onClick={() => {
                setPhase("email");
                setCode("");
                setError(null);
              }}
            >
              تغيير البريد
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
