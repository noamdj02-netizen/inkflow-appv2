import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '../contexts/AuthContext';
import { clientNeedsPassword } from '../lib/clientAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sendClientMagicLink } from '../lib/sendClientMagicLink';
import { ClientTheme as T } from '../lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState<'form' | 'sent'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !session?.user) return;
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    if (clientNeedsPassword(meta)) router.replace('/set-password');
    else router.replace('/dashboard');
  }, [authLoading, session, user, router]);

  const onMagicLink = async () => {
    if (!email.trim()) {
      setError('Indique ton email.');
      return;
    }
    if (!isSupabaseConfigured()) {
      setError('Configure EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendClientMagicLink(email);
      setPhase('sent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    if (!isSupabaseConfigured()) {
      setError('Configuration Supabase manquante.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (err) setError(err.message);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>Inkflow</Text>
          <Text style={styles.h1}>Espace client</Text>
          <Text style={styles.muted}>
            Connexion avec le lien reçu par email (comme sur le web) ou avec ton mot de passe si tu
            l’as déjà défini.
          </Text>

          {phase === 'sent' ? (
            <View style={styles.card}>
              <Text style={styles.body}>
                Vérifie ta boîte mail : nous t’avons envoyé un lien. Tu peux aussi te connecter avec
                ton mot de passe ci-dessous.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
                onPress={() => setPhase('form')}
              >
                <Text style={styles.secondaryText}>Retour</Text>
              </Pressable>
            </View>
          ) : null}

          {phase === 'form' ? (
            <View style={styles.card}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="toi@email.com"
                placeholderTextColor={T.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={[styles.label, styles.mt]}>Mot de passe (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Si déjà défini sur le web"
                placeholderTextColor={T.muted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {error ? <Text style={styles.err}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [styles.primary, pressed && styles.pressed, loading && styles.disabled]}
                onPress={onPasswordSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#18181b" />
                ) : (
                  <Text style={styles.primaryText}>Se connecter</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}
                onPress={onMagicLink}
                disabled={loading}
              >
                <Text style={styles.link}>Recevoir un lien par email</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  logo: {
    color: T.accent,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
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
  muted: {
    color: T.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
  },
  label: {
    color: T.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  mt: { marginTop: 16 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    color: T.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  primary: {
    marginTop: 20,
    backgroundColor: T.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: '#18181b',
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: { color: T.accent, fontSize: 15, fontWeight: '600' },
  linkBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  link: { color: T.muted, fontSize: 14, textDecorationLine: 'underline' },
  err: { color: T.danger, fontSize: 14, marginTop: 12 },
  body: { color: T.text, fontSize: 15, lineHeight: 22 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
