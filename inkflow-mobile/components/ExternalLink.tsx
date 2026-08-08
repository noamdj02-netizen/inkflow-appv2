import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';

export interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Lien HTTPS externe — évite le conflit `typedRoutes` d’expo-router sur `href: string`. */
export function ExternalLink({ href, style, children }: ExternalLinkProps) {
  const onPress = () => {
    if (Platform.OS === 'web') {
      if (typeof globalThis.window !== 'undefined') {
        globalThis.window.open(href, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    void WebBrowser.openBrowserAsync(href);
  };

  return (
    <Pressable style={style} onPress={onPress} accessibilityRole="link">
      {children}
    </Pressable>
  );
}
