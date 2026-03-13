/**
 * AppointmentCard — Carte cliquable pour un RDV du jour
 * Heure, Avatar, Nom client, Badge statut
 * Effet de pression natif (scale 0.98, opacity 0.8)
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AppointmentCardProps {
  id: string;
  time: string;
  clientName: string;
  avatarUrl?: string | null;
  status: 'pending' | 'confirmed' | 'completed';
  service?: string;
  isDark?: boolean;
  onPress: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'En attente', bg: '#FFFBEB', text: '#D97706' },
  confirmed: { label: 'Confirmé', bg: '#ECFDF5', text: '#059669' },
  completed: { label: 'Terminé', bg: '#F3F4F6', text: '#6B7280' },
};

export function AppointmentCard({
  time,
  clientName,
  avatarUrl,
  status,
  isDark = false,
  onPress,
}: AppointmentCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
  };

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: isDark ? '#18181B' : '#FFFFFF' },
        animatedStyle,
      ]}
      android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
    >
      <Text style={[styles.time, { color: isDark ? '#FFFFFF' : '#000000' }]}>{time}</Text>
      <View style={[styles.avatar, { backgroundColor: isDark ? '#27272A' : '#E5E7EB' }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarLetter}>{clientName?.charAt(0)?.toUpperCase() || '?'}</Text>
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.clientName, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={1}>
          {clientName || 'Client'}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  time: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 44,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
