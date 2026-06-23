import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  chatMessagesTable,
  contactMessagesTable,
  requestsTable,
  providersTable,
  usersTable,
  skillsTable,
} from "@workspace/db";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { requireRole } from "../lib/auth";

const router: IRouter = Router();

/** قائمة كل محادثات العملاء مع المزوّدين (للمراقبة الإدارية). */
router.get(
  "/admin/chat/conversations",
  requireRole("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const allMessages = await db
      .select()
      .from(chatMessagesTable)
      .orderBy(desc(chatMessagesTable.createdAt));

    type Conv = {
      requestId: number;
      providerId: number;
      lastMessage: string | null;
      lastMessageAt: string | null;
      messageCount: number;
    };
    const byKey = new Map<string, Conv>();

    for (const m of allMessages) {
      const key = `${m.requestId}:${m.providerId}`;
      let conv = byKey.get(key);
      if (!conv) {
        conv = {
          requestId: m.requestId,
          providerId: m.providerId,
          lastMessage: null,
          lastMessageAt: null,
          messageCount: 0,
        };
        byKey.set(key, conv);
      }
      conv.messageCount += 1;
      if (conv.lastMessageAt === null) {
        conv.lastMessage = m.body;
        conv.lastMessageAt = m.createdAt.toISOString();
      }
    }

    const reqIds = [...new Set([...byKey.values()].map((c) => c.requestId))];
    const provIds = [...new Set([...byKey.values()].map((c) => c.providerId))];

    const reqRows = reqIds.length
      ? await db.select().from(requestsTable).where(inArray(requestsTable.id, reqIds))
      : [];
    const provRows = provIds.length
      ? await db.select().from(providersTable).where(inArray(providersTable.id, provIds))
      : [];

    const skillIds = [...new Set(reqRows.map((r) => r.skillId))];
    const skillRows = skillIds.length
      ? await db.select().from(skillsTable).where(inArray(skillsTable.id, skillIds))
      : [];
    const skillById = new Map(skillRows.map((s) => [s.id, s]));

    const userIds = [
      ...new Set([
        ...reqRows.map((r) => r.userId),
        ...provRows.map((p) => p.userId),
      ]),
    ];
    const userRows = userIds.length
      ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds))
      : [];
    const userById = new Map(userRows.map((u) => [u.id, u]));

    const reqById = new Map(reqRows.map((r) => [r.id, r]));
    const provById = new Map(provRows.map((p) => [p.id, p]));

    const conversations = [...byKey.values()]
      .map((c) => {
        const request = reqById.get(c.requestId);
        const provider = provById.get(c.providerId);
        if (!request || !provider) return null;
        const customer = userById.get(request.userId);
        const providerUser = userById.get(provider.userId);
        const skill = skillById.get(request.skillId);
        return {
          requestId: c.requestId,
          providerId: c.providerId,
          requestNumber: request.requestNumber,
          requestStatus: request.status,
          skillName: skill?.name ?? null,
          customerName: customer?.name ?? null,
          providerName: providerUser?.name ?? null,
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          messageCount: c.messageCount,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) =>
        (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""),
      );

    res.json(conversations);
  },
);

/** قراءة رسائل محادثة محددة (أدمن فقط). */
router.get(
  "/admin/chat/messages",
  requireRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const requestId = Number(req.query.requestId);
    const providerId = Number(req.query.providerId);
    if (!Number.isInteger(requestId) || !Number.isInteger(providerId)) {
      res.status(400).json({ error: "requestId and providerId required" });
      return;
    }

    const rows = await db
      .select({
        id: chatMessagesTable.id,
        requestId: chatMessagesTable.requestId,
        providerId: chatMessagesTable.providerId,
        senderId: chatMessagesTable.senderId,
        body: chatMessagesTable.body,
        isRead: chatMessagesTable.isRead,
        createdAt: chatMessagesTable.createdAt,
        senderName: usersTable.name,
      })
      .from(chatMessagesTable)
      .innerJoin(usersTable, eq(chatMessagesTable.senderId, usersTable.id))
      .where(
        and(
          eq(chatMessagesTable.requestId, requestId),
          eq(chatMessagesTable.providerId, providerId),
        ),
      )
      .orderBy(asc(chatMessagesTable.createdAt));

    res.json(
      rows.map((r) => ({
        id: r.id,
        requestId: r.requestId,
        providerId: r.providerId,
        senderId: r.senderId,
        senderName: r.senderName,
        body: r.body,
        isRead: r.isRead,
        createdAt: r.createdAt,
      })),
    );
  },
);

/** عدد الرسائل غير المقروءة/المفتوحة للأدمن (للشارة على التطبيق). */
router.get(
  "/admin/inbox/summary",
  requireRole("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const openContact = await db
      .select({ id: contactMessagesTable.id })
      .from(contactMessagesTable)
      .where(eq(contactMessagesTable.status, "open"));

    const recentChat = await db
      .select({ id: chatMessagesTable.id })
      .from(chatMessagesTable)
      .orderBy(desc(chatMessagesTable.createdAt))
      .limit(1);

    res.json({
      openContactMessages: openContact.length,
      hasChatActivity: recentChat.length > 0,
      generatedAt: new Date().toISOString(),
    });
  },
);

export default router;
