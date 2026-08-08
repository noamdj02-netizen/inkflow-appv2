import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';

/** Palette alignée sur la charte Ink (splash natif #0d0d0d). */
const INK_BG = '#0d0d0d';
const INK_TEXT = '#e8e3dc';
const INK_MUTED = '#6b6b6b';
const INK_ACCENT = '#c9a96e';

export interface WebAppLaunchOverlayProps {
  visible: boolean;
}

/**
 * Écran de transition WebView au lancement — animations type Framer Motion via Moti (Reanimated).
 */
export function WebAppLaunchOverlay({ visible }: WebAppLaunchOverlayProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <MotiView
          key="inkflow-launch-overlay"
          pointerEvents="none"
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
          }}
          transition={{
            type: 'timing',
            duration: 320,
          }}
          style={styles.root}
        >
          <View style={styles.column}>
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'spring',
                damping: 22,
                stiffness: 220,
                mass: 0.85,
              }}
            >
              <MotiView
                from={{ scale: 0.94, opacity: 0.85 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'timing',
                  duration: 1600,
                  loop: true,
                  repeatReverse: true,
                }}
              >
                <Image
                  accessibilityLabel="Inkflow Pro"
                  source={require('@/assets/images/splash-icon.png')}
                  style={styles.mark}
                  resizeMode="contain"
                />
              </MotiView>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 420,
                delay: 90,
              }}
              style={styles.textBlock}
            >
              <Text style={styles.title}>Inkflow Pro</Text>
              <Text style={styles.subtitle}>Chargement de ton espace…</Text>
            </MotiView>

            <IndeterminateBar />
          </View>
        </MotiView>
      ) : null}
    </AnimatePresence>
  );
}

function IndeterminateBar() {
  return (
    <View style={styles.barTrack} accessibilityRole="progressbar" accessibilityLabel="Chargement en cours">
      <MotiView
        style={styles.barThumb}
        from={{ translateX: -120 }}
        animate={{ translateX: 220 }}
        transition={{
          type: 'timing',
          duration: 1100,
          loop: true,
          repeatReverse: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: INK_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 360,
  },
  mark: {
    width: 96,
    height: 96,
    alignSelf: 'center',
  },
  textBlock: {
    marginTop: 28,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: INK_TEXT,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: INK_MUTED,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
  },
  barTrack: {
    marginTop: 40,
    width: '72%',
    maxWidth: 260,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2a2a2a',
    overflow: 'hidden',
  },
  barThumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '42%',
    borderRadius: 2,
    backgroundColor: INK_ACCENT,
    opacity: 0.95,
  },
});
