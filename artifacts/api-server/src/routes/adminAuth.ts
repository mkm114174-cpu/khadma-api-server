import { Router, type IRouter, type Request, type Response } from "express";
import { ensureAdminDbUser } from "../lib/adminAccess";
import {
  ClerkLoginError,
  clerkAdminPasswordLogin,
  clerkAdminSendEmailCode,
  clerkAdminVerifyEmailCode,
} from "../lib/clerkAdminLogin";

const router: IRouter = Router();

function clerkEnvGuard(res: Response): boolean {
  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    res.status(503).json({
      error: "أضف CLERK_SECRET_KEY في إعدادات Render ثم أعد النشر",
    });
    return false;
  }
  if (!process.env.CLERK_PUBLISHABLE_KEY?.trim()) {
    res.status(503).json({
      error: "أضف CLERK_PUBLISHABLE_KEY في إعدادات Render ثم أعد النشر",
    });
    return false;
  }
  return true;
}

async function finishAdminLogin(
  res: Response,
  email: string,
  sessionJwt: string,
  authUserId: string,
): Promise<void> {
  const dbUser = await ensureAdminDbUser(authUserId, email);
  if (!dbUser || dbUser.role !== "admin") {
    res.status(403).json({
      error: "هذا الحساب ليس أدمن — استخدم حساب إدارة المنصة",
    });
    return;
  }

  res.json({
    token: sessionJwt,
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
    },
  });
}

function handleAuthError(res: Response, err: unknown): void {
  if (err instanceof ClerkLoginError) {
    res.status(err.httpStatus).json({ error: err.message });
    return;
  }
  res.status(500).json({
    error: "تعذّر تسجيل الدخول، حاول مجدداً",
    detail: err instanceof Error ? err.message : String(err),
  });
}

/** الخطوة 1 — إرسال كود OTP إلى إيميل الأدمن. */
router.post("/admin/auth/send-code", async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: "أدخل البريد الإلكتروني" });
    return;
  }
  if (!clerkEnvGuard(res)) return;

  try {
    const result = await clerkAdminSendEmailCode(email);
    res.json({
      ok: true,
      loginToken: result.loginToken,
      message: "تم إرسال الكود إلى بريدك — تحقق من صندوق الوارد والرسائل المزعجة",
    });
  } catch (err) {
    handleAuthError(res, err);
  }
});

/** الخطوة 2 — التحقق من الكود وإتمام الدخول. */
router.post("/admin/auth/verify-code", async (req: Request, res: Response) => {
  const loginToken = String(req.body?.loginToken ?? "").trim();
  const code = String(req.body?.code ?? "").trim();
  if (!loginToken || !code) {
    res.status(400).json({ error: "أدخل الكود المرسل إلى إيميلك" });
    return;
  }
  if (!clerkEnvGuard(res)) return;

  try {
    const { sessionJwt, authUserId, email } =
      await clerkAdminVerifyEmailCode(loginToken, code);
    await finishAdminLogin(res, email, sessionJwt, authUserId);
  } catch (err) {
    handleAuthError(res, err);
  }
});

/** تسجيل دخول بكلمة المرور (احتياطي). */
router.post("/admin/auth/login", async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!email || !password) {
    res.status(400).json({ error: "أدخل الإيميل وكلمة المرور" });
    return;
  }
  if (!clerkEnvGuard(res)) return;

  try {
    const { sessionJwt, authUserId } = await clerkAdminPasswordLogin(
      email,
      password,
    );
    await finishAdminLogin(res, email, sessionJwt, authUserId);
  } catch (err) {
    handleAuthError(res, err);
  }
});

export default router;
