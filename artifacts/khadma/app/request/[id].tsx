import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import {
  getGetRequestContactQueryKey,
  getGetRequestQueryKey,
  getListRequestOffersQueryKey,
  getListRequestsQueryKey,
  Offer,
  Provider,
  ServiceRequest,
  useGetRequest,
  useGetRequestContact,
  useListProviders,
  useListRequestOffers,
  useListSkills,
  useUpdateOffer,
  useUpdateRequest,
} from "@workspace/api-client-react";

import AuthedImage from "@/components/AuthedImage";
import RequestVideo from "@/components/RequestVideo";
import RouteMap from "@/components/RouteMap";
import { ReviewSection } from "@/components/ReviewSection";
import { categories, services } from "@/constants/services";
import { serviceNameByType } from "@/constants/serviceTranslations";
import { useLang } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import {
  fetchRoute,
  formatDistance,
  formatDuration,
  haversineKm,
  type LatLng,
  type RouteResult,
} from "@/lib/routing";

const Y = "#C8A574";

type Status = ServiceRequest["status"];

const STATUS_META: Record<Status, { color: string; icon: string }> = {
  pending: { color: "#C8A574", icon: "clock" },
  active: { color: "#2196F3", icon: "loader" },
  in_progress: { color: "#A855F7", icon: "play-circle" },
  completed: { color: "#4CAF50", icon: "check-circle" },
  cancelled: { color: "#FF4444", icon: "x-circle" },
};

function fmt(iso: string | null | undefined, isRTL: boolean) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(isRTL ? "ar" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stars({ rating }: { rating: number }) {
  const C = useColors();
  const rounded = Math.round(rating);
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather key={i} name="star" size={11} color={i <= rounded ? Y : C.border} />
      ))}
    </View>
  );
}

