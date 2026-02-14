import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Appointment } from '../../types';

const HOURS = [9, 10, 11, 12, 14, 15, 16, 17, 18];

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSlotClick: () => void;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ appointments, onSlotClick }) => {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d;
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const getAppointmentsForSlot = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(a => {
      if (a.date !== dateStr) return false;
      const aptHour = parseInt(a.time.split(':')[0], 10);
      return aptHour === hour;
    });
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return d.toDateString() === t.toDateString();
  };

  const goPrev = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goNext = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    setWeekStart(d);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-200">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-2 rounded-lg hover:bg-neutral-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold min-w-[200px] text-center">
            {weekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goNext} className="p-2 rounded-lg hover:bg-neutral-100">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={goToday} className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-100 hover:bg-neutral-200">
            Aujourd'hui
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid gap-2 min-w-[700px]" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
          <div />
          {weekDays.map(day => (
            <div key={day.toISOString()} className="text-center">
              <div className="text-xs text-neutral-500 uppercase mb-2">
                {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm ${
                isToday(day) ? 'bg-neutral-900 text-white' : 'bg-neutral-100'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 min-w-[700px]" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              <div className="text-xs text-neutral-500 py-4 text-right pr-2">{hour}:00</div>
              {weekDays.map(day => {
                const slotApts = getAppointmentsForSlot(day, hour);
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    onClick={onSlotClick}
                    className="relative min-h-[70px] rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 cursor-pointer p-2"
                  >
                    {slotApts.map(apt => (
                      <div
                        key={apt.id}
                        className="absolute inset-1 rounded-lg bg-neutral-900 text-white p-2 text-xs overflow-hidden"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="font-medium truncate">{apt.clientName}</div>
                        <div className="text-white/80 truncate">{apt.service}</div>
                        <div className="text-white/60 text-[10px]">{apt.time} • {apt.duration}min</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
