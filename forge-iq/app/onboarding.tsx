import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "../src/context/AppContext";
import { ForgeButton } from "../src/components/ui/ForgeButton";
import { LocalBadge } from "../src/components/ui/LocalBadge";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "shield",
    title: "Your AI.\nYour Device.",
    subtitle:
      "FahmIQ runs entirely on your iPhone. No data leaves without your explicit permission — ever.",
    accent: "#6366F1",
  },
  {
    id: "2",
    icon: "layers",
    title: "9 Agents.\n1 Answer.",
    subtitle:
      "Scout, Planner, Researcher, Worker, Critic, Validator, Synthesizer, Judge, and Monitor work in concert — adversarially — to produce outputs that outperform any single model.",
    accent: "#8B5CF6",
  },
  {
    id: "3",
    icon: "cpu",
    title: "Deep Task Mode",
    subtitle:
      "Full 9-agent pipeline with visible stages. Watch each agent reason, critique, and refine in real-time. Like having a research team in your pocket.",
    accent: "#6366F1",
  },
  {
    id: "4",
    icon: "zap",
    title: "Three Modes.\nInfinite Depth.",
    subtitle:
      "Ask for fast answers. Deep Task for complex reasoning. Workspace for everything you save, import, and organize.",
    accent: "#818CF8",
  },
  {
    id: "5",
    icon: "lock",
    title: "Privacy First.\nAlways.",
    subtitle:
      "Your chats stay on your device. Optional cloud boost is always opt-in, never required. You control everything.",
    accent: "#6366F1",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
      Animated.timing(progressAnim, {
        toValue: next / (SLIDES.length - 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeOnboarding();
    }
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.slideContent}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${item.accent}20`, borderColor: `${item.accent}40` },
                ]}
              >
                <Feather name={item.icon as any} size={48} color={item.accent} />
              </View>
              <Text
                style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                ]}
              >
                {item.subtitle}
              </Text>
              <LocalBadge size="md" />
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? colors.primary : colors.border,
                  width: i === currentIndex ? 24 : 6,
                },
              ]}
            />
          ))}
        </View>
        <ForgeButton
          label={isLast ? "Enter FahmIQ" : "Continue"}
          onPress={goNext}
          size="lg"
          fullWidth
          testID="onboarding-next"
        />
        {!isLast && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              completeOnboarding();
            }}
            style={styles.skipBtn}
          >
            <Text
              style={[
                styles.skipText,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              Skip
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { flex: 1, alignItems: "center", justifyContent: "center" },
  slideContent: { alignItems: "center", paddingHorizontal: 40, gap: 20 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  title: { fontSize: 36, textAlign: "center", letterSpacing: -1, lineHeight: 42 },
  subtitle: { fontSize: 16, textAlign: "center", lineHeight: 24, letterSpacing: -0.2 },
  footer: { paddingHorizontal: 24, gap: 16 },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  skipBtn: { alignItems: "center", padding: 8 },
  skipText: { fontSize: 14 },
});
