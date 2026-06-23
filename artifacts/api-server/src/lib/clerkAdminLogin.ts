import { SignJWT, jwtVerify } from "jose";
import { isAllowedAdminEmail } from "./adminAccess";

const CLERK_BAPI = "https://api.clerk.com/v1";

type CookieJar = Map<string, string>;

type JarState = {
  client?: string;
  dev?: string;
};

type PendingOtpClaims = {
  typ: "admin_otp";
  email: string;
  signInId: string;
  jar: JarState;
};

type SignInResponse = {
  id?: string;
  status?: string;
  created_session_id?: string | null;
  supported_first_factors?: Array<{
    strategy?: string;
    email_address_id?: string;
  }>;
};

type SignInPayload = {
  response?: SignInResponse;
};

type TokenPayload = { jwt?: string };

export class ClerkLoginError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
  ) {
    super(message);
    this.name = "ClerkLoginError";
  }
}

function secretKey(): string {
  const key = process.env.CLERK_SECRET_KEY?.trim();
  if (!key) throw new Error("CLERK_SECRET_KEY is not configured");
  return key;
}

/** عنوان Clerk الخاص بتطبيقك (من المفتاح العام pk_test_...). */
export function clerkFrontendApiUrl(): string {
  const pk = process.env.CLERK_PUBLISHABLE_KEY?.trim();
  if (!pk) {
    throw new Error("CLERK_PUBLISHABLE_KEY is not configured");
  }
  const encoded = pk.replace(/^pk_(test|live)_/, "");
  const domain = Buffer.from(encoded, "base64")
    .toString("utf8")
    .replace(/\$$/, "");
  return `https://${domain}`;
}

function cookieHeader(jar: CookieJar): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function absorbCookies(jar: CookieJar, res: Response): void {
  const lines =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  for (const line of lines) {
    const [pair] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) {
      jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
}

function jarToState(jar: CookieJar): JarState {
  return {
    client: jar.get("__client"),
    dev: jar.get("__dev_session"),
  };
}

function jarFromState(state: JarState): CookieJar {
  const jar: CookieJar = new Map();
  if (state.client) jar.set("__client", state.client);
  if (state.dev) jar.set("__dev_session", state.dev);
  return jar;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `رد Clerk غير مفهوم (${res.status}): ${text.slice(0, 120)}`,
    );
  }
}

async function bapiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${CLERK_BAPI}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

function fapiUrl(path: string, jar: CookieJar): string {
  const base = clerkFrontendApiUrl();
  const dev = jar.get("__dev_session");
  let url = `${base}${path}`;
  if (dev) {
    url += `${url.includes("?") ? "&" : "?"}__dev_session=${encodeURIComponent(dev)}`;
  }
  return url;
}

function fapiHeaders(jar: CookieJar, form = false): Record<string, string> {
  const headers: Record<string, string> = {};
  const clientJwt = jar.get("__client");
  if (clientJwt) {
    headers.Authorization = `Bearer ${clientJwt}`;
  } else if (jar.size > 0) {
    headers.Cookie = cookieHeader(jar);
  }
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  return headers;
}

async function initFapiClient(): Promise<CookieJar> {
  const jar: CookieJar = new Map();

  if (secretKey().includes("_test_")) {
    const devRes = await fetch(fapiUrl("/v1/dev_browser", jar), {
      method: "POST",
    });
    absorbCookies(jar, devRes);
    const devBody = await readJson(devRes);
    if (
      devBody &&
      typeof devBody === "object" &&
      "token" in devBody &&
      typeof (devBody as { token: unknown }).token === "string"
    ) {
      jar.set("__dev_session", (devBody as { token: string }).token);
    }
  }

  const clientRes = await fetch(fapiUrl("/v1/client", jar), {
    method: "POST",
    headers: fapiHeaders(jar),
  });
  absorbCookies(jar, clientRes);
  await readJson(clientRes);

  if (!jar.get("__client") && !jar.get("__dev_session")) {
    throw new Error("تعذّر تهيئة جلسة Clerk");
  }

  return jar;
}

