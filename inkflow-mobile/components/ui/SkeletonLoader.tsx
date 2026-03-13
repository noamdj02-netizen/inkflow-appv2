/**
 * Skeleton Loader — effet de chargement gris qui clignote
 * Utilisé pour les sections en attente de données API
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonLoader({
  width = '100%',
  height = 60,
  borderRadius = 12,
  style,
}: SkeletonLoaderProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: typeof width === 'number' ? width : width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Skeleton pour une ligne de RDV (même layout que AppointmentCard) */
export function AppointmentRowSkeleton() {
  return (
    <View style={styles.row}>
      <SkeletonLoader width={44} height={18} borderRadius={6} />
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      <View style={styles.rowContent}>
        <SkeletonLoader width="70%" height={16} borderRadius={4} />
      </View>
      <SkeletonLoader width={70} height={24} borderRadius={8} />
    </View>
  );
}

/** Skeleton pour la section RDV du jour */
export function DayAppointmentsSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <AppointmentRowSkeleton />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Platform.OS === 'ios' ? '#E5E7EB' : '#D1D5DB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowContent: {
    flex: 1,
  },
  skeletonCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    overflow: 'hidden',
  },
});