function OfferCard({
  offer,
  provider,
  request,
  onAccept,
  accepting,
  distanceKm,
}: {
  offer: Offer;
  provider: Provider | undefined;
  request: ServiceRequest;
  onAccept: () => void;
  accepting: boolean;
  distanceKm?: number | null;
}) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t, isRTL, lang } = useLang();
  const isAccepted = offer.status === "accepted";
  const isRejected = offer.status === "rejected";
  const canAccept = request.status === "pending" && offer.status === "pending";

  return (
    <View
      style={[
        styles.offerCard,
        isAccepted && { borderColor: "#4CAF50", backgroundColor: "#0F1A0F" },
        isRejected && { opacity: 0.5 },
      ]}
    >
      <View style={[styles.offerHeader, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <View style={[styles.providerRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <View style={styles.providerAvatar}>
            <Feather name="user" size={18} color={Y} />
          </View>
          <View style={{ alignItems: isRTL ? "flex-end" : "flex-start", gap: 2 }}>
            <Text style={styles.providerName}>
              {provider ? serviceNameByType(provider.serviceType ?? "", lang) : t.req.provider}
            </Text>
            {provider && provider.ratingCount > 0 ? (
              <View style={[styles.ratingRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                <Stars rating={provider.rating} />
                <Text style={styles.ratingText}>
                  {provider.rating.toFixed(1)} ({provider.ratingCount})
                </Text>
              </View>
            ) : (
              <Text style={styles.newProvider}>{t.req.noRating}</Text>
            )}
          </View>
        </View>
        <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
          <Text style={styles.offerPrice}>{offer.price}</Text>
          <Text style={styles.offerCurrency}>{t.req.currency}</Text>
        </View>
      </View>

      {!!offer.message && (
        <Text style={[styles.offerMessage, { textAlign: isRTL ? "right" : "left" }]}>
          {offer.message}
        </Text>
      )}

      <View style={[styles.offerMeta, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
        {distanceKm != null && (
          <View style={[styles.metaTag, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
            <Feather name="map-pin" size={11} color={C.mutedForeground} />
            <Text style={styles.metaText}>{formatDistance(distanceKm)}</Text>
          </View>
        )}
        {!!offer.availableTime && (
          <View style={[styles.metaTag, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
            <Feather name="calendar" size={11} color={C.mutedForeground} />
            <Text style={styles.metaText}>{fmt(offer.availableTime, isRTL)}</Text>
          </View>
        )}
        {!!offer.estimatedDuration && (
          <View style={[styles.metaTag, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
            <Feather name="clock" size={11} color={C.mutedForeground} />
            <Text style={styles.metaText}>{offer.estimatedDuration}</Text>
          </View>
        )}
      </View>

      {isAccepted && (
        <View style={[styles.acceptedTag, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <Feather name="check-circle" size={14} color="#4CAF50" />
          <Text style={styles.acceptedText}>{t.req.accepted}</Text>
        </View>
      )}

      {canAccept && (
        <TouchableOpacity
          style={[styles.acceptBtn, accepting && { opacity: 0.6 }]}
          onPress={onAccept}
          disabled={accepting}
          activeOpacity={0.85}
        >
          {accepting ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Feather name="check" size={16} color="#000" />
              <Text style={styles.acceptBtnText}>{t.req.chooseOffer}</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {isAccepted && (
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() =>
            router.push({
              pathname: "/chat/[requestId]",
              params: {
                requestId: String(request.id),
                providerId: String(offer.providerId),
              },
            })
          }
          activeOpacity={0.85}
        >
          <Feather name="message-circle" size={15} color={Y} />
          <Text style={styles.chatBtnText}>{t.chat.messageProvider}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RequestDetailScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { isDark } = useTheme();
  const { t, isRTL, lang } = useLang();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const queryClient = useQueryClient();

  const requestQ = useGetRequest(id, {
    query: { enabled: Number.isFinite(id), queryKey: getGetRequestQueryKey(id) },
  });
  const offersQ = useListRequestOffers(id, {
    query: { enabled: Number.isFinite(id), queryKey: getListRequestOffersQueryKey(id) },
  });
  const providersQ = useListProviders();
  const updateOffer = useUpdateOffer();
  const updateRequest = useUpdateRequest();
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [mutating, setMutating] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);

  const request = requestQ.data;
  const offers = offersQ.data ?? [];

  // Phone numbers are exchanged only after acceptance: once a provider is
  // assigned and the job is live or done, the customer can see (and call) the
  // assigned provider's phone via the gated contact endpoint.
  const contactReady =
    request != null &&
    request.providerId != null &&
    (request.status === "active" ||
      request.status === "in_progress" ||
      request.status === "completed");
  const contactQ = useGetRequestContact(id, {
    query: {
      enabled: Number.isFinite(id) && contactReady,
      queryKey: getGetRequestContactQueryKey(id),
    },
  });

  const providerMap = useMemo(() => {
    const m = new Map<number, Provider>();
    (providersQ.data ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [providersQ.data]);

  // Coordinates for the route view, available once a provider is assigned (active job).
  const assignedProvider = request?.providerId != null ? providerMap.get(request.providerId) : undefined;
  const customerCoord: LatLng | null =
    request?.lat != null && request?.lng != null
      ? { latitude: request.lat, longitude: request.lng }
      : null;
  const providerCoord: LatLng | null =
    assignedProvider?.lat != null && assignedProvider?.lng != null
      ? { latitude: assignedProvider.lat, longitude: assignedProvider.lng }
      : null;
  const showRoute =
    (request?.status === "active" || request?.status === "in_progress") &&
    !!customerCoord &&
    !!providerCoord;

  useEffect(() => {
    if (!showRoute || !customerCoord || !providerCoord) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    fetchRoute(providerCoord, customerCoord).then((r) => {
      if (!cancelled) setRoute(r);
    });
    return () => {
      cancelled = true;
    };
  }, [
    showRoute,
    customerCoord?.latitude,
    customerCoord?.longitude,
    providerCoord?.latitude,
    providerCoord?.longitude,
  ]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const align = isRTL ? "right" : "left";

  const skillsQ = useListSkills({ type: "all" }, { query: { queryKey: ["allSkills"], enabled: true } });
  const allSkills = skillsQ.data ?? [];

  const svcMeta = useMemo(() => {
    if (!request) return { icon: "briefcase", color: Y };
    const skill = allSkills.find((s) => s.id === request.skillId);
    if (skill) {
      return { icon: skill.icon ?? "briefcase", color: skill.color ?? Y };
    }
    const svc = services.find((s) => s.id === String(request.skillId));
    const cat = svc ? categories.find((c) => c.id === svc.categoryId) : undefined;
    return { icon: svc?.icon ?? "briefcase", color: cat?.color ?? Y };
  }, [request, allSkills]);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetRequestQueryKey(id) }),
      queryClient.invalidateQueries({ queryKey: getListRequestOffersQueryKey(id) }),
      queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() }),
    ]);
  };

  const confirm = (title: string, message: string, onYes: () => void) => {
    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n${message}`)) onYes();
    } else {
      Alert.alert(
        title,
        message,
        [
          { text: t.req.cancel, style: "cancel" },
          { text: t.req.ok, onPress: onYes },
        ],
        { userInterfaceStyle: isDark ? "dark" : "light" },
      );
    }
  };

  const acceptOffer = (offer: Offer) => {
    confirm(t.req.confirmAccept, t.req.confirmAcceptMsg, async () => {
      setAcceptingId(offer.id);
      try {
        await updateOffer.mutateAsync({ id: offer.id, data: { status: "accepted" } });
        await invalidate();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert(t.req.confirmAccept, t.req.error);
      } finally {
        setAcceptingId(null);
      }
    });
  };

  const setStatus = (status: "cancelled" | "completed", title: string, message: string) => {
    confirm(title, message, async () => {
      setMutating(true);
      try {
        await updateRequest.mutateAsync({ id, data: { status } });
        await invalidate();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert(title, t.req.error);
      } finally {
        setMutating(false);
      }
    });
  };

  if (requestQ.isLoading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={Y} />
      </View>
    );
  }

  if (requestQ.isError || !request) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: topInset }]}>
        <Feather name="alert-triangle" size={40} color={C.mutedForeground} />
        <Text style={styles.errText}>{t.req.error}</Text>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>{t.req.ok}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = STATUS_META[request.status];
  const statusLabel =
    request.status === "pending"
      ? t.req.statusPending
      : request.status === "active"
        ? t.req.statusActive
        : request.status === "in_progress"
          ? t.req.statusInProgress
          : request.status === "completed"
            ? t.req.statusCompleted
            : t.req.statusCancelled;

  const offerDistanceKm = (offer: Offer): number | null => {
    const p = providerMap.get(offer.providerId);
    if (!customerCoord || p?.lat == null || p?.lng == null) return null;
    return haversineKm(customerCoord, { latitude: p.lat, longitude: p.lng });
  };

  const sortedOffers = [...offers].sort((a, b) => {
    const aAcc = a.status === "accepted";
    const bAcc = b.status === "accepted";
    if (aAcc || bAcc) return aAcc === bAcc ? 0 : aAcc ? -1 : 1;
    const da = offerDistanceKm(a);
    const db = offerDistanceKm(b);
    if (da != null && db != null && da !== db) return da - db;
    if (da != null && db == null) return -1;
    if (da == null && db != null) return 1;
    return a.price - b.price;
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <Text style={styles.headerTitle}>{t.req.requestDetails}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <View style={styles.summary}>
          <View style={[styles.summaryTop, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
            <View style={[styles.svcIcon, { backgroundColor: svcMeta.color + "22" }]}>
              <Feather name={svcMeta.icon as any} size={22} color={svcMeta.color} />
            </View>
            <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start", gap: 4 }}>
              <Text style={styles.svcName}>{allSkills.find((s) => s.id === request.skillId)?.name ?? serviceNameByType("", lang)}</Text>
              <Text style={styles.reqNum}>{request.requestNumber}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: meta.color + "22" }]}>
              <Feather name={meta.icon as any} size={12} color={meta.color} />
              <Text style={[styles.statusText, { color: meta.color }]}>{statusLabel}</Text>
            </View>
          </View>

          {!!request.description && (
            <Text style={[styles.desc, { textAlign: align }]}>{request.description}</Text>
          )}

          {!!request.imageUrl && (
            <AuthedImage objectPath={request.imageUrl} style={styles.image} />
          )}

          {!!request.videoUrl && (
            <RequestVideo objectPath={request.videoUrl} style={styles.video} />
          )}

          {request.includesSpareParts && (
            <View style={styles.spareBadge}>
              <Feather name="settings" size={14} color={C.primary} />
              <Text style={styles.spareBadgeText}>{t.req.sparePartsLabel}</Text>
            </View>
          )}

          <View style={styles.infoRows}>
            {!!request.address && (
              <View style={[styles.infoRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                <Feather name="map-pin" size={14} color={C.mutedForeground} />
                <Text style={[styles.infoText, { textAlign: align }]} numberOfLines={2}>
                  {request.address}
                </Text>
              </View>
            )}
            {!!request.preferredTime && (
              <View style={[styles.infoRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                <Feather name="calendar" size={14} color={C.mutedForeground} />
                <Text style={[styles.infoText, { textAlign: align }]}>
                  {fmt(request.preferredTime, isRTL)}
                </Text>
              </View>
            )}
            {(request.priceMin != null || request.priceMax != null) && (
              <View style={[styles.infoRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                <Feather name="tag" size={14} color={C.mutedForeground} />
                <Text style={[styles.infoText, { textAlign: align }]}>
                  {request.priceMin ?? 0}
                  {request.priceMax != null ? `–${request.priceMax}` : "+"} {t.req.currency}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          <TimelineStep
            label={t.req.tlCreated}
            done
            active={request.status === "pending"}
            isRTL={isRTL}
          />
          <TimelineStep
            label={t.req.tlActive}
            done={
              request.status === "active" ||
              request.status === "in_progress" ||
              request.status === "completed"
            }
            active={
              request.status === "active" || request.status === "in_progress"
            }
            isRTL={isRTL}
          />
          <TimelineStep
            label={t.req.tlCompleted}
            done={request.status === "completed"}
            active={request.status === "completed"}
            isRTL={isRTL}
            last
          />
        </View>

        {/* Provider contact — phone revealed only after acceptance */}
        {contactReady && contactQ.data?.phone && (
          <View style={styles.contactCard}>
            <View style={[styles.contactRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
              <View style={styles.contactAvatar}>
                <Feather name="phone" size={16} color={Y} />
              </View>
              <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start", gap: 2 }}>
                <Text style={styles.contactLabel}>{t.chat.providerPhone}</Text>
                <Text style={styles.contactValue}>{contactQ.data.phone}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${contactQ.data!.phone}`)}
              activeOpacity={0.85}
            >
              <Feather name="phone-call" size={15} color="#000" />
              <Text style={styles.callBtnText}>{t.chat.callProvider}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Review — customer rates the provider after completion */}
        {request.status === "completed" && request.providerId != null && (
          <ReviewSection requestId={request.id} providerId={request.providerId} />
        )}

        {/* Live route — shown once a provider is on the way (active job) */}
        {showRoute && customerCoord && providerCoord && (
          <View style={styles.routeCard}>
            <RouteMap customer={customerCoord} provider={providerCoord} route={route?.coordinates ?? []} />
            <View style={[styles.routeStats, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
              <View style={styles.routeStat}>
                <Feather name="navigation" size={15} color={Y} />
                <Text style={styles.routeStatVal}>
                  {route ? formatDistance(route.distanceKm) : "…"}
                </Text>
                <Text style={styles.routeStatLabel}>\${t.navigate.distance}</Text>
              </View>
              <View style={styles.routeDivider} />
              <View style={styles.routeStat}>
                <Feather name="clock" size={15} color={Y} />
                <Text style={styles.routeStatVal}>
                  {route ? formatDuration(route.durationMin) : "…"}
                </Text>
                <Text style={styles.routeStatLabel}>
                  {route?.approximate ? t.navigate.approxTime : t.navigate.eta}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Offers */}
        <View style={[styles.offersHeader, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <Text style={styles.offersTitle}>{t.req.offersFor}</Text>
          {offers.length > 0 && (
            <View style={styles.offerCountBadge}>
              <Text style={styles.offerCountText}>{offers.length}</Text>
            </View>
          )}
        </View>

        {offersQ.isLoading ? (
          <ActivityIndicator size="small" color={Y} style={{ marginTop: 20 }} />
        ) : offersQ.isError ? (
          <View style={styles.noOffers}>
            <View style={styles.noOffersIcon}>
              <Feather name="alert-circle" size={28} color="#CC3333" />
            </View>
            <Text style={styles.noOffersTitle}>{t.req.offersError}</Text>
            <TouchableOpacity
              style={styles.offersRetryBtn}
              onPress={() => offersQ.refetch()}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={14} color={Y} />
              <Text style={styles.offersRetryText}>{t.req.offersRetry}</Text>
            </TouchableOpacity>
          </View>
        ) : sortedOffers.length === 0 ? (
          <View style={styles.noOffers}>
            <View style={styles.noOffersIcon}>
              <Feather name="inbox" size={28} color={C.mutedForeground} />
            </View>
            <Text style={styles.noOffersTitle}>{t.req.noOffers}</Text>
            <Text style={styles.noOffersSub}>{t.req.noOffersSub}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {sortedOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                provider={providerMap.get(offer.providerId)}
                request={request}
                onAccept={() => acceptOffer(offer)}
                accepting={acceptingId === offer.id}
                distanceKm={offerDistanceKm(offer)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action footer */}
      {(request.status === "pending" || request.status === "active") && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, flexDirection: isRTL ? "row" : "row-reverse" }]}>
          {request.status === "active" && (
            <TouchableOpacity
              style={[styles.completeBtn, mutating && { opacity: 0.6 }]}
              onPress={() => setStatus("completed", t.req.markComplete, t.req.completeConfirm)}
              disabled={mutating}
              activeOpacity={0.85}
            >
              <Feather name="check-circle" size={17} color="#000" />
              <Text style={styles.completeText}>{t.req.markComplete}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.cancelBtn, request.status === "active" && { flex: 0, paddingHorizontal: 18 }, mutating && { opacity: 0.6 }]}
            onPress={() => setStatus("cancelled", t.req.cancelRequest, t.req.cancelConfirm)}
            disabled={mutating}
            activeOpacity={0.85}
          >
            <Feather name="x" size={17} color="#FF6B6B" />
            {request.status === "pending" && <Text style={styles.cancelText}>{t.req.cancelRequest}</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TimelineStep({
  label,
  done,
  active,
  isRTL,
  last,
}: {
  label: string;
  done: boolean;
  active: boolean;
  isRTL: boolean;
  last?: boolean;
}) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const color = done ? Y : C.border;
  return (
    <View style={[styles.tlStep, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
      <View style={styles.tlMarkerCol}>
        <View style={[styles.tlDot, { backgroundColor: done ? Y : C.card, borderColor: color }]}>
          {done && <Feather name="check" size={11} color="#000" />}
        </View>
        {!last && <View style={[styles.tlLine, { backgroundColor: done ? Y : C.border }]} />}
      </View>
      <Text style={[styles.tlLabel, { color: active ? Y : done ? C.foreground : C.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  center: { alignItems: "center", justifyContent: "center", gap: 14 },
  errText: { fontSize: 15, color: C.mutedForeground },
  backPill: { backgroundColor: Y, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backPillText: { fontSize: 15, fontWeight: "700", color: "#000" },

  header: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: C.foreground, textAlign: "center" },

  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  summary: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
  },
  summaryTop: { alignItems: "center", gap: 12 },
  svcIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  svcName: { fontSize: 17, fontWeight: "700", color: C.foreground },
  reqNum: { fontSize: 12, color: C.mutedForeground },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  desc: { fontSize: 14, color: C.foreground, lineHeight: 21 },
  image: { width: "100%", height: 200, borderRadius: 14, backgroundColor: C.background },
  video: { width: "100%", height: 200, borderRadius: 14, backgroundColor: "#000", marginTop: 10 },
  spareBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: C.primary + "22",
    borderWidth: 1,
    borderColor: C.primary + "55",
  },
  spareBadgeText: { color: C.primary, fontSize: 13, fontWeight: "700" },
  infoRows: { gap: 10 },
  infoRow: { alignItems: "center", gap: 8 },
  infoText: { flex: 1, fontSize: 13, color: C.mutedForeground },

  timeline: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    paddingBottom: 6,
  },
  tlStep: { alignItems: "flex-start", gap: 12 },
  tlMarkerCol: { alignItems: "center" },
  tlDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tlLine: { width: 2, height: 26, marginVertical: 2 },
  tlLabel: { fontSize: 14, fontWeight: "600", paddingTop: 2 },

  offersHeader: { alignItems: "center", gap: 8, marginTop: 4 },
  offersTitle: { fontSize: 18, fontWeight: "700", color: C.foreground },
  offerCountBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    backgroundColor: Y,
    alignItems: "center",
    justifyContent: "center",
  },
  offerCountText: { fontSize: 12, fontWeight: "700", color: "#000" },

  noOffers: { alignItems: "center", paddingVertical: 36, gap: 12 },
  noOffersIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  noOffersTitle: { fontSize: 16, fontWeight: "700", color: C.foreground },
  noOffersSub: { fontSize: 13, color: C.mutedForeground, textAlign: "center", paddingHorizontal: 30 },
  offersRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Y + "40",
    backgroundColor: Y + "12",
  },
  offersRetryText: { fontSize: 13, fontWeight: "700", color: Y },

  offerCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
  },
  routeCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 8,
    gap: 8,
    marginBottom: 18,
  },
  routeStats: {
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  routeStat: { alignItems: "center", gap: 4, flex: 1 },
  routeStatVal: { fontSize: 15, fontWeight: "700", color: C.foreground },
  routeStatLabel: { fontSize: 11, color: C.mutedForeground },
  routeDivider: { width: 1, height: 32, backgroundColor: C.border },
  offerHeader: { alignItems: "center", justifyContent: "space-between" },
  providerRow: { alignItems: "center", gap: 10, flex: 1 },
  providerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Y + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  providerName: { fontSize: 14, fontWeight: "700", color: C.foreground },
  ratingRow: { alignItems: "center", gap: 5 },
  ratingText: { fontSize: 11, color: C.mutedForeground },
  newProvider: { fontSize: 11, color: Y },
  offerPrice: { fontSize: 22, fontWeight: "700", color: Y },
  offerCurrency: { fontSize: 11, color: C.mutedForeground },
  offerMessage: { fontSize: 13, color: C.foreground, lineHeight: 20 },
  offerMeta: { gap: 8, flexWrap: "wrap" },
  metaTag: {
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ffffff08",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  metaText: { fontSize: 11, color: C.mutedForeground },
  acceptedTag: { alignItems: "center", gap: 6 },
  acceptedText: { fontSize: 13, fontWeight: "700", color: "#4CAF50" },
  acceptBtn: {
    height: 46,
    backgroundColor: Y,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  acceptBtnText: { fontSize: 15, fontWeight: "700", color: "#000" },

  chatBtn: {
    height: 44,
    backgroundColor: Y + "12",
    borderWidth: 1,
    borderColor: Y + "40",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  chatBtnText: { fontSize: 14, fontWeight: "700", color: Y },

  contactCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  contactRow: { alignItems: "center", gap: 12 },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Y + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { fontSize: 12, color: C.mutedForeground },
  contactValue: { fontSize: 16, fontWeight: "700", color: C.foreground },
  callBtn: {
    height: 44,
    backgroundColor: Y,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  callBtnText: { fontSize: 14, fontWeight: "700", color: "#000" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 16,
    gap: 10,
  },
  completeBtn: {
    flex: 1,
    height: 52,
    backgroundColor: "#4CAF50",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  completeText: { fontSize: 15, fontWeight: "700", color: "#000" },
  cancelBtn: {
    flex: 1,
    height: 52,
    backgroundColor: "#FF6B6B15",
    borderWidth: 1,
    borderColor: "#FF6B6B40",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelText: { fontSize: 15, fontWeight: "700", color: "#FF6B6B" },
});
