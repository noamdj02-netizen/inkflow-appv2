import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSession } from '../contexts/AuthContext';
import { clientNeedsPassword } from '../lib/clientAuth';

export default function Index() {
  const { session, user, loading } = useSession();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c9a96e" />
      </View>
    );
  }

  if (session?.user) {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    if (clientNeedsPassword(meta)) {
      return <Redirect href="/set-password" />;
    }
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
