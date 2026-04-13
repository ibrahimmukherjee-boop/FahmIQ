import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "../../src/context/ThemeContext";
import { useApp } from "../../src/context/AppContext";
import { LocalBadge } from "../../src/components/ui/LocalBadge";
import { useIAP, CREDITS_PER_PACK, CREDITS_PER_TASK } from "../../src/hooks/useIAP";

type Band = { id: "fast" | "balanced" | "precision"; label: string; desc: string; icon: string; pro: boolean };
const BANDS: Band[] = [
  { id: "fast", label: "Fast", desc: "Instant responses · 512 tokens", icon: "zap", pro: false },
  { id: "balanced", label: "Balanced", desc: "Speed + depth · 1024 tokens", icon: "sliders", pro: false },
  { id: "precision", label: "Precision", desc: "Maximum depth · 2048 tokens", icon: "target", pro: true },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDark, toggleDark } = useTheme();
  const {
    modelBand, setModelBand, isPro, isPlus,
    clearMessages, workspaceItems, deepTaskCount, credits, addCredits
  } = useApp();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { products, purchasing, loadProducts, purchaseCredits, restorePurchases } = useIAP(addCredits);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleBuyCredits = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await purchaseCredits();
  }, [purchaseCredits]);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await restorePurchases();
  }, [restorePurchases]);

  // Format credit balance nicely
  const creditDisplay = credits >= 1000
    ? credits.toLocaleString()
    : credits.toFixed(0);

  // Derive price string from fetched products, fallback to $0.29
  const product = products.find(p => p.productId === "com.seekconsultingltd.forgeiq.credits_100");
  const priceStr = product?.localizedPrice ?? "$0.29";

  const sub = isPro ? "Pro" : isPlus ? "Plus" : "Free";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: bottomPad + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* App identity */}
      <View style={styles.appHeader}>
        <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          FahmIQ
        </Text>
        <LocalBadge size="md" />
        <Text style={[styles.appTagline, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Think deeper. Stay private.
        </Text>
      </View>

      {/* Credits & Purchase */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          CREDITS
        </Text>

        {/* Credit balance */}
        <View style={styles.creditCard}>
          <View style={[styles.creditBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Feather name="cpu" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.creditBalance, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {creditDisplay} credits
            </Text>
            <Text style={[styles.creditSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {credits > 0
                ? `${Math.max(0, 3 - deepTaskCount)} free Deep Tasks left today`
                : "Buy credits to run Deep Tasks"}
            </Text>
          </View>
        </View>

        {/* Buy credits button — triggers Apple's native payment sheet */}
        <Pressable
          onPress={handleBuyCredits}
          disabled={purchasing}
          style={[
            styles.buyBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius - 4 },
            purchasing && { opacity: 0.6 }
          ]}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="shopping-cart" size={16} color="#fff" />
              <Text style={[styles.buyBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                Buy {CREDITS_PER_PACK} Credits — {priceStr}
              </Text>
            </>
          )}
        </Pressable>

        <Text style={[styles.creditNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Each Deep Task uses {CREDITS_PER_TASK} credits. Payment processed by Apple.
        </Text>

        {/* Restore purchases */}
        <Pressable onPress={handleRestore} style={styles.restoreBtn}>
          <Text style={[styles.restoreBtnText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
            Restore Purchases
          </Text>
        </Pressable>
      </View>

      {/* Plan badge */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          SUBSCRIPTION
        </Text>
        <View style={styles.subCard}>
          <View style={[styles.subBadge, { backgroundColor: isPro ? `${colors.primary}20` : colors.accent }]}>
            <Feather name={isPro ? "star" : isPlus ? "zap" : "user"} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subTier, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {sub} Plan
            </Text>
            <Text style={[styles.subDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {isPro
                ? "Unlimited everything"
                : isPlus
                  ? "Enhanced limits"
                  : "Free tier · 3 Deep Tasks/day"}
            </Text>
          </View>
        </View>
      </View>

      {/* Model band */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          MODEL BAND
        </Text>
        {BANDS.map((band) => (
          <Pressable
            key={band.id}
            onPress={() => {
              if (band.pro && !isPro) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setModelBand(band.id);
            }}
            style={[
              styles.bandRow,
              {
                backgroundColor: modelBand === band.id ? colors.accent : "transparent",
                borderRadius: colors.radius - 4,
                opacity: band.pro && !isPro ? 0.5 : 1,
              },
            ]}
          >
            <View style={[styles.bandIcon, { backgroundColor: modelBand === band.id ? colors.primary : colors.muted }]}>
              <Feather name={band.icon as any} size={16} color={modelBand === band.id ? "#fff" : colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bandLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {band.label} {band.pro && !isPro ? "— Pro" : ""}
              </Text>
              <Text style={[styles.bandDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {band.desc}
              </Text>
            </View>
            {modelBand === band.id && (
              <Feather name="check" size={18} color={colors.primary} />
            )}
          </Pressable>
        ))}
      </View>

      {/* Appearance */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          APPEARANCE
        </Text>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleDark(); }}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Privacy */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          PRIVACY & DATA
        </Text>
        <Row label="Messages stored" value={`${workspaceItems.length} items`} icon="database" colors={colors} />
        <Row label="Cloud relay" value="Off" icon="cloud-off" colors={colors} />
        <Row label="Analytics" value="Off" icon="bar-chart-2" colors={colors} />
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            clearMessages();
          }}
          style={[styles.dangerBtn, { borderColor: colors.error }]}
        >
          <Feather name="trash-2" size={16} color={colors.error} />
          <Text style={[styles.dangerBtnText, { color: colors.error, fontFamily: "Inter_500Medium" }]}>
            Clear all chat history
          </Text>
        </Pressable>
      </View>

      {/* About */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          ABOUT
        </Text>
        <Row label="Version" value="1.0.0" icon="info" colors={colors} />
        <Row label="Architecture" value="9-Agent Pipeline" icon="layers" colors={colors} />
        <Row label="Runtime" value="On-Device (MLC LLM)" icon="cpu" colors={colors} />
        <Row label="Privacy" value="Local by default" icon="shield" colors={colors} />
      </View>
    </ScrollView>
  );
}

function Row({ label, value, icon, colors }: { label: string; value: string; icon: string; colors: any }) {
  return (
    <View style={styles.row}>
      <Feather name={icon as any} size={16} color={colors.mutedForeground} />
      <Text style={[styles.rowLabel, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  appHeader: { alignItems: "center", gap: 10, paddingVertical: 24 },
  appName: { fontSize: 36, letterSpacing: -1.5 },
  appTagline: { fontSize: 15 },
  section: { borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 11, letterSpacing: 0.8 },
  creditCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  creditBadge: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  creditBalance: { fontSize: 20, letterSpacing: -0.5 },
  creditSub: { fontSize: 13, marginTop: 2 },
  buyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  buyBtnText: { color: "#fff", fontSize: 15 },
  creditNote: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  restoreBtn: { alignItems: "center", paddingVertical: 4 },
  restoreBtnText: { fontSize: 13 },
  subCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  subBadge: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  subTier: { fontSize: 17, letterSpacing: -0.4 },
  subDesc: { fontSize: 13, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 14 },
  bandRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  bandIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bandLabel: { fontSize: 15, letterSpacing: -0.2 },
  bandDesc: { fontSize: 12, marginTop: 2 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 15 },
  dangerBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  dangerBtnText: { fontSize: 14 },
});
