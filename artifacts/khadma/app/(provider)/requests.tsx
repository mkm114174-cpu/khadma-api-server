import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";

import {
  getGetMyProviderQueryKey,
  getGetRequestContactQueryKey,
  useCreateOffer,
  useGetMyProvider,
  useGetRequestContact,
  useListOffers,
  useListRequests,
  useListSkills,
  useUpdateRequest,
  type Offer,
  type ServiceRequest,
  type Skill,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import ProviderJobRoute from "@/components/ProviderJobRoute";
import RequestVideo from "@/components/RequestVideo";
import { storageUrl } from "@/lib/storage";
import { categories, services } from "@/constants/services";
import { DEFAULT_RADIUS_KM, isProviderAvailableNow } from "@/lib/availability";
import { formatDistance, haversineKm } from "@/lib/routing";

const Y = "#C8A574";

type Tab = "available" | "offers" | "jobs";

function getTabs(t: ReturnType<typeof useLang>["t"]): { key: Tab; label: string }[] {
  return [
    { key: "available", label: t.providerRequests.tabAvailable },
    { key: "offers", label: t.providerRequests.tabOffers },
    { key: "jobs", label: t.providerRequests.tabJobs },
  ];
}

function getTimePresets(t: ReturnType<typeof useLang>["t"]): { key: string; label: string; iso: () => string }[] {
  return [
    { key: "asap", label: t.req.asap, iso: () => new Date().toISOString() },
    {
      key: "today_eve",
      label: t.req.todayEvening,
      iso: () => { const d = new Date(); d.setHours(18, 0, 0, 0); return d.toISOString(); },
    },
    {
      key: "tom_morning",
      label: t.req.tomorrowMorning,
      iso: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString(); },
    },
    {
      key: "tom_eve",
      label: t.req.tomorrowEvening,
      iso: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0); return d.toISOString(); },
    },
  ];
}

function getOfferStatus(t: ReturnType<typeof useLang>["t"]): Record<Offer["status"], { label: string; color: string }> {
  return {
    pending: { label: t.providerRequests.pending, color: Y },
    accepted: { label: t.providerRequests.accepted, color: "#4ADE80" },
    rejected: { label: t.providerRequests.rejected, color: "#888" },
  };
}

function skillName(skillId: number, skills: Skill[]) {
  return skills.find((s) => s.id === skillId)?.name ?? "Request";
}

function svcMeta(skillId: number, skills: Skill[]) {
  const skill = skills.find((s) => s.id === skillId);
  if (skill) {
    return { icon: (skill.icon as keyof typeof Feather.glyphMap) ?? "briefcase", color: skill.color ?? Y };
  }
  const svc = services.find((s) => s.id === String(skillId));
  const cat = svc ? categories.find((c) => c.id === svc.categoryId) : undefined;
  return { icon: (svc?.icon ?? "briefcase") as keyof typeof Feather.glyphMap, color: cat?.color ?? Y };
}

