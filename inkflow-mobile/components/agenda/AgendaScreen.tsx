import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Menu, MoreHorizontal } from 'lucide-react-native';

const DAYS = [
  { label: 'LUI', day: '20' },
  { label: 'MA', day: '21' },
  { label: 'ME', day: '22' },
  { label: 'JE', day: '23' },
  { label: 'VE', day: '24', active: true },
  { label: 'SA', day: '25' },
];

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.syncBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.syncText}>Dernière synchro des données : 1 mai à 10:10</Text>
      </View>

      <View style={styles.header}>
        <Pressable style={styles.iconButton} hitSlop={10}>
          <Menu size={28} color="#3f3f46" />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} hitSlop={10}>
            <CalendarDays size={24} color="#52525b" />
          </Pressable>
          <Pressable style={styles.iconButton} hitSlop={10}>
            <MoreHorizontal size={25} color="#52525b" />
          </Pressable>
          <Pressable style={styles.bellButton} hitSlop={10}>
            <Bell size={22} color="#71717a" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </Pressable>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>N</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroOverlay} />
          <Text style={styles.heroTitle}>Synthèse agenda</Text>
          <Text style={styles.heroSubtitle}>
            Liste des rendez-vous sur la journée, la semaine ou le mois — sans ouvrir le planning complet.
          </Text>
        </View>

        <View style={styles.segmented}>
          <Pressable style={[styles.segment, styles.segmentActive]}>
            <Text style={styles.segmentActiveText}>Jour</Text>
          </Pressable>
          <Pressable style={styles.segment}>
            <Text style={styles.segmentText}>Semaine</Text>
          </Pressable>
          <Pressable style={styles.segment}>
            <Text style={styles.segmentText}>Mois</Text>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.roundButton}>
            <ChevronLeft size={22} color="#18181b" />
          </Pressable>
          <Pressable style={styles.roundButton}>
            <ChevronRight size={22} color="#18181b" />
          </Pressable>
          <Pressable style={styles.addCalendarButton}>
            <CalendarDays size={17} color="#18181b" />
            <Text style={styles.addCalendarText}>Ajouter à mon agenda</Text>
          </Pressable>
          <Pressable style={styles.todayButton}>
            <Text style={styles.todayText}>Aujourd’hui</Text>
          </Pressable>
        </View>

        <Text style={styles.dateTitle}>vendredi 24 avril 2026</Text>
        <View style={styles.periodPill}>
          <Text style={styles.periodText}>☷ 1 rendez-vous sur la période</Text>
        </View>

        <View style={styles.daysCard}>
          {DAYS.map((day) => (
            <View key={day.day} style={[styles.dayItem, day.active && styles.dayItemActive]}>
              <Text style={[styles.dayLabel, day.active && styles.dayTextActive]}>{day.label}</Text>
              <Text style={[styles.dayNumber, day.active && styles.dayTextActive]}>{day.day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.appointmentCard}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>C</Text>
          </View>
          <View style={styles.appointmentBody}>
            <Text style={styles.clientName}>Camille Bertrand</Text>
            <View style={styles.projectBadge}>
              <Text style={styles.projectBadgeText}>Projet</Text>
            </View>
            <View style={styles.appointmentLine}>
              <Text style={styles.appointmentLabel}>complet — consulta</Text>
              <Text style={styles.appointmentTime}>16:00 – 18:44</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>shoulder</Text>
            </View>
            <Text style={styles.doneText}>Terminé</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  syncBar: {
    backgroundColor: '#f4f4f5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e7',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  syncText: {
    color: '#71717a',
    fontSize: 14,
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e7',
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#dbeafe',
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarText: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 17,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  hero: {
    minHeight: 162,
    borderRadius: 22,
    overflow: 'hidden',
    padding: 22,
    justifyContent: 'flex-end',
    backgroundColor: '#18181b',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111827',
    opacity: 0.82,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    color: '#e5e7eb',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 10,
  },
  segmented: {
    marginTop: 22,
    height: 58,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#2563eb',
  },
  segmentText: {
    color: '#71717a',
    fontWeight: '700',
    fontSize: 16,
  },
  segmentActiveText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  actionRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCalendarButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  addCalendarText: {
    color: '#18181b',
    fontSize: 14,
    fontWeight: '700',
  },
  todayButton: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    color: '#18181b',
    fontWeight: '800',
    fontSize: 14,
  },
  dateTitle: {
    marginTop: 20,
    textAlign: 'center',
    color: '#18181b',
    fontSize: 18,
    fontWeight: '800',
  },
  periodPill: {
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  periodText: {
    color: '#71717a',
    fontSize: 15,
  },
  daysCard: {
    marginTop: 20,
    padding: 10,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#2563eb',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  dayItem: {
    width: 56,
    height: 64,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayItemActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  dayLabel: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '800',
  },
  dayNumber: {
    marginTop: 3,
    color: '#18181b',
    fontSize: 20,
    fontWeight: '900',
  },
  dayTextActive: {
    color: '#ffffff',
  },
  appointmentCard: {
    marginTop: 22,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 22,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#18181b',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  clientAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  appointmentBody: {
    flex: 1,
  },
  clientName: {
    color: '#18181b',
    fontSize: 18,
    fontWeight: '900',
  },
  projectBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#2563eb',
  },
  projectBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  appointmentLine: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  appointmentLabel: {
    flex: 1,
    color: '#18181b',
    fontSize: 16,
    fontWeight: '600',
  },
  appointmentTime: {
    color: '#18181b',
    fontSize: 16,
    fontWeight: '700',
  },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#fef9c3',
  },
  tagText: {
    color: '#854d0e',
    fontSize: 14,
    fontWeight: '700',
  },
  doneText: {
    marginTop: 7,
    color: '#a1a1aa',
    fontSize: 15,
    fontWeight: '600',
  },
});
