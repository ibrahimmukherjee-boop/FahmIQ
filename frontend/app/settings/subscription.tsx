import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/design/tokens';
import { useAppStore } from '../../src/store/appStore';
import { storeKitService, PRODUCT_IDS, Product } from '../../src/payments/StoreKitService';
import Button from '../../src/components/ui/Button';

export default function SubscriptionSettings() {
  const router = useRouter();
  const theme = Colors.dark;
  const { subscriptionTier, setSubscriptionTier } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    await storeKitService.initialize();
    const p = await storeKitService.getProducts();
    setProducts(p);
  };

  const handlePurchase = async (productId: string) => {
    setLoading(true);
    const result = await storeKitService.purchase(productId);
    if (result.success) {
      if (productId.includes('ultra')) setSubscriptionTier('ultra');
      else if (productId.includes('pro')) setSubscriptionTier('pro');
    }
    setLoading(false);
  };

  const tiers = [
    { id: 'free', name: 'Free', price: '$0', features: ['Fast model (Qwen 0.5B)', '10 queries/day', 'Basic Ask mode'], current: subscriptionTier === 'free' },
    { id: 'pro', name: 'Pro', price: '$9.99/mo', features: ['All Free features', 'Balanced model (Qwen 1.5B)', 'Deep Tasks', 'Unlimited queries', 'Web search'], current: subscriptionTier === 'pro', productId: PRODUCT_IDS.PRO_MONTHLY },
    { id: 'ultra', name: 'Ultra', price: '$19.99/mo', features: ['All Pro features', 'Precision model (Qwen 3B)', 'Autonomous Director', 'Automation rules', 'Priority processing'], current: subscriptionTier === 'ultra', productId: PRODUCT_IDS.ULTRA_MONTHLY },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="subscription-screen">
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Subscription</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tiers.map((tier) => (
          <View key={tier.id} style={[styles.tierCard, { backgroundColor: theme.surfaceCard, borderColor: tier.current ? theme.accent : theme.border }]}>
            {tier.current && (
              <View style={[styles.currentBadge, { backgroundColor: theme.accent }]}>
                <Text style={styles.currentText}>Current Plan</Text>
              </View>
            )}
            <Text style={[styles.tierName, { color: theme.textPrimary }]}>{tier.name}</Text>
            <Text style={[styles.tierPrice, { color: theme.accent }]}>{tier.price}</Text>
            <View style={styles.featureList}>
              {tier.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>{f}</Text>
                </View>
              ))}
            </View>
            {!tier.current && tier.productId && (
              <Button
                testID={`subscribe-${tier.id}`}
                title={`Subscribe to ${tier.name}`}
                onPress={() => handlePurchase(tier.productId!)}
                loading={loading}
                style={{ marginTop: Spacing.lg }}
              />
            )}
          </View>
        ))}

        <TouchableOpacity
          testID="restore-purchases-btn"
          style={[styles.restoreBtn, { borderColor: theme.border }]}
          onPress={async () => {
            const results = await storeKitService.restorePurchases();
            if (results.some((r) => r.productId?.includes('ultra'))) setSubscriptionTier('ultra');
            else if (results.some((r) => r.productId?.includes('pro'))) setSubscriptionTier('pro');
          }}
        >
          <Text style={[styles.restoreText, { color: theme.accent }]}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.sectionHeading },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing['6xl'] },
  tierCard: { borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.lg, marginBottom: Spacing.lg },
  currentBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.sm, marginBottom: Spacing.sm },
  currentText: { color: '#FFF', ...Typography.micro, fontWeight: '600' },
  tierName: { ...Typography.sectionHeading },
  tierPrice: { ...Typography.heroTitle, marginTop: Spacing.xs },
  featureList: { marginTop: Spacing.lg, gap: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureText: { ...Typography.body },
  restoreBtn: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.md },
  restoreText: { ...Typography.body, fontWeight: '600' },
});
