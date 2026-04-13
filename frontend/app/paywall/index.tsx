import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import { useAppStore } from '../../src/store/appStore';
import { PRODUCT_IDS, storeKitService } from '../../src/payments/StoreKitService';
import Button from '../../src/components/ui/Button';
import FahmIQLogoAnimated from '../../src/components/FahmIQLogoAnimated';

const { width } = Dimensions.get('window');

export default function PaywallScreen() {
  const router = useRouter();
  const theme = Colors.dark;
  const { setSubscriptionTier } = useAppStore();

  const handleSubscribe = async (tier: 'pro' | 'ultra') => {
    const productId = tier === 'ultra' ? PRODUCT_IDS.ULTRA_MONTHLY : PRODUCT_IDS.PRO_MONTHLY;
    const result = await storeKitService.purchase(productId);
    if (result.success) {
      setSubscriptionTier(tier);
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="paywall-screen">
      <View style={styles.content}>
        <FahmIQLogoAnimated size={56} />
        <Text style={[styles.title, { color: theme.textPrimary }]}>Unlock Full Power</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Access larger models, unlimited queries, and advanced features.
        </Text>

        <View style={[styles.planCard, { backgroundColor: theme.surfaceCard, borderColor: theme.accent }]}>
          <View style={[styles.popular, { backgroundColor: theme.accent }]}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
          <Text style={[styles.planName, { color: theme.textPrimary }]}>Pro</Text>
          <Text style={[styles.planPrice, { color: theme.accent }]}>$9.99<Text style={[styles.planPeriod, { color: theme.textFaint }]}>/month</Text></Text>
          {['Balanced model (Qwen 1.5B)', 'Deep Tasks', 'Unlimited queries', 'Web search integration'].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>{f}</Text>
            </View>
          ))}
          <Button testID="subscribe-pro-btn" title="Subscribe to Pro" onPress={() => handleSubscribe('pro')} style={{ marginTop: Spacing.lg }} />
        </View>

        <View style={[styles.planCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <Text style={[styles.planName, { color: theme.textPrimary }]}>Ultra</Text>
          <Text style={[styles.planPrice, { color: theme.accent }]}>$19.99<Text style={[styles.planPeriod, { color: theme.textFaint }]}>/month</Text></Text>
          {['Everything in Pro', 'Precision model (Qwen 3B)', 'Autonomous Director', 'Automation rules'].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>{f}</Text>
            </View>
          ))}
          <Button testID="subscribe-ultra-btn" title="Subscribe to Ultra" variant="secondary" onPress={() => handleSubscribe('ultra')} style={{ marginTop: Spacing.lg }} />
        </View>

        <Button testID="paywall-dismiss-btn" title="Maybe Later" variant="ghost" onPress={() => router.back()} style={{ marginTop: Spacing.sm }} />
        <Text style={[styles.legal, { color: theme.textFaint }]}>
          Subscriptions auto-renew. Cancel anytime in Settings. Terms apply.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', padding: Spacing['2xl'], paddingTop: Spacing['4xl'] },
  title: { ...Typography.heroTitle, marginTop: Spacing.lg, textAlign: 'center' },
  subtitle: { ...Typography.body, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing['2xl'] },
  planCard: { width: '100%', borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.lg, marginBottom: Spacing.lg },
  popular: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.sm, marginBottom: Spacing.sm },
  popularText: { color: '#FFF', ...Typography.micro, fontWeight: '600' },
  planName: { ...Typography.sectionHeading },
  planPrice: { ...Typography.heroTitle, marginTop: Spacing.xs },
  planPeriod: { fontSize: 15, fontWeight: '400' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  featureText: { ...Typography.body },
  legal: { ...Typography.micro, textAlign: 'center', marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
});
