/**
 * ReferralScreen — Programme Partenaire InkFlow
 * Design iOS minimaliste, fond blanc pur.
 * Carte avec code de parrainage, bouton Share, stats (amis invités, mois gratuits).
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Share2, Users, Gift } from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const INVITE_BASE_URL = 'https://inkflow.me/invite';

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendsInvited, setFriendsInvited] = useState(0);
  const [monthsEarned, setMonthsEarned] = useState(0);

  const fetchReferralData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setReferralCode('ABC123'); // Mock pour démo
      setFriendsInvited(0);
      setMonthsEarned(0);
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setReferralCode('ABC123');
        setFriendsInvited(0);
        setMonthsEarned(0);
        setLoading(false);
        return;
      }

      const { data: studio, error } = await supabase
        .from('inkflow_studios')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (error || !studio?.referral_code) {
        setReferralCode('ABC123');
      } else {
        setReferralCode(studio.referral_code);
      }

      // Stats : requête vers inkflow_referrals (mock si pas de données)
      const { data: referrals } = await supabase
        .from('inkflow_referrals')
        .select('id, status')
        .eq('referrer_id', user.id);

      const completed = referrals?.filter((r) => r.status === 'completed') ?? [];
      setFriendsInvited(referrals?.length ?? 0);
      setMonthsEarned(completed.length);
    } catch {
      setReferralCode('ABC123');
      setFriendsInvited(0);
      setMonthsEarned(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const handleShare = useCallback(async () => {
    const code = referralCode ?? 'ABC123';
    const inviteUrl = `${INVITE_BASE_URL}/${code}`;
    const message = `Yo ! ✌️ Si tu cherches un outil pour arrêter de galérer avec tes prises de RDV et tes acomptes, je suis passé sur InkFlow pour mon studio, c'est une tuerie.\n\nPasse par mon lien pour t'inscrire, on gagnera tous les deux 1 mois d'abonnement Pro offert (et ça t'évitera les no-shows 😅) :\n${inviteUrl}\n\nMon code : ${code}`;

    try {
      const result = await Share.share({
        message,
        title: 'InkFlow — Programme Partenaire',
        url: Platform.OS === 'ios' ? inviteUrl : undefined,
      });
      if (result.action === Share.sharedAction) {
        // Partage réussi (utilisateur a choisi une app)
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de partager le lien.');
    }
  }, [referralCode]);

  if (loading) {
  return (
    <View style={styles.container}>
      <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.header}
        >
          <Text style={styles.title}>Programme Partenaire</Text>
          <Text style={styles.subtitle}>
            Invitez un artiste, gagnez 1 mois gratuit chacun.
          </Text>
        </MotiView>

        {/* Carte code de parrainage */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 80 }}
          style={styles.card}
        >
          <Text style={styles.cardLabel}>Votre code de parrainage</Text>
          <Text style={styles.code}>{referralCode ?? '—'}</Text>
        </MotiView>

        {/* Bouton Partager */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 160 }}
          style={styles.shareSection}
        >
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.shareButton, pressed && styles.btnPressed]}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Share2 size={22} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.shareButtonText}>Partager mon lien</Text>
          </Pressable>
        </MotiView>

        {/* Statistiques */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 240 }}
          style={styles.statsSection}
        >
          <Text style={styles.statsTitle}>Vos récompenses</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Users size={24} color="#2563EB" strokeWidth={2} />
              <Text style={styles.statValue}>{friendsInvited}</Text>
              <Text style={styles.statLabel}>Amis invités</Text>
            </View>
            <View style={styles.statCard}>
              <Gift size={24} color="#059669" strokeWidth={2} />
              <Text style={styles.statValue}>{monthsEarned}</Text>
              <Text style={styles.statLabel}>Mois gratuits gagnés</Text>
            </View>
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  code: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 4,
  },
  shareSection: {
    marginTop: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  shareButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  statsSection: {
    marginTop: 32,
  },
  statsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
});
