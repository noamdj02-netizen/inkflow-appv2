/**
 * HomeScreen — Écran d'accueil CRM/Dashboard (React Native + Expo + NativeWind)
 * À placer dans un projet Expo avec NativeWind configuré.
 * Icônes : npm install lucide-react-native react-native-svg
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Platform,
} from 'react-native';
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
} from 'lucide-react-native';

const COLORS = {
  bgApp: '#E8E2F6',
  textPrimary: '#1A1035',
  textSecondary: '#7A5DD8',
  buttonPrimary: '#6B38E0',
  cardBg: '#FFFFFF',
  avatarBg: '#E5E3F0',
  avatarLetter: '#6B38E0',
  orangeBorder: '#F59E0B',
  orangeIcon: '#D97706',
  orangeButtonBg: '#FEF3C7',
  orangeText: '#B45309',
  blueBorder: '#3B82F6',
  blueIcon: '#2563EB',
  blueButtonBg: '#DBEAFE',
  blueText: '#1D4ED8',
  tabInactive: '#8B7BB5',
  tabActive: '#1A1035',
  closeIcon: '#6B7280',
};

export default function HomeScreen() {
  const [toggleOn, setToggleOn] = useState(true);
  const [dismissOrange, setDismissOrange] = useState(false);
  const [dismissBlue, setDismissBlue] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgApp }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Header ─── */}
        <View className="flex-row justify-between items-center px-5 pt-2 pb-2">
          <TouchableOpacity activeOpacity={0.7} className="p-2 -ml-2">
            <Menu size={24} color={COLORS.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Sun size={18} color={COLORS.textSecondary} strokeWidth={2} />
              <Switch
                value={toggleOn}
                onValueChange={setToggleOn}
                trackColor={{ false: '#E5E3F0', true: '#6B38E0' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <TouchableOpacity activeOpacity={0.7} className="p-1.5">
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
        </View>

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

        {/* ─── 4. Cartes de notification ─── */}
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

      {/* ─── 5. Bottom Tab Bar + FAB ─── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: COLORS.cardBg,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 16,
          paddingHorizontal: 8,
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
      </View>
    </SafeAreaView>
  );
}
