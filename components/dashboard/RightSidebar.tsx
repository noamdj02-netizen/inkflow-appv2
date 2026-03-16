/**
 * RightSidebar — Snow UI / ByeWind Activity Panel
 * Fond: bg-[#232329], Timeline verticale d'activités, Contacts du jour
 */
import React, { useMemo } from 'react';
import {
  CheckCircle2,
  MessageSquare,
  CreditCard,
  Clock,
} from 'lucide-react';
import type { Appointment, Client, ProjectRequest } from '../../types';

interface Activity {
  id: string;
  type: 'request' | 'deposit' | 'confirmed' | 'message';
  message: string;
  clientName?: string;
  clientAvatar?: string;
  timestamp: string;
}

interface RightSidebarProps {
  appointments: Appointment[];
  clients: Client[];
  projectRequests: ProjectRequest[];
  recentDeposits: Appointment[];
  todayAppointments: Appointment[];
  onSelectAppointment?: (apt: Appointment) => void;
}

const getIcon = (type: Activity['type']) => {
  switch (type) {
    case 'request':
      return <MessageSquare className="w-4 h-4 text-[#8ab4f8]" />;
    case 'deposit':
      return <CreditCard className="w-4 h-4 text-[#6ee7b7]" />;
    case 'confirmed':
      return <CheckCircle2 className="w-4 h-4 text-[#6ee7b7]" />;
    case 'message':
      return <MessageSquare className="w-4 h-4 text-[#c084fc]" />;
    default:
      return <MessageSquare className="w-4 h-4 text-[#9e9e9e]" />;
  }
};

const formatRelativeTime = (date: string | Date) => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  return `${diffDays} jours`;
};

export const RightSidebar: React.FC<RightSidebarProps> = ({
  appointments,
  clients,
  projectRequests,
  recentDeposits,
  todayAppointments,
  onSelectAppointment,
}) => {
  const activities = useMemo<Activity[]>(() => {
    const list: Activity[] = [];

    // Dernières demandes
    projectRequests
      .filter(p => p.status === 'PENDING')
      .slice(0, 3)
      .forEach(pr => {
        list.push({
          id: `pr_${pr.id}`,
          type: 'request',
          message: `Nouvelle demande de ${pr.clientName || 'Client'}`,
          clientName: pr.clientName,
          timestamp: pr.createdAt || new Date().toISOString(),
        });
      });

    // Derniers acomptes
    recentDeposits.slice(0, 3).forEach(apt => {
      list.push({
        id: `dep_${apt.id}`,
        type: 'deposit',
        message: `Acompte payé par ${apt.clientName || 'Client'}`,
        clientName: apt.clientName,
        timestamp: apt.updatedAt || apt.createdAt || new Date().toISOString(),
      });
    });

    // RDV confirmés récents
    appointments
      .filter(a => a.status === 'confirmed')
      .slice(0, 2)
      .forEach(apt => {
        list.push({
          id: `conf_${apt.id}`,
          type: 'confirmed',
          message: `RDV confirmé`,
          clientName: apt.clientName,
          timestamp: apt.updatedAt || apt.createdAt || new Date().toISOString(),
        });
      });

    // Trier par date
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
  }, [projectRequests, recentDeposits, appointments]);

  const contactsToday = useMemo(() => {
    return todayAppointments
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
      .slice(0, 6)
      .map(apt => {
        const client = clients.find(c => 
          c.id === apt.clientId || 
          c.email?.toLowerCase() === apt.clientEmail?.toLowerCase()
        );
        return {
          ...apt,
          avatar: client?.avatar,
        };
      });
  }, [todayAppointments, clients]);

  return (
    <aside className="hidden xl:flex w-72 h-screen flex-col bg-[#232329] border-l border-[#33333d] overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#33333d]">
        <h2 className="text-[15px] font-semibold text-white">Activité</h2>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {/* Notifications */}
        <div className="px-5 py-4">
          <p className="text-[11px] uppercase tracking-wider text-[#9e9e9e] font-medium mb-3">Notifications</p>
          <div className="space-y-1">
            {activities.length === 0 ? (
              <p className="text-sm text-[#9e9e9e] py-4 text-center">Aucune activité récente</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    {getIcon(activity.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-white leading-snug">{activity.message}</p>
                    <p className="text-[11px] text-[#9e9e9e] mt-0.5">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activities section */}
        <div className="px-5 py-4 border-t border-[#33333d]">
          <p className="text-[11px] uppercase tracking-wider text-[#9e9e9e] font-medium mb-3">Activités</p>
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div key={`act_${activity.id}`} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#8ab4f8] mt-2 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-white">{activity.message}</p>
                  <p className="text-[11px] text-[#9e9e9e]">{formatRelativeTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contacts du jour */}
        <div className="px-5 py-4 border-t border-[#33333d]">
          <p className="text-[11px] uppercase tracking-wider text-[#9e9e9e] font-medium mb-3">Clients du jour</p>
          <div className="space-y-2">
            {contactsToday.length === 0 ? (
              <p className="text-sm text-[#9e9e9e] py-2 text-center">Aucun RDV aujourd'hui</p>
            ) : (
              contactsToday.map((apt) => (
                <button
                  key={apt.id}
                  onClick={() => onSelectAppointment?.(apt)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {apt.avatar ? (
                      <img src={apt.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-white">
                        {apt.clientName?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-white truncate">{apt.clientName || 'Client'}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#9e9e9e]">
                      <Clock className="w-3 h-3" />
                      <span>{apt.time || '—'}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
