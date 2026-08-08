import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '../contexts/AuthContext';
import { clientNeedsPassword } from '../lib/clientAuth';
import { ClientTheme as T } from '../lib/theme';

export default function DashboardScreen() {
  const { session, user, loading, signOut } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading || !session?.user) return;
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    if (clientNeedsPassword(meta)) {
      router.replace('/set-password');
    }
  }, [loading, session, user, router]);

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#c9a96e" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  const email = user?.email ?? '—';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>My Inkflow</Text>
        <Text style={styles.h1}>Tableau de bord</Text>
        <Text style={styles.muted}>
          Version mobile — les rendez-vous, favoris et découverte arriveront dans les prochaines
          itérations.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Connecté en tant que</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.outline, pressed && { opacity: 0.85 }]}
          onPress={() => void signOut()}
        >
          <Text style={styles.outlineText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 24, paddingBottom: 48 },
  kicker: {
    color: T.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  h1: {
    color: T.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  muted: { color: T.muted, fontSize: 15, lineHeight: 22, marginBottom: 28 },
  card: {
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
    marginBottom: 20,
  },
  label: { color: T.muted, fontSize: 13, marginBottom: 6 },
  email: { color: T.text, fontSize: 17, fontWeight: '600' },
  outline: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  outlineText: { color: T.text, fontSize: 16, fontWeight: '600' },
  boot: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
