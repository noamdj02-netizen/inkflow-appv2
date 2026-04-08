import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '../contexts/AuthContext';
import { clientNeedsPassword } from '../lib/clientAuth';
import { supabase } from '../lib/supabase';
import { ClientTheme as T } from '../lib/theme';

export default function SetPasswordScreen() {
  const { user, session } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  if (!session?.user) {
    return <Redirect href="/login" />;
  }
  if (!clientNeedsPassword(meta)) {
    return <Redirect href="/dashboard" />;
  }

  const submit = async () => {
    const p = password.trim();
    if (p.length < 8) {
      setErr('Au moins 8 caractères.');
      return;
    }
    if (p !== password2) {
      setErr('Les mots de passe ne correspondent pas.');
      return;
    }
    setSaving(true);
    setErr('');
    const { error } = await supabase.auth.updateUser({
      password: p,
      data: { client_password_set: true },
    });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Text style={styles.h1}>Définir ton mot de passe</Text>
        <Text style={styles.muted}>
          Tu pourras te connecter directement depuis l’app avec cet email et ce mot de passe.
        </Text>
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={T.muted}
        />
        <Text style={[styles.label, styles.mt]}>Confirmation</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password2}
          onChangeText={setPassword2}
          placeholder="••••••••"
          placeholderTextColor={T.muted}
        />
        {err ? <Text style={styles.err}>{err}</Text> : null}
        <Pressable
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.9 }]}
          onPress={() => void submit()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#18181b" />
          ) : (
            <Text style={styles.primaryText}>Enregistrer</Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg, paddingHorizontal: 24 },
  flex: { flex: 1, paddingTop: 24 },
  h1: { color: T.text, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  muted: { color: T.muted, fontSize: 15, marginBottom: 24, lineHeight: 22 },
  label: { color: T.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 },
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
    marginTop: 24,
    backgroundColor: T.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: { color: '#18181b', fontSize: 16, fontWeight: '700' },
  err: { color: T.danger, marginTop: 12, fontSize: 14 },
});