async function fapiPost(
  jar: CookieJar,
  path: string,
  body: URLSearchParams,
  native = false,
): Promise<{ res: Response; data: unknown }> {
  let url = fapiUrl(path, jar);
  if (native && jar.get("__client")) {
    url += `${url.includes("?") ? "&" : "?"}_is_native=1`;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: fapiHeaders(jar, true),
    body: body.toString(),
  });
  absorbCookies(jar, res);
  return { res, data: await readJson(res) };
}

async function signPendingToken(claims: PendingOtpClaims): Promise<string> {
  const secret = new TextEncoder().encode(secretKey());
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(secret);
}

async function verifyPendingToken(token: string): Promise<PendingOtpClaims> {
  const secret = new TextEncoder().encode(secretKey());
  const { payload } = await jwtVerify(token, secret);
  if (payload.typ !== "admin_otp") {
    throw new ClerkLoginError("انتهت صلاحية الجلسة — أعد إرسال الكود", 401);
  }
  return payload as unknown as PendingOtpClaims;
}

export async function assertAdminEmail(email: string): Promise<void> {
  if (!(await isAllowedAdminEmail(email))) {
    throw new ClerkLoginError(
      "هذا الإيميل غير مصرّح له بالدخول كأدمن",
      403,
    );
  }
}

function pickEmailAddressId(signIn: SignInResponse | undefined): string | undefined {
  return signIn?.supported_first_factors?.find(
    (f) => f.strategy === "email_code",
  )?.email_address_id;
}

async function createSessionJwt(
  jar: CookieJar,
  sessionId: string,
): Promise<string> {
  const tokenBody = new URLSearchParams();
  const { res: tokenRes, data: tokenData } = await fapiPost(
    jar,
    `/v1/client/sessions/${sessionId}/tokens`,
    tokenBody,
    true,
  );
  const jwt = (tokenData as TokenPayload).jwt;
  if (!tokenRes.ok || !jwt) {
    throw new ClerkLoginError("تعذّر إنشاء رمز الجلسة", 500);
  }
  return jwt;
}

async function resolveClerkUserId(email: string): Promise<string> {
  const usersRes = await bapiFetch(
    `/users?email_address[]=${encodeURIComponent(email)}`,
  );
  const usersData = (await readJson(usersRes)) as {
    data?: Array<{ id?: string }>;
  };
  const clerkUserId = usersData.data?.[0]?.id;
  if (!usersRes.ok || !clerkUserId) {
    throw new ClerkLoginError("لا يوجد حساب Clerk بهذا الإيميل", 401);
  }
  return clerkUserId;
}

function guardSignInStatus(signIn: SignInResponse | undefined): void {
  const status = signIn?.status;
  if (status === "needs_second_factor" || status === "needs_client_trust") {
    throw new ClerkLoginError(
      "الحساب يحتاج تحقق إضافي — راجع إعدادات Clerk",
      403,
    );
  }
}

