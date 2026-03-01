/**
 * AgendaScreen — Écran Agenda style Calendrier Apple (React Native + Expo)
 * Design épuré, intuitif : Toggle Liste | Journée, barre de dates, blocs RDV, FAB.
 * Charte : Bleu (#2563eb) + fond sombre/clair selon le thème.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, List, Calendar } from 'lucide-react-native';

export interface AgendaAppointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  price?: number;
}

/** Mappe un Appointment (web) vers AgendaAppointment pour l'écran mobile */
export function toAgendaAppointment(apt: { id: string; clientName: string; service: string; date: string; time: string; duration: number; price?: number }): AgendaAppointment {
  return {
    id: apt.id,
    clientName: apt.clientName,
    service: apt.service,
    date: apt.date,
    time: apt.time,
    duration: apt.duration,
    price: apt.price,
  };
}

interface AgendaScreenProps {
  appointments: AgendaAppointment[];
  onAddAppointment?: () => void;
  onAppointmentPress?: (apt: AgendaAppointment) => void;
}

const WEEKDAYS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 à 20:00

const BLUE_600 = '#2563eb';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDatesAround(center: Date, count: number): Date[] {
  const half = Math.floor(count / 2);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(center);
    d.setDate(center.getDate() - half + i);
    return d;
  });
}