export default function ProviderRequestsScreen() {
  const C = useColors();
  const { t } = useLang();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const tabBarPad = (Platform.OS === "web" ? 84 : 60 + insets.bottom) + 20;
  const TABS = getTabs(t);

  const [tab, setTab] = useState<Tab>("available");

  const providerQ = useGetMyProvider({ query: { queryKey: getGetMyProviderQueryKey() } });
  const provider = providerQ.data;

  const availableNow = provider ? isProviderAvailableNow(provider) : false;
  const nearParams =
    provider?.lat != null && provider?.lng != null
      ? { lat: provider.lat, lng: provider.lng, radiusKm: DEFAULT_RADIUS_KM }
      : {};

  const openReqQ = useListRequests(
    { status: "pending", ...nearParams },
    { query: { enabled: availableNow, queryKey: ["openRequests"] } },
  );
  const myOffersQ = useListOffers({ mine: true }, { query: { queryKey: ["myOffers"] } });
  const myJobsQ = useListRequests(
    { providerId: provider?.id },
    { query: { enabled: !!provider, queryKey: ["myJobs", provider?.id] } },
  );

  const createOffer = useCreateOffer();
  const updateRequest = useUpdateRequest();

  const myOffers = myOffersQ.data ?? [];
  const offeredRequestIds = useMemo(
    () => new Set(myOffers.map((o) => o.requestId)),
    [myOffers],
  );

  // Map requestId -> serviceType from the requests we already know about.
  const requestMeta = useMemo(() => {
    const m = new Map<number, ServiceRequest>();
    [...(openReqQ.data ?? []), ...(myJobsQ.data ?? [])].forEach((r) => m.set(r.id, r));
    return m;
  }, [openReqQ.data, myJobsQ.data]);

  const providerCoord =
    provider?.lat != null && provider?.lng != null
      ? { latitude: provider.lat, longitude: provider.lng }
      : null;

  const skillsQ = useListSkills({ type: "all" }, { query: { queryKey: ["allSkills"], enabled: true } });
  const allSkills = skillsQ.data ?? [];

  const available = (openReqQ.data ?? [])
    .map((r) => {
      const distanceKm =
        providerCoord && r.lat != null && r.lng != null
          ? haversineKm(providerCoord, { latitude: r.lat, longitude: r.lng })
          : null;
      return { ...r, distanceKm };
    })
    .sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  const jobs = (myJobsQ.data ?? []).filter(
    (r) =>
      r.status === "active" ||
      r.status === "in_progress" ||
      r.status === "completed",
  );

  // Offer modal state
  const [offerFor, setOfferFor] = useState<ServiceRequest | null>(null);
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [message, setMessage] = useState("");
  const [timeKey, setTimeKey] = useState<string>("asap");
  const [offerError, setOfferError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const openOffer = (req: ServiceRequest) => {
    setOfferFor(req);
    setPrice(req.priceMin != null ? String(req.priceMin) : "");
    setDuration("");
    setMessage("");
    setTimeKey("asap");
    setOfferError(null);
  };

  const refreshAll = () => {
    void openReqQ.refetch();
    void myOffersQ.refetch();
    void myJobsQ.refetch();
  };

  const submitOffer = async () => {
    if (!offerFor) return;
    if (!availableNow) {
      setOfferError(t.providerRequests.offerUnavailable);
      return;
    }
    const p = Number(price);
    if (!price.trim() || Number.isNaN(p) || p < 0) {
      setOfferError(t.providerRequests.offerInvalidPrice);
      return;
    }
    setOfferError(null);
    const iso = getTimePresets(t).find((tp) => tp.key === timeKey)?.iso();
    try {
      await createOffer.mutateAsync({
        data: {
          requestId: offerFor.id,
          price: p,
          message: message.trim() || undefined,
          estimatedDuration: duration.trim() || undefined,
          availableTime: iso,
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["myOffers"] }),
        queryClient.invalidateQueries({ queryKey: ["openRequests"] }),
      ]);
      setOfferFor(null);
    } catch {
      setOfferError(t.providerRequests.offerSubmitFailed);
    }
  };

  const completeJob = async (req: ServiceRequest) => {
    setCompletingId(req.id);
    try {
      await updateRequest.mutateAsync({ id: req.id, data: { status: "completed" } });
      await queryClient.invalidateQueries({ queryKey: ["myJobs", provider?.id] });
    } catch {
      // ignore; user can retry
    } finally {
      setCompletingId(null);
    }
  };

  const startJob = async (req: ServiceRequest) => {
    setCompletingId(req.id);
    try {
      await updateRequest.mutateAsync({
        id: req.id,
        data: { status: "in_progress" },
      });
      await queryClient.invalidateQueries({ queryKey: ["myJobs", provider?.id] });
    } catch {
      // ignore; user can retry
    } finally {
      setCompletingId(null);
    }
  };

  const isLoading =
    (tab === "available" && openReqQ.isLoading) ||
    (tab === "offers" && myOffersQ.isLoading) ||
    (tab === "jobs" && myJobsQ.isLoading);

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.providerRequests.title}</Text>
        <View style={styles.tabRow}>
          {TABS.map((tEntry) => {
            const active = tab === tEntry.key;
            const count =
              tEntry.key === "available" ? (availableNow ? available.filter((r) => !offeredRequestIds.has(r.id)).length : 0) :
              tEntry.key === "offers" ? myOffers.length :
              jobs.length;
            return (
              <TouchableOpacity
                key={tEntry.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(tEntry.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tEntry.label}{count > 0 ? ` (${count})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: tabBarPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={openReqQ.isRefetching || myOffersQ.isRefetching || myJobsQ.isRefetching}
            onRefresh={refreshAll}
            tintColor={Y}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={Y} style={{ marginTop: 40 }} />
        ) : tab === "available" ? (
          !availableNow ? (
            <Empty text={t.providerRequests.activateFirst} />
          ) : available.length === 0 ? (
            <Empty text={t.providerRequests.noNearby} />
          ) : (
            available.map((req) => {
              const meta = svcMeta(req.skillId, allSkills);
              const offered = offeredRequestIds.has(req.id);
              return (
                <View key={req.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.iconWrap, { backgroundColor: meta.color + "18" }]}>
                      <Feather name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardService}>{skillName(req.skillId, allSkills)}</Text>
                      <Text style={styles.cardMeta} numberOfLines={2}>
                        {req.description || req.address || `${t.providerRequests.request} ${req.requestNumber}`}
                      </Text>
                      {req.distanceKm != null && (
                        <View style={styles.distanceTag}>
                          <Feather name="map-pin" size={11} color={Y} />
                          <Text style={styles.distanceText}>{formatDistance(req.distanceKm)}</Text>
                        </View>
                      )}
                    </View>
                    {(req.priceMin != null || req.priceMax != null) && (
                      <Text style={styles.cardPrice}>
                        {req.priceMin ?? req.priceMax}
                        {req.priceMax && req.priceMin && req.priceMax !== req.priceMin ? `-${req.priceMax}` : ""} {t.providerEarnings.currency}
                      </Text>
                    )}
                  </View>
                  {offered ? (
                    <View style={styles.offeredTag}>
                      <Feather name="check" size={13} color="#4ADE80" />
                      <Text style={styles.offeredText}>{t.providerRequests.offerSent}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.offerBtn} onPress={() => openOffer(req)}>
                      <Feather name="send" size={14} color="#000" />
                      <Text style={styles.offerBtnText}>{t.providerRequests.sendOffer}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )
        ) : tab === "offers" ? (
          myOffers.length === 0 ? (
            <Empty text={t.providerRequests.noOffers} />
          ) : (
            myOffers.map((offer) => {
              const req = requestMeta.get(offer.requestId);
              const sName = req ? skillName(req.skillId, allSkills) : `${t.providerRequests.request} ${offer.requestId}`;
              const meta = req ? svcMeta(req.skillId, allSkills) : { icon: "briefcase" as keyof typeof Feather.glyphMap, color: Y };
              const st = getOfferStatus(t)[offer.status];
              return (
                <View key={offer.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.iconWrap, { backgroundColor: meta.color + "18" }]}>
                      <Feather name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardService}>{sName}</Text>
                      {offer.estimatedDuration ? (
                        <Text style={styles.cardMeta}>{t.providerRequests.durationLabel}: {offer.estimatedDuration}</Text>
                      ) : null}
                      {offer.message ? (
                        <Text style={styles.cardMeta} numberOfLines={2}>{offer.message}</Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: "flex-start", gap: 6 }}>
                      <Text style={styles.cardPrice}>{offer.price} {t.providerEarnings.currency}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: st.color + "18", borderColor: st.color + "40" }]}>
                        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )
        ) : jobs.length === 0 ? (
          <Empty text={t.providerRequests.noJobs} />
        ) : (
          jobs.map((req) => {
            const meta = svcMeta(req.skillId, allSkills);
            const done = req.status === "completed";
            const started = req.status === "in_progress";
            const badgeColor = done ? "#4ADE80" : started ? "#A855F7" : "#60A5FA";
            const badgeLabel = done ? t.providerRequests.completed : started ? t.providerRequests.inProgress : t.providerRequests.jobAccepted;
            return (
              <View key={req.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconWrap, { backgroundColor: meta.color + "18" }]}>
                    <Feather name={meta.icon} size={20} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardService}>{skillName(req.skillId, allSkills)}</Text>
                    <Text style={styles.cardMeta} numberOfLines={2}>
                      {req.address || req.description || `${t.providerRequests.request} ${req.requestNumber}`}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-start", gap: 6 }}>
                    {(req.priceMin != null || req.priceMax != null) && (
                      <Text style={styles.cardPrice}>{req.priceMax ?? req.priceMin} {t.providerEarnings.currency}</Text>
                    )}
                    <View style={[styles.statusBadge, {
                      backgroundColor: badgeColor + "18",
                      borderColor: badgeColor + "40",
                    }]}>
                      <Text style={[styles.statusText, { color: badgeColor }]}>
                        {badgeLabel}
                      </Text>
                    </View>
                  </View>
                </View>
                {req.status !== "completed" &&
                  provider?.lat != null &&
                  provider?.lng != null &&
                  req.lat != null &&
                  req.lng != null && (
                    <>
                      <ProviderJobRoute
                        provider={{ latitude: provider.lat, longitude: provider.lng }}
                        customer={{ latitude: req.lat, longitude: req.lng }}
                      />
                      <TouchableOpacity
                        style={styles.navBtn}
                        onPress={() =>
                          router.push({
                            pathname: "/navigate/[id]",
                            params: { id: String(req.id) },
                          })
                        }
                      >
                        <Feather name="navigation" size={15} color="#000" />
                        <Text style={styles.navBtnText}>{t.providerRequests.navigate}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                {req.status === "active" && (
                  <TouchableOpacity
                    style={[styles.completeBtn, { backgroundColor: "#A855F7" }]}
                    onPress={() => startJob(req)}
                    disabled={completingId === req.id}
                  >
                    {completingId === req.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Feather name="play-circle" size={15} color="#fff" />
                        <Text style={[styles.completeBtnText, { color: "#fff" }]}>{t.providerRequests.startJob}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                {started && (
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => completeJob(req)}
                    disabled={completingId === req.id}
                  >
                    {completingId === req.id ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Feather name="check-circle" size={15} color="#000" />
                        <Text style={styles.completeBtnText}>{t.providerRequests.completeJob}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                {provider && (
                  <JobContact req={req} providerId={provider.id} />
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Offer modal */}
      <Modal visible={!!offerFor} transparent animationType="slide" onRequestClose={() => setOfferFor(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.providerRequests.offerTitle}</Text>
              <TouchableOpacity onPress={() => setOfferFor(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Feather name="x" size={20} color={C.mutedForeground} />
              </TouchableOpacity>
            </View>
            {offerFor && <Text style={styles.modalSub}>{skillName(offerFor.skillId, allSkills)}</Text>}

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
            {offerFor && (
              <View style={styles.detailsBox}>
                {offerFor.imageUrl ? (
                  <Image source={{ uri: storageUrl(offerFor.imageUrl) ?? undefined }} style={styles.detailsImage} resizeMode="cover" />
                ) : null}
                {offerFor.videoUrl ? (
                  <RequestVideo objectPath={offerFor.videoUrl} style={styles.detailsVideo} />
                ) : null}
                {offerFor.includesSpareParts ? (
                  <View style={styles.spareBadge}>
                    <Feather name="settings" size={14} color={Y} />
                    <Text style={styles.spareBadgeText}>{t.req.sparePartsLabel}</Text>
                  </View>
                ) : null}
                {offerFor.description ? (
                  <View style={styles.detailRow}>
                    <Feather name="file-text" size={14} color={Y} />
                    <Text style={styles.detailText}>{offerFor.description}</Text>
                  </View>
                ) : null}
                {offerFor.address ? (
                  <View style={styles.detailRow}>
                    <Feather name="map-pin" size={14} color={Y} />
                    <Text style={styles.detailText}>{offerFor.address}</Text>
                  </View>
                ) : null}
                {offerFor.preferredTime ? (
                  <View style={styles.detailRow}>
                    <Feather name="clock" size={14} color={Y} />
                    <Text style={styles.detailText}>
                      {new Date(offerFor.preferredTime).toLocaleString("ar")}
                    </Text>
                  </View>
                ) : null}
                {offerFor.priceMin != null || offerFor.priceMax != null ? (
                  <View style={styles.detailRow}>
                    <Feather name="tag" size={14} color={Y} />
                    <Text style={styles.detailText}>
                      {t.providerRequests.budget}: {offerFor.priceMin ?? offerFor.priceMax}
                      {offerFor.priceMax && offerFor.priceMin && offerFor.priceMax !== offerFor.priceMin
                        ? `-${offerFor.priceMax}`
                        : ""} {t.providerEarnings.currency}
                    </Text>
                  </View>
                ) : null}
                {offerFor.paymentMethod === "on_site" ? (
                  <View style={styles.detailRow}>
                    <Feather name="dollar-sign" size={14} color={Y} />
                    <Text style={styles.detailText}>{t.providerRequests.onSitePayment}</Text>
                  </View>
                ) : null}
              </View>
            )}

            <Text style={styles.fieldLabel}>{t.providerRequests.priceLabel}</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              placeholderTextColor={C.mutedForeground}
              keyboardType="numeric"
              textAlign={t.dir === "rtl" ? "right" : "left"}
            />

            <Text style={styles.fieldLabel}>{t.providerRequests.durationLabel}</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder={t.providerRequests.durationPlaceholder}
              placeholderTextColor={C.mutedForeground}
              textAlign={t.dir === "rtl" ? "right" : "left"}
            />

            <Text style={styles.fieldLabel}>{t.providerRequests.timeLabel}</Text>
            <View style={styles.timeChips}>
              {getTimePresets(t).map((tp) => {
                const active = timeKey === tp.key;
                return (
                  <TouchableOpacity
                    key={tp.key}
                    style={[styles.timeChip, active && styles.timeChipActive]}
                    onPress={() => setTimeKey(tp.key)}
                  >
                    <Text style={[styles.timeChipText, active && { color: C.primaryForeground }]}>{tp.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>{t.providerRequests.messageLabel}</Text>
            <TextInput
              style={[styles.input, { minHeight: 70 }]}
              value={message}
              onChangeText={setMessage}
              placeholder={t.providerRequests.messagePlaceholder}
              placeholderTextColor={C.mutedForeground}
              multiline
              textAlign={t.dir === "rtl" ? "right" : "left"}
              textAlignVertical="top"
            />

            {offerError && <Text style={styles.error}>{offerError}</Text>}

            <TouchableOpacity
              style={[styles.submit, createOffer.isPending && { opacity: 0.6 }]}
              onPress={submitOffer}
              disabled={createOffer.isPending}
            >
              {createOffer.isPending ? (
                <ActivityIndicator size="small" color={C.primaryForeground} />
              ) : (
                <>
                  <Feather name="send" size={15} color={C.primaryForeground} />
                  <Text style={styles.submitText}>{t.providerRequests.submitOffer}</Text>
                </>
              )}
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.empty}>
      <Feather name="inbox" size={36} color={C.mutedForeground} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/**
 * Customer contact for an accepted job: the customer's phone is revealed only
 * here (post-acceptance) via the gated contact endpoint, alongside the chat
 * entry point. Cancelled jobs never reach this list, so contact stays private
 * for anything that wasn't accepted.
 */
function JobContact({ req, providerId }: { req: ServiceRequest; providerId: number }) {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const { t } = useLang();
  const contactQ = useGetRequestContact(req.id, {
    query: {
      enabled: Number.isFinite(req.id),
      queryKey: getGetRequestContactQueryKey(req.id),
    },
  });
  const phone = contactQ.data?.phone;
  return (
    <>
      {phone ? (
        <View style={styles.contactCard}>
          <View style={styles.contactInfo}>
            <Feather name="phone" size={15} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>{t.chat.customerPhone}</Text>
              <Text style={styles.contactValue}>{phone}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL(`tel:${phone}`)}
          >
            <Feather name="phone-call" size={14} color="#000" />
            <Text style={styles.callBtnText}>{t.chat.callCustomer}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <TouchableOpacity
        style={styles.msgBtn}
        onPress={() =>
          router.push({
            pathname: "/chat/[requestId]",
            params: {
              requestId: String(req.id),
              providerId: String(providerId),
            },
          })
        }
      >
        <Feather name="message-circle" size={14} color={C.primary} />
        <Text style={styles.msgBtnText}>{t.providerRequests.messageCustomer}</Text>
      </TouchableOpacity>
    </>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: { 
    paddingHorizontal: 20, 
    paddingBottom: 16, 
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: { fontSize: 28, fontWeight: "800", color: C.foreground, marginBottom: 16, textAlign: "right", letterSpacing: -0.5 },
  tabRow: { flexDirection: "row-reverse", gap: 10 },
  tab: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: "center", 
    borderRadius: 14, 
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: "700", color: C.mutedForeground },
  tabTextActive: { color: C.primaryForeground },

  list: { padding: 20, gap: 16 },
  card: { 
    backgroundColor: C.card, 
    borderRadius: 24, 
    padding: 18, 
    borderWidth: 1, 
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: { flexDirection: "row-reverse", gap: 14, marginBottom: 16 },
  iconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardService: { fontSize: 17, fontWeight: "800", color: C.foreground, textAlign: "right", letterSpacing: -0.3 },
  cardMeta: { fontSize: 14, color: C.mutedForeground, marginTop: 4, textAlign: "right", lineHeight: 20 },
  cardPrice: { fontSize: 16, fontWeight: "800", color: C.primary, textAlign: "left" },
  
  distanceTag: { 
    flexDirection: "row-reverse", 
    alignItems: "center", 
    gap: 4, 
    marginTop: 8,
    backgroundColor: C.primary + "10",
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceText: { fontSize: 12, fontWeight: "700", color: C.primary },

  offerBtn: { 
    flexDirection: "row-reverse", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8, 
    backgroundColor: C.primary, 
    paddingVertical: 12, 
    borderRadius: 14,
  },
  offerBtnText: { color: C.primaryForeground, fontWeight: "800", fontSize: 15 },

  offeredTag: { 
    flexDirection: "row-reverse", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 6, 
    paddingVertical: 12,
    backgroundColor: "#4ADE8018",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#4ADE8040",
  },
  offeredText: { color: "#4ADE80", fontWeight: "700", fontSize: 14 },

  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 10, 
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  msgBtn: { 
    flexDirection: "row-reverse", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8, 
    marginTop: 12, 
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.primary + "40",
    borderRadius: 12,
  },
  msgBtnText: { color: C.primary, fontWeight: "700", fontSize: 14 },

  contactCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.muted,
    gap: 10,
  },
  contactInfo: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  contactLabel: { color: C.mutedForeground, fontSize: 12, textAlign: "right" },
  contactValue: { color: C.foreground, fontSize: 15, fontWeight: "700", textAlign: "right" },
  callBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  callBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },

  navBtn: { 
    flexDirection: "row-reverse", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8, 
    backgroundColor: C.foreground, 
    paddingVertical: 12, 
    borderRadius: 14, 
    marginTop: 12 
  },
  navBtnText: { color: C.background, fontWeight: "800", fontSize: 14 },

  completeBtn: { 
    flexDirection: "row-reverse", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8, 
    backgroundColor: "#4ADE80", 
    paddingVertical: 12, 
    borderRadius: 14, 
    marginTop: 12 
  },
  completeBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { 
    backgroundColor: C.background, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHandle: { width: 40, height: 5, backgroundColor: C.border, borderRadius: 3, alignSelf: "center", marginBottom: 20 },
  modalHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: "800", color: C.foreground },
  modalSub: { fontSize: 16, color: C.mutedForeground, marginBottom: 20, textAlign: "right", fontWeight: "600" },

  detailsBox: { 
    backgroundColor: C.card, 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 20, 
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  detailsImage: { width: "100%", height: 160, borderRadius: 14, marginBottom: 8 },
  detailsVideo: { width: "100%", height: 180, borderRadius: 14, marginBottom: 8, backgroundColor: "#000" },
  spareBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Y + "22",
    borderWidth: 1,
    borderColor: Y + "55",
  },
  spareBadgeText: { color: Y, fontSize: 13, fontWeight: "700" },
  detailRow: { flexDirection: "row-reverse", gap: 10, alignItems: "flex-start" },
  detailText: { flex: 1, fontSize: 14, color: C.foreground, textAlign: "right", lineHeight: 20 },

  fieldLabel: { fontSize: 14, fontWeight: "700", color: C.foreground, marginBottom: 8, textAlign: "right" },
  input: { 
    backgroundColor: C.card, 
    borderWidth: 1, 
    borderColor: C.border, 
    borderRadius: 14, 
    padding: 14, 
    color: C.foreground, 
    fontSize: 16, 
    textAlign: "right",
    fontWeight: "600",
  },
  inputArea: { height: 100, textAlignVertical: "top" },

  timeChips: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  timeChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: C.card, 
    borderWidth: 1, 
    borderColor: C.border 
  },
  timeChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  timeChipText: { fontSize: 13, color: C.mutedForeground, fontWeight: "600" },

  error: { 
    backgroundColor: C.destructive + "10", 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.destructive + "20",
    color: C.destructive, fontSize: 13, textAlign: "center", fontWeight: "600"
  },

  submit: { 
    backgroundColor: C.primary, 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: "center", 
    marginTop: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: "row-reverse",
    gap: 8,
    justifyContent: "center",
  },
  submitText: { color: C.primaryForeground, fontSize: 16, fontWeight: "800" },

  empty: { alignItems: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 16, color: C.mutedForeground, textAlign: "center", lineHeight: 24, fontWeight: "500", paddingHorizontal: 40 },
});