/** الخطوة 1: إرسال كود OTP إلى إيميل الأدمن. */
export async function clerkAdminSendEmailCode(
  email: string,
): Promise<{ loginToken: string }> {
  const normalized = email.trim().toLowerCase();
  await assertAdminEmail(normalized);
  await resolveClerkUserId(normalized);

  const jar = await initFapiClient();

  const createBody = new URLSearchParams({ identifier: normalized });
  const { res: createRes, data: createData } = await fapiPost(
    jar,
    "/v1/client/sign_ins",
    createBody,
    true,
  );
  const created = createData as SignInPayload;
  const signIn = created.response;
  const signInId = signIn?.id;

  if (!createRes.ok || !signInId) {
    throw new ClerkLoginError("تعذّر بدء تسجيل الدخول", 401);
  }

  const prepareBody = new URLSearchParams({ strategy: "email_code" });
  const emailAddressId = pickEmailAddressId(signIn);
  if (emailAddressId) {
    prepareBody.set("email_address_id", emailAddressId);
  }

  const { res: prepareRes, data: prepareData } = await fapiPost(
    jar,
    `/v1/client/sign_ins/${signInId}/prepare_first_factor`,
    prepareBody,
    true,
  );
  const prepared = prepareData as SignInPayload;
  guardSignInStatus(prepared.response);

  if (!prepareRes.ok || prepared.response?.status !== "needs_first_factor") {
    throw new ClerkLoginError(
      "تسجيل الدخول بالكود غير مفعّل — فعّله من إعدادات Clerk",
      503,
    );
  }

  const loginToken = await signPendingToken({
    typ: "admin_otp",
    email: normalized,
    signInId,
    jar: jarToState(jar),
  });

  return { loginToken };
}

/** الخطوة 2: التحقق من الكود وإرجاع JWT الجلسة. */
export async function clerkAdminVerifyEmailCode(
  loginToken: string,
  code: string,
): Promise<{ sessionJwt: string; authUserId: string; email: string }> {
  const pending = await verifyPendingToken(loginToken);
  const normalizedCode = code.trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    throw new ClerkLoginError("أدخل الكود المكوّن من 6 أرقام", 400);
  }

  const jar = jarFromState(pending.jar);
  const attemptBody = new URLSearchParams({
    strategy: "email_code",
    code: normalizedCode,
  });

  const { res: attemptRes, data: attemptData } = await fapiPost(
    jar,
    `/v1/client/sign_ins/${pending.signInId}/attempt_first_factor`,
    attemptBody,
    true,
  );
  const attempt = attemptData as SignInPayload;
  const signIn = attempt.response;
  guardSignInStatus(signIn);

  const sessionId = signIn?.created_session_id ?? undefined;
  if (!attemptRes.ok || signIn?.status !== "complete" || !sessionId) {
    throw new ClerkLoginError("الكود غير صحيح أو منتهي الصلاحية", 401);
  }

  const authUserId = await resolveClerkUserId(pending.email);
  const sessionJwt = await createSessionJwt(jar, sessionId);

  return { sessionJwt, authUserId, email: pending.email };
}

/** تسجيل دخول أدمن بكلمة المرور (احتياطي). */
export async function clerkAdminPasswordLogin(
  email: string,
  password: string,
): Promise<{ sessionJwt: string; authUserId: string }> {
  const normalized = email.trim().toLowerCase();
  const clerkUserId = await resolveClerkUserId(normalized);

  const verifyRes = await bapiFetch(
    `/users/${clerkUserId}/verify_password`,
    {
      method: "POST",
      body: JSON.stringify({ password }),
    },
  );
  if (verifyRes.status === 422 || verifyRes.status === 400) {
    throw new ClerkLoginError("إيميل أو كلمة مرور غير صحيحة", 401);
  }
  if (!verifyRes.ok) {
    throw new ClerkLoginError("فشل التحقق من كلمة المرور", 401);
  }

  const jar = await initFapiClient();
  const signInBody = new URLSearchParams({
    strategy: "password",
    identifier: normalized,
    password,
  });
  const { res: signInRes, data: signInData } = await fapiPost(
    jar,
    "/v1/client/sign_ins",
    signInBody,
    true,
  );
  const signIn = (signInData as SignInPayload).response;
  guardSignInStatus(signIn);

  const sessionId = signIn?.created_session_id ?? undefined;
  if (!signInRes.ok || signIn?.status !== "complete" || !sessionId) {
    throw new ClerkLoginError("إيميل أو كلمة مرور غير صحيحة", 401);
  }

  const sessionJwt = await createSessionJwt(jar, sessionId);
  return { sessionJwt, authUserId: clerkUserId };
}
