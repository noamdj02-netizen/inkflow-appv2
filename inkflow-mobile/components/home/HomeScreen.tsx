/**
 * HomeScreen — Écran Accueil InkFlow
 * Dashboard avec : Header, Quick Actions, Widgets d'urgence, Aperçu du jour (RDV)
 * Pull to Refresh, animations Fade In Up, Skeleton Loader
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Bell, Plus, Share2, AlertTriangle } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { AppointmentCard } from './AppointmentCard';
import { DayAppointmentsSkeleton } from '../ui/SkeletonLoader';

// Données mock pour démo
const MOCK_APPOINTMENTS = [
  {
    id: '1',
    time: '10:00',
    clientName: 'Marie Dupont',
    avatarUrl: null,
    status: 'confirmed' as const,
    service: 'Manchette',
  },
  {
    id: '2',
    time: '14:30',
    clientName: 'Thomas Martin',
    avatarUrl: null,
    status: 'pending' as const,
    service: 'Flash floral',
  },
  {
    id: '3',
    time: '17:00',
    clientName: 'Léa Bernard',
    avatarUrl: null,
    status: 'confirmed' as const,
    service: 'Petit motif',
  },
];

const ANIMATION_DELAY = 80;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointments] = useState(MOCK_APPOINTMENTS);

  const colors = {
    bg: isDark ? '#000000' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: '#6B7280',
    cardBg: isDark ? '#18181B' : '#FFFFFF',
    border: isDark ? '#27272A' : '#E5E7EB',
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setLoading(true);
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
    }, 1200);
  }, []);

  const handleAppointmentPress = useCallback((_id: string) => {
    /* Détail RDV : brancher sur l’écran dédié quand le stack mobile expose la route. */
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
      >
        {/* ─── Header personnalisé ─── */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.text }]}>Bonjour Noam 👋</Text>
          </View>
          <Pressable style={styles.notifButton} hitSlop={12}>
            <Bell size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        </MotiView>

        {/* ─── Quick Actions (2 gros boutons) ─── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: ANIMATION_DELAY }}
          style={styles.quickActions}
        >
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.btnPrimaryText}>Nouveau RDV</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          >
            <Share2 size={20} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.btnSecondaryText, { color: colors.textSecondary }]}>Partager Vitrine</Text>
          </Pressable>
        </MotiView>

        {/* ─── Widget d'urgence (acomptes en attente) ─── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: ANIMATION_DELAY * 2 }}
          style={styles.alertCard}
        >
          <View style={styles.alertContent}>
            <AlertTriangle size={20} color="#DC2626" strokeWidth={2} />
            <Text style={styles.alertText}>2 acomptes en attente</Text>
          </View>
        </MotiView>

        {/* ─── Aperçu du Jour (Rendez-vous) ─── */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 450, delay: ANIMATION_DELAY * 3 }}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rendez-vous du jour</Text>
          {loading ? (
            <DayAppointmentsSkeleton />
          ) : appointments.length > 0 ? (
            appointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                {...apt}
                isDark={isDark}
                onPress={() => handleAppointmentPress(apt.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun rendez-vous aujourd&apos;hui</Text>
            </View>
          )}
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  notifButton: {
    padding: 8,
    borderRadius: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  alertCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});
