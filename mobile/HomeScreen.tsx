/**
 * HomeScreen — Écran d'accueil CRM/Dashboard (React Native + Expo + NativeWind)
 * À placer dans un projet Expo avec NativeWind configuré.
 * Icônes : npm install lucide-react-native react-native-svg
 * Flou : npx expo install expo-blur
 * Safe area : npx expo install react-native-safe-area-context
 * Haptique : npx expo install expo-haptics
 * Swipe : npx expo install react-native-gesture-handler react-native-reanimated
 * Bottom Sheet : npx expo install @gorhom/bottom-sheet
 * ⚠️ Envelopper l'app dans <GestureHandlerRootView> (ex: dans app/_layout.tsx).
 */
import React, { useState, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  StyleSheet,
} from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu,
  Bell,
  Sun,
  Inbox,
  Image as ImageIcon,
  LayoutGrid,
  Plus,
  Calendar,
  User,
  CreditCard,
  AlertTriangle,
  X,
  Check,
  Clock,
} from 'lucide-react-native';

const CARD_WIDTH = 80;

function SwipeableCard({
  id,
  clientName,
  service,
  price,
  onAccept,
  onReject,
}: {
  id: string;
  clientName: string;
  service: string;
  price: number;
  onAccept: () => void;
  onReject: () => void;
}) {
  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAccept();
  };

  const handleReject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReject();
  };

  const renderLeftActions = () => (
    <RectButton style={styles.leftAction} onPress={handleAccept}>
      <Check size={28} color="#FFFFFF" strokeWidth={2.5} />
      <Text style={styles.actionLabel}>Accepter</Text>
    </RectButton>
  );

  const renderRightActions = () => (
    <RectButton style={styles.rightAction} onPress={handleReject}>
      <X size={28} color="#FFFFFF" strokeWidth={2.5} />
      <Text style={styles.actionLabel}>Refuser</Text>
    </RectButton>
  );

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      leftThreshold={CARD_WIDTH}
      rightThreshold={CARD_WIDTH}
    >
      <View style={styles.card}>
        <View style={styles.cardAvatar}>
          <Text style={styles.cardAvatarText}>{clientName.charAt(0)}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {clientName} a demandé un RDV
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {service} — {price}€
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  leftAction: {
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    width: CARD_WIDTH,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rightAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: CARD_WIDTH,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#60A5FA',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 2,
  },
});

const COLORS = {
  bgApp: '#0A0A0A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  buttonPrimary: '#3B82F6',
  cardBg: '#18181B',
  avatarBg: '#27272A',
  avatarLetter: '#60A5FA',
  orangeBorder: '#F59E0B',
  orangeIcon: '#D97706',
  orangeButtonBg: '#422006',
  orangeText: '#FCD34D',
  blueBorder: '#3B82F6',
  blueIcon: '#60A5FA',
  blueButtonBg: '#1E3A8A',
  blueText: '#93C5FD',
  tabInactive: '#71717A',
  tabActive: '#FFFFFF',
  closeIcon: '#A1A1AA',
};

const MOCK_REQUESTS = [
  { id: '1', clientName: 'Jeanne', service: 'Flash', price: 150 },
  { id: '2', clientName: 'Marc', service: 'Manchette', price: 280 },
  { id: '3', clientName: 'Léa', service: 'Petit motif', price: 80 },
];

const BOTTOM_SHEET_SNAP_POINTS = ['30%', '50%'];

const MENU_OPTIONS = [
  { id: 'rdv', label: 'Créer un nouveau rendez-vous', icon: Calendar },
  { id: 'flash', label: 'Ajouter un nouveau Flash', icon: ImageIcon },
  { id: 'creneau', label: 'Bloquer un créneau', icon: Clock },
] as const;

