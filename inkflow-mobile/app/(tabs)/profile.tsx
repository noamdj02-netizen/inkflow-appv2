/**
 * Onglet Profil — placeholder + accès Programme Partenaire
 */
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Gift } from 'lucide-react-native';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.subtitle}>À venir</Text>

      <Pressable
        onPress={() => router.push('/referral')}
        style={({ pressed }) => [styles.referralCard, pressed && styles.cardPressed]}
      >
        <Gift size={24} color="#2563EB" strokeWidth={2} />
        <View style={styles.referralText}>
          <Text style={styles.referralTitle}>Programme Partenaire</Text>
          <Text style={styles.referralSubtitle}>Invitez un artiste, gagnez 1 mois gratuit chacun</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardPressed: {
    opacity: 0.9,
  },
  referralText: {
    flex: 1,
  },
  referralTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  referralSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
