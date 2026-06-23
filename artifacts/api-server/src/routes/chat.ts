import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  chatMessagesTable,
  requestsTable,
  providersTable,
  usersTable,
  notificationsTable,
  type ServiceRequest,
  type Provider,
} from "@workspace/db";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { SendChatMessageBody, MarkChatReadBody } from "@workspace/api-zod";
import { requireUser, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

type Participant = {
  request: ServiceRequest;
  provider: Provider;
  amCustomer: boolean;
  amProvider: boolean;
};

/**
 * Resolve whether the current user may participate in the (requestId,
 * providerId) conversation. A conversation is valid ONLY between the customer
 * and the assigned provider AFTER the request has been accepted — there is no
 * pre-acceptance chat. This keeps negotiation (and contact exchange) inside the
 * platform until a deal is struck. Returns null (with a sent response) when not
 * allowed.
 */
async function resolveParticipant(
  req: Request,
  res: Response,
  requestId: number,
  providerId: number,
): Promise<Participant | null> {
  const user = (req as AuthedRequest).dbUser!;
  const [request] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, requestId))
    .limit(1);
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return null;
  }
  const [provider] = await db
    .select()
    .from(providersTable)
    .where(eq(providersTable.id, providerId))
    .limit(1);
  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return null;
  }

  const amCustomer = request.userId === user.id;
  const amProvider = provider.userId === user.id;
  if (!amCustomer && !amProvider) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  // The conversation is only valid once this provider has been ASSIGNED to the
  // request (i.e. the customer accepted their offer). No pre-acceptance chat.
  const isAssigned = request.providerId === providerId;
  if (!isAssigned) {
    res
      .status(400)
      .json({ error: "Chat is available after the request is accepted" });
    return null;
  }

  return { request, provider, amCustomer, amProvider };
}

router.get(
  "/chat/conversations",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;

    // Requests the user owns (customer side).
    const ownedRequests = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.userId, user.id));
    const ownedRequestIds = ownedRequests.map((r) => r.id);

    // Provider profile (provider side), if any.
    const [myProvider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.userId, user.id))
      .limit(1);

    // All chat messages where the user is a participant (customer of the
    // request OR the provider). Fetch desc and filter per-row so the same path
    // works whether the user is a customer, a provider, or both.
    if (ownedRequestIds.length === 0 && !myProvider) {
      res.json([]);
      return;
    }
    const ownedRequestIdSet = new Set(ownedRequestIds);
    const allMessages = (
      await db
        .select()
        .from(chatMessagesTable)
        .orderBy(desc(chatMessagesTable.createdAt))
    ).filter(
      (m) =>
        ownedRequestIdSet.has(m.requestId) ||
        (myProvider != null && m.providerId === myProvider.id),
    );

    // Group by (requestId, providerId).
    type Conv = {
      requestId: number;
      providerId: number;
      lastMessage: string | null;
      lastMessageAt: string | null;
      unreadCount: number;
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
          unreadCount: 0,
        };
        byKey.set(key, conv);
      }
      // messages are desc; first seen is the latest.
      if (conv.lastMessageAt === null) {
        conv.lastMessage = m.body;
        conv.lastMessageAt = m.createdAt.toISOString();
      }
      if (m.senderId !== user.id && !m.isRead) conv.unreadCount += 1;
    }

    // Enrich each conversation with request + other-party display data.
    const reqIds = [...new Set([...byKey.values()].map((c) => c.requestId))];
    const provIds = [...new Set([...byKey.values()].map((c) => c.providerId))];
    const reqRows = reqIds.length
      ? await db
          .select()
          .from(requestsTable)
          .where(inArray(requestsTable.id, reqIds))
      : [];
    const provRows = provIds.length
      ? await db
          .select()
          .from(providersTable)
          .where(inArray(providersTable.id, provIds))
      : [];
    const reqById = new Map(reqRows.map((r) => [r.id, r]));
    const provById = new Map(provRows.map((p) => [p.id, p]));
    const userIds = [
      ...new Set([
        ...reqRows.map((r) => r.userId),
        ...provRows.map((p) => p.userId),
      ]),
    ];
    const userRows = userIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(inArray(usersTable.id, userIds))
      : [];
    const userById = new Map(userRows.map((u) => [u.id, u]));

    const conversations = [...byKey.values()]
      .map((c) => {
        const request = reqById.get(c.requestId);
        const provider = provById.get(c.providerId);
        if (!request || !provider) return null;
        // Only surface conversations between the customer and the ASSIGNED
        // provider — same post-acceptance rule as resolveParticipant. This hides
        // any legacy/pre-acceptance threads (incl. their last-message preview).
        if (request.providerId !== provider.id) return null;
        const amCustomer = request.userId === user.id;
        // Other party: customer sees the provider's user name; provider sees the
        // requesting customer's name.
        const otherUserId = amCustomer ? provider.userId : request.userId;
        const otherPartyName = userById.get(otherUserId)?.name ?? "مستخدم";
        return {
          requestId: c.requestId,
          providerId: c.providerId,
          requestNumber: request.requestNumber,
          skillName: request.skillId,
          otherPartyName,
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          unreadCount: c.unreadCount,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) =>
        (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""),
      );

    res.json(conversations);
  },
);

router.get(
  "/chat/messages",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const requestId = Number(req.query.requestId);
    const providerId = Number(req.query.providerId);
    if (!Number.isInteger(requestId) || !Number.isInteger(providerId)) {
      res.status(400).json({ error: "Invalid query" });
      return;
    }
    const participant = await resolveParticipant(
      req,
      res,
      requestId,
      providerId,
    );
    if (!participant) return;

    const rows = await db
      .select()
      .from(chatMessagesTable)
      .where(
        and(
          eq(chatMessagesTable.requestId, requestId),
          eq(chatMessagesTable.providerId, providerId),
        ),
      )
      .orderBy(asc(chatMessagesTable.createdAt));
    res.json(rows);
  },
);

router.post(
  "/chat/messages",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = SendChatMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const { requestId, providerId, body } = parsed.data;
    const participant = await resolveParticipant(
      req,
      res,
      requestId,
      providerId,
    );
    if (!participant) return;

    const [created] = await db
      .insert(chatMessagesTable)
      .values({ requestId, providerId, senderId: user.id, body })
      .returning();

    // Notify the recipient (the other party) so the in-app banner + sound fire.
    const { request, provider, amCustomer } = participant;
    const recipientUserId = amCustomer ? provider.userId : request.userId;
    if (recipientUserId !== user.id) {
      await db.insert(notificationsTable).values({
        userId: recipientUserId,
        title: "رسالة جديدة",
        body:
          body.length > 80 ? `${body.slice(0, 80)}\u2026` : body,
        type: "chat_message",
        data: { requestId, providerId },
      });
    }

    res.status(201).json(created);
  },
);

router.post(
  "/chat/messages/read",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = MarkChatReadBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const { requestId, providerId } = parsed.data;
    const participant = await resolveParticipant(
      req,
      res,
      requestId,
      providerId,
    );
    if (!participant) return;

    const updated = await db
      .update(chatMessagesTable)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessagesTable.requestId, requestId),
          eq(chatMessagesTable.providerId, providerId),
          ne(chatMessagesTable.senderId, user.id),
          eq(chatMessagesTable.isRead, false),
        ),
      )
      .returning({ id: chatMessagesTable.id });
    res.json({ updated: updated.length });
  },
);

export default router;