export default function HomeScreen() {
  const [toggleOn, setToggleOn] = useState(true);
  const [dismissOrange, setDismissOrange] = useState(false);
  const [dismissBlue, setDismissBlue] = useState(false);
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const removeRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const openBottomSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleMenuOption = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeBottomSheet();
    // TODO: navigation vers l'écran correspondant
  }, [closeBottomSheet]);

  const renderBackdrop = useCallback(
    (props: object) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgApp }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Header (Frosted Glass) ─── */}
        <BlurView
          tint="dark"
          intensity={80}
          style={{
            paddingTop: insets.top,
            paddingBottom: 10,
            paddingHorizontal: 20,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 50,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity activeOpacity={0.7} style={{ padding: 8, marginLeft: -8 }}>
            <Menu size={24} color={COLORS.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Sun size={18} color={COLORS.textSecondary} strokeWidth={2} />
              <Switch
                value={toggleOn}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  setToggleOn(v);
                }}
                trackColor={{ false: '#27272A', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <TouchableOpacity activeOpacity={0.7} style={{ padding: 6 }}>
              <Bell size={22} color={COLORS.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: COLORS.avatarBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.avatarLetter }}>N</Text>
            </View>
          </View>
        </BlurView>

        {/* ─── 2. Section Bienvenue ─── */}
        <View className="px-5 mt-6">
          <Text style={{ fontSize: 13, color: COLORS.tabInactive, marginBottom: 4 }}>
            jeu. 26 février
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 }}>
            Bonjour Noam 👋
          </Text>
          <Text
            style={{ fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 }}
            numberOfLines={2}
          >
            Comment puis-je vous aider aujourd'hui ?
          </Text>
        </View>

        {/* ─── 3. Boutons d'actions rapides ─── */}
        <View className="flex-row flex-wrap gap-3 px-5 mt-6">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={{
              backgroundColor: COLORS.buttonPrimary,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
                android: { elevation: 3 },
              }),
            }}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Nouveau RDV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={{
              backgroundColor: COLORS.cardBg,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
                android: { elevation: 2 },
              }),
            }}
          >
            <Inbox size={20} color={COLORS.textPrimary} strokeWidth={2} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textPrimary }}>Demandes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={{
              backgroundColor: COLORS.cardBg,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
                android: { elevation: 2 },
              }),
            }}
          >
            <ImageIcon size={20} color={COLORS.textPrimary} strokeWidth={2} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textPrimary }}>Ma vitrine</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={{
              backgroundColor: COLORS.cardBg,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
                android: { elevation: 2 },
              }),
            }}
          >
            <LayoutGrid size={20} color={COLORS.textPrimary} strokeWidth={2} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textPrimary }}>+ Widget</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 4. Nouvelles demandes (swipeable) ─── */}
        {requests.length > 0 && (
          <View className="px-5 mt-6">
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 }}>
              Nouvelles demandes
            </Text>
            <View style={{ gap: 10 }}>
              {requests.map((req) => (
                <SwipeableCard
                  key={req.id}
                  id={req.id}
                  clientName={req.clientName}
                  service={req.service}
                  price={req.price}
                  onAccept={() => removeRequest(req.id)}
                  onReject={() => removeRequest(req.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ─── 5. Cartes de notification ─── */}
        <View className="px-5 mt-6 gap-4">
          {!dismissOrange && (
            <View
              style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.orangeBorder,
                padding: 16,
                ...Platform.select({
                  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
                  android: { elevation: 2 },
                }),
              }}
            >
              <View className="flex-row justify-end absolute top-3 right-3 z-10">
                <TouchableOpacity onPress={() => setDismissOrange(true)} className="p-1">
                  <X size={18} color={COLORS.closeIcon} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center gap-3 mb-3">
                <CreditCard size={22} color={COLORS.orangeIcon} strokeWidth={2} />
                <Text style={{ fontSize: 15, fontWeight: '500', color: COLORS.orangeText, flex: 1 }}>
                  3 RDV sans acompte payé
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  backgroundColor: COLORS.orangeButtonBg,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.orangeText }}>Voir les RDV</Text>
              </TouchableOpacity>
            </View>
          )}
          {!dismissBlue && (
            <View
              style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.blueBorder,
                padding: 16,
                ...Platform.select({
                  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
                  android: { elevation: 2 },
                }),
              }}
            >
              <View className="flex-row justify-end absolute top-3 right-3 z-10">
                <TouchableOpacity onPress={() => setDismissBlue(true)} className="p-1">
                  <X size={18} color={COLORS.closeIcon} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center gap-3 mb-3">
                <AlertTriangle size={22} color={COLORS.blueIcon} strokeWidth={2} />
                <Text style={{ fontSize: 15, fontWeight: '500', color: COLORS.blueText, flex: 1 }}>
                  1 RDV prévu(s) aujourd'hui ou demain
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  backgroundColor: COLORS.blueButtonBg,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.blueText }}>Voir le calendrier</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── 6. Bottom Tab Bar + FAB (Frosted Glass) ─── */}
      <BlurView
        tint="dark"
        intensity={80}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 12 : 16,
          paddingHorizontal: 8,
          overflow: 'hidden',
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8 },
            android: { elevation: 12 },
          }),
        }}
      >
        <TouchableOpacity className="items-center gap-1 flex-1">
          <LayoutGrid size={24} color={COLORS.tabActive} strokeWidth={2} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.tabActive }}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center gap-1 flex-1">
          <Calendar size={24} color={COLORS.tabInactive} strokeWidth={2} />
          <Text style={{ fontSize: 11, color: COLORS.tabInactive }}>Agenda</Text>
        </TouchableOpacity>
        <View className="flex-1 items-center" style={{ marginBottom: 24 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openBottomSheet}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#000000',
              alignItems: 'center',
              justifyContent: 'center',
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
                android: { elevation: 8 },
              }),
            }}
          >
            <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity className="items-center gap-1 flex-1">
          <Inbox size={24} color={COLORS.tabInactive} strokeWidth={2} />
          <Text style={{ fontSize: 11, color: COLORS.tabInactive }}>Demandes</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center gap-1 flex-1">
          <User size={24} color={COLORS.tabInactive} strokeWidth={2} />
          <Text style={{ fontSize: 11, color: COLORS.tabInactive }}>Profil</Text>
        </TouchableOpacity>
      </BlurView>

      {/* ─── Bottom Sheet (Menu coulissant) ─── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={BOTTOM_SHEET_SNAP_POINTS}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#18181B' }}
        handleIndicatorStyle={{ backgroundColor: '#3F3F46' }}
      >
        <BottomSheetView style={bottomSheetStyles.content}>
          {MENU_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.7}
              onPress={() => handleMenuOption(opt.id)}
              style={bottomSheetStyles.option}
            >
              <View style={bottomSheetStyles.optionIcon}>
                <opt.icon size={22} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={bottomSheetStyles.optionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const bottomSheetStyles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#27272A',
    marginBottom: 8,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
});
