import { verifyToken } from "@clerk/backend";

/** Verify a Clerk session JWT (admin web panel). */
export async function verifyClerkAuthToken(
  token: string,
): Promise<{ authUserId: string; email: string | null } | null> {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) return null;

  try {
    const payload = await verifyToken(token, { secretKey });
    const authUserId = payload.sub;
    if (!authUserId) return null;

    const rawEmail = payload.email ?? payload.primary_email_address;
    const email =
      typeof rawEmail === "string" && rawEmail.includes("@") ? rawEmail : null;

    return { authUserId, email };
  } catch {
    return null;
  }
}