// ─── Vue Journée : colonne heures (08:00–20:00) + blocs RDV style Apple ───────
function AgendaDayView({
  selectedDate,
  appointments,
  onAppointmentPress,
  isDark,
}: {
  selectedDate: Date;
  appointments: AgendaAppointment[];
  onAppointmentPress?: (apt: AgendaAppointment) => void;
  isDark: boolean;
}) {
  const dateStr = toDateStr(selectedDate);
  const dayAppointments = appointments.filter((a) => a.date === dateStr);

  const blocksByHour = useMemo(() => {
    const map: Record<number, AgendaAppointment[]> = {};
    HOURS.forEach((h) => { map[h] = []; });
    dayAppointments.forEach((apt) => {
      const hour = parseInt(apt.time.split(':')[0], 10);
      if (map[hour]) map[hour].push(apt);
    });
    return map;
  }, [dayAppointments]);

  // bg-blue-500/10 (dark) ou bg-blue-100 (clair), border-l-4 border-blue-600
  const blockBg = isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(219, 234, 254, 1)';
  const blockText = isDark ? '#bfdbfe' : '#1e3a8a'; // text-blue-100 dark, text-blue-900 light
  const blockServiceColor = isDark ? '#93c5fd' : '#1e40af';

  return (
    <ScrollView
      style={styles.dayScroll}
      contentContainerStyle={styles.dayScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {HOURS.map((hour) => (
        <View key={hour} style={styles.hourRow}>
          <Text style={[styles.hourLabel, { color: isDark ? '#71717a' : '#a1a1aa' }]}>
            {String(hour).padStart(2, '0')}:00
          </Text>
          <View style={styles.hourSlot}>
            {blocksByHour[hour]?.map((apt) => (
              <TouchableOpacity
                key={apt.id}
                activeOpacity={0.8}
                onPress={() => onAppointmentPress?.(apt)}
                style={[
                  styles.appointmentBlock,
                  {
                    backgroundColor: blockBg,
                    borderLeftColor: BLUE_600,
                  },
                ]}
              >
                <Text style={[styles.blockClientName, { color: blockText }]} numberOfLines={1}>
                  {apt.clientName}
                </Text>
                <Text style={[styles.blockService, { color: blockServiceColor }]} numberOfLines={1}>
                  {apt.service}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Vue Liste : jour "19 LUN" à gauche + ligne verticale + RDV à droite ──────
function AgendaListView({
  selectedDate,
  appointments,
  onAppointmentPress,
  isDark,
}: {
  selectedDate: Date;
  appointments: AgendaAppointment[];
  onAppointmentPress?: (apt: AgendaAppointment) => void;
  isDark: boolean;
}) {
  const dateStr = toDateStr(selectedDate);
  const dayAppointments = appointments
    .filter((a) => a.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const dayLabel = selectedDate.getDate();
  const weekdayLabel = WEEKDAYS[selectedDate.getDay()];

  const textPrimary = isDark ? '#f4f4f5' : '#18181b';
  const textSecondary = isDark ? '#a1a1aa' : '#52525b';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';

  return (
    <ScrollView
      style={styles.listScroll}
      contentContainerStyle={styles.listScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.listWrapper}>
        <View style={styles.listDayLeft}>
          <Text style={[styles.listDayNum, { color: textPrimary }]}>{dayLabel}</Text>
          <Text style={[styles.listDayWeek, { color: textSecondary }]}>{weekdayLabel}</Text>
        </View>
        <View style={styles.listRight}>
          <View style={[styles.listVerticalLine, { backgroundColor: borderColor }]} />
          <View style={styles.listContent}>
            {dayAppointments.length === 0 ? (
              <Text style={[styles.listEmpty, { color: textSecondary }]}>Aucun rendez-vous ce jour</Text>
            ) : (
              dayAppointments.map((apt) => {
                const [startH, startM] = apt.time.split(':').map(Number);
                const endMin = startM + apt.duration;
                const endH = startH + Math.floor(endMin / 60);
                const endM = endMin % 60;
                const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                return (
                  <TouchableOpacity
                    key={apt.id}
                    activeOpacity={0.7}
                    onPress={() => onAppointmentPress?.(apt)}
                    style={styles.listRow}
                  >
                    <View style={styles.listRowLeft}>
                      <View style={styles.listDot} />
                      <Text style={[styles.listTime, { color: textPrimary }]}>
                        {apt.time} - {endTime}
                      </Text>
                    </View>
                    <View style={styles.listRowRight}>
                      <Text style={[styles.listClientName, { color: textPrimary }]} numberOfLines={1}>
                        {apt.clientName}
                      </Text>
                      <Text style={[styles.listService, { color: textSecondary }]} numberOfLines={1}>
                        {apt.service}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default function AgendaScreen({
  appointments = [],
  onAddAppointment,
  onAppointmentPress,
}: AgendaScreenProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [viewMode, setViewMode] = useState<'list' | 'day'>('list');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const dates = useMemo(() => getDatesAround(selectedDate, 14), [selectedDate]);
  const todayStr = toDateStr(new Date());
  const selectedStr = toDateStr(selectedDate);

  const bgPrimary = isDark ? '#09090b' : '#ffffff';
  const textPrimary = isDark ? '#f4f4f5' : '#18181b';
  const textSecondary = isDark ? '#a1a1aa' : '#71717a';

  return (
    <View style={[styles.container, { backgroundColor: bgPrimary, paddingTop: insets.top }]}>
      {/* Header : Toggle Liste | Journée */}
      <View style={styles.header}>
        <View style={[styles.toggle, { backgroundColor: isDark ? '#27272a' : '#f4f4f5' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setViewMode('list')}
            style={[styles.togglePill, viewMode === 'list' && { backgroundColor: BLUE_600 }]}
          >
            <List size={16} color={viewMode === 'list' ? '#ffffff' : textSecondary} strokeWidth={2} />
            <Text style={[styles.toggleText, { color: viewMode === 'list' ? '#ffffff' : textSecondary }]}>
              Liste
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setViewMode('day')}
            style={[styles.togglePill, viewMode === 'day' && { backgroundColor: BLUE_600 }]}
          >
            <Calendar size={16} color={viewMode === 'day' ? '#ffffff' : textSecondary} strokeWidth={2} />
            <Text style={[styles.toggleText, { color: viewMode === 'day' ? '#ffffff' : textSecondary }]}>
              Journée
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barre de dates horizontale : jour sélectionné = cercle bleu, autres sans fond */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.dateBar, { paddingBottom: 12 }]}
      >
        {dates.map((d) => {
          const str = toDateStr(d);
          const isSelected = str === selectedStr;
          return (
            <TouchableOpacity
              key={str}
              activeOpacity={0.8}
              onPress={() => setSelectedDate(new Date(d))}
              style={[
                styles.dateCell,
                isSelected && styles.dateCellSelected,
              ]}
            >
              <Text
                style={[
                  styles.dateWeekday,
                  { color: isSelected ? '#ffffff' : textSecondary },
                ]}
              >
                {WEEKDAYS[d.getDay()].slice(0, 2)}
              </Text>
              <Text
                style={[
                  styles.dateDay,
                  { color: isSelected ? '#ffffff' : textPrimary },
                ]}
              >
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Contenu : Liste ou Journée */}
      <View style={styles.content}>
        {viewMode === 'list' ? (
          <AgendaListView
            selectedDate={selectedDate}
            appointments={appointments}
            onAppointmentPress={onAppointmentPress}
            isDark={isDark}
          />
        ) : (
          <AgendaDayView
            selectedDate={selectedDate}
            appointments={appointments}
            onAppointmentPress={onAppointmentPress}
            isDark={isDark}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onAddAppointment}
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  togglePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateBar: {
    paddingHorizontal: 16,
    gap: 10,
  },
  dateCell: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  dateCellSelected: {
    backgroundColor: BLUE_600,
  },
  dateWeekday: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Day view
  dayScroll: {
    flex: 1,
  },
  dayScrollContent: {
    paddingBottom: 100,
  },
  hourRow: {
    flexDirection: 'row',
    minHeight: 72,
    marginBottom: 4,
  },
  hourLabel: {
    width: 48,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
    paddingTop: 4,
    paddingRight: 8,
  },
  hourSlot: {
    flex: 1,
    paddingLeft: 8,
  },
  appointmentBlock: {
    borderLeftWidth: 4,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    padding: 12,
    marginBottom: 6,
  },
  blockClientName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  blockService: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
  },
  // List view
  listScroll: {
    flex: 1,
  },
  listScrollContent: {
    paddingBottom: 100,
  },
  listWrapper: {
    flexDirection: 'row',
    minHeight: 200,
  },
  listDayLeft: {
    width: 56,
    alignItems: 'center',
    paddingTop: 8,
  },
  listRight: {
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  listDayNum: {
    fontSize: 28,
    fontWeight: '800',
  },
  listDayWeek: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  listVerticalLine: {
    width: 1,
    marginLeft: 12,
    marginRight: 16,
    alignSelf: 'stretch',
  },
  listContent: {
    flex: 1,
    paddingTop: 4,
  },
  listEmpty: {
    fontSize: 14,
    marginTop: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  listRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 90,
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE_600,
  },
  listTime: {
    fontSize: 13,
    fontWeight: '700',
  },
  listRowRight: {
    flex: 1,
    minWidth: 0,
  },
  listClientName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  listService: {
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BLUE_600,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
});
