import React, { useState } from 'react';
import { MoreVertical, TrendingUp, DollarSign, Calendar, ChevronRight, Image as ImageIcon, Camera, Clock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(13);

  const weekData = [
    { 
      day: 'Lun', 
      date: 12, 
      appointments: [
        { time: '14:00', label: 'Consultation', client: 'Thomas' },
        { time: '16:30', label: 'Retouche', client: 'Sarah' }
      ] 
    },
    { 
      day: 'Mar', 
      date: 13, 
      appointments: [
        { time: '11:00', label: 'Bras Japonais', client: 'Lucas M.' }
      ] 
    },
    { 
      day: 'Mer', 
      date: 14, 
      appointments: [] 
    },
    { 
      day: 'Jeu', 
      date: 15, 
      appointments: [
        { time: '09:00', label: 'Flash #04', client: 'Julie' },
        { time: '14:00', label: 'Design Review', client: 'Max' }
      ] 
    },
    { 
      day: 'Ven', 
      date: 16, 
      disabled: true, 
      appointments: [] 
    },
  ];

  const selectedDayInfo = weekData.find(d => d.date === selectedDate);

  return (
    <div className="bg-neutral-100 min-h-screen font-sans text-neutral-900 p-4 md:p-8 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-black text-xl tracking-tighter shadow-lg shadow-black/20">
            IF.
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-none">Inkflow</h1>
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mt-1">Artist Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-sm font-medium text-neutral-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-neutral-200">
            Studio Paris 11e
          </span>
          <img 
            src="https://api.dicebear.com/9.x/avataaars/svg?seed=Felix" 
            alt="Artist Profile" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-md bg-gray-200 cursor-pointer hover:scale-105 transition-transform" 
          />
        </div>
      </header>
    
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 lg:gap-6 h-auto md:h-[800px]">
    
        {/* Card 1: Main Project (Large) */}
        <div className="md:col-span-2 md:row-span-2 bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start z-10">
            <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              En cours • 14:00
            </span>
            <button className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 text-neutral-600 transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
          
          <div className="z-10 mt-6 md:mt-0">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 mb-2 tracking-tight">Lucas M.</h2>
            <p className="text-neutral-500 text-lg lg:text-xl font-medium">Projet : "Bras Japonais - Carpe Koï"</p>
            
            <div className="flex flex-wrap gap-3 mt-8">
              <div className="bg-neutral-50 px-5 py-3 rounded-2xl border border-neutral-100 min-w-[120px]">
                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wide mb-1">Acompte</span>
                <span className="font-bold text-green-600 text-lg">Payé (50€)</span>
              </div>
              <div className="bg-neutral-50 px-5 py-3 rounded-2xl border border-neutral-100 min-w-[120px]">
                 <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wide mb-1">Reste</span>
                 <span className="font-bold text-neutral-900 text-lg">350€</span>
              </div>
            </div>
          </div>
    
          <div className="flex gap-3 mt-8 z-10">
            <button className="flex-1 bg-black text-white py-4 rounded-xl font-semibold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 active:scale-[0.98]">
              Ouvrir le projet
            </button>
            <button className="px-4 py-4 bg-neutral-100 rounded-xl font-semibold text-neutral-700 hover:bg-neutral-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group/btn" title="Ajouter une photo">
               <Camera size={20} className="text-neutral-500 group-hover/btn:text-neutral-900 transition-colors" />
            </button>
            <button className="px-6 py-4 bg-neutral-100 rounded-xl font-semibold text-neutral-700 hover:bg-neutral-200 transition-all active:scale-[0.98]">
              Consent Form
            </button>
          </div>
    
          {/* Decorative background blob */}
          <div className="absolute top-0 right-0 w-3/4 h-full opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-500">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full fill-current text-neutral-900">
              <path d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,71.2,32.4C60.2,43.3,49.5,52.2,37.8,60.1C26.1,68,13.4,74.9,-0.6,75.9C-14.6,76.9,-27.9,72,-40.4,64.6C-52.9,57.2,-64.6,47.3,-73.1,35.1C-81.6,22.9,-86.9,8.4,-85.2,-5.2C-83.5,-18.8,-74.8,-31.5,-64.3,-41.8C-53.8,-52.1,-41.5,-60,-29.1,-68.3C-16.7,-76.6,-4.2,-85.3,4.9,-93.8L14,-102.3L44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>
        </div>
    
        {/* Card 2: Revenue */}
        <div className="md:col-span-1 md:row-span-1 bg-neutral-900 rounded-[2rem] p-6 text-white flex flex-col justify-center relative overflow-hidden group shadow-lg shadow-neutral-900/10">
          <div className="absolute top-0 right-0 p-5 opacity-20 group-hover:opacity-30 transition-opacity">
            <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
               <DollarSign size={24} />
            </div>
          </div>
          <span className="text-neutral-400 text-sm font-semibold mb-2">Revenue (Aujourd'hui)</span>
          <div className="text-4xl lg:text-5xl font-bold tracking-tight">450€</div>
          <div className="text-green-400 text-sm font-medium mt-3 flex items-center gap-1.5">
            <TrendingUp size={16} />
            +120€ vs hier
          </div>
        </div>
    
        {/* Card 3: Requests */}
        <div className="md:col-span-1 md:row-span-1 bg-white rounded-[2rem] p-6 shadow-sm flex flex-col border border-neutral-100 hover:border-neutral-200 transition-colors">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-lg text-neutral-900">Demandes</h3>
            <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm shadow-red-500/30">3</span>
          </div>
          <div className="space-y-2 overflow-y-auto pr-1">
            <div className="flex items-center gap-3 p-2.5 hover:bg-neutral-50 rounded-xl transition cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-white group-hover:ring-blue-50 transition-all">JD</div>
              <div className="flex-1">
                <p className="text-sm font-bold leading-none text-neutral-900">Julie D.</p>
                <p className="text-xs text-neutral-400 mt-1 font-medium">Flash #04 - Bras...</p>
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="flex items-center gap-3 p-2.5 hover:bg-neutral-50 rounded-xl transition cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs ring-2 ring-white group-hover:ring-purple-50 transition-all">M</div>
              <div className="flex-1">
                <p className="text-sm font-bold leading-none text-neutral-900">Marc</p>
                <p className="text-xs text-neutral-400 mt-1 font-medium">Retouche</p>
              </div>
            </div>
          </div>
        </div>
    
        {/* Card 4: Stock */}
        <div className="md:col-span-1 md:row-span-1 bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-100 flex flex-col justify-between group hover:border-red-100 transition-colors">
          <div>
              <h3 className="font-bold text-lg mb-4 text-neutral-900">Stock Critique</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center shadow-lg shadow-neutral-900/20">
                    <div className="w-5 h-7 border border-white/30 rounded-sm relative bg-neutral-900 overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-white/80"></div>
                    </div>
                </div>
                <div>
                   <p className="text-sm font-bold text-neutral-900">Dynamic Black</p>
                   <p className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-md inline-block mt-1">Reste 10%</p>
                </div>
              </div>
          </div>
          <button className="w-full mt-4 text-xs bg-neutral-100 hover:bg-neutral-900 hover:text-white px-4 py-3 rounded-xl font-bold transition-all duration-300">
              Commander maintenant
          </button>
        </div>
    
        {/* Card 5: Agenda (Updated with Interactivity) */}
        <div className="md:col-span-2 md:row-span-1 bg-indigo-50 rounded-[2rem] p-6 lg:p-8 flex flex-col relative overflow-hidden">
            {/* Decorative circle */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200/50 rounded-full blur-2xl"></div>
            
          <div className="flex justify-between items-center relative z-10 mb-4">
             <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700">
                    <Calendar size={16} />
                </div>
                <h3 className="font-bold text-indigo-950">Agenda Semaine</h3>
             </div>
             <button className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1 transition-colors">
                Voir tout <ChevronRight size={14} />
             </button>
          </div>

          {/* Dynamic Appointment List */}
          <div className="flex-1 relative z-10 mb-4 min-h-[80px] flex flex-col justify-center">
            {selectedDayInfo?.disabled ? (
                 <div className="flex items-center justify-center text-indigo-300 text-sm font-medium italic bg-indigo-50/50 rounded-xl p-2 border border-dashed border-indigo-200">
                    Salon fermé
                 </div>
            ) : selectedDayInfo?.appointments.length === 0 ? (
                <div className="flex items-center justify-center text-indigo-300 text-sm font-medium">
                    Aucun rendez-vous
                </div>
            ) : (
                <div className="space-y-2 overflow-y-auto max-h-[120px] pr-1">
                    {selectedDayInfo?.appointments.map((apt, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/80 p-2.5 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1">
                                <Clock size={10} /> {apt.time}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-bold text-indigo-900 truncate">{apt.client}</p>
                                </div>
                                <p className="text-xs text-indigo-500 truncate font-medium">{apt.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* Day Selection Row */}
          <div className="flex justify-between gap-2 relative z-10 mt-auto">
             {weekData.map((item) => {
                 const isActive = selectedDate === item.date;
                 return (
                    <div 
                        key={item.date} 
                        onClick={() => !item.disabled && setSelectedDate(item.date)}
                        className={`flex flex-col items-center gap-2 cursor-pointer group transition-all duration-200 select-none ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                    >
                        <span className={`text-xs font-semibold transition-colors ${isActive ? 'text-indigo-700' : 'text-indigo-400 group-hover:text-indigo-600'}`}>
                            {item.day}
                        </span>
                        <div className={`w-10 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 relative ${
                            isActive 
                            ? 'bg-white text-indigo-700 shadow-lg shadow-indigo-200/50 border-indigo-500 scale-110' 
                            : 'bg-white/60 text-indigo-900 border-transparent group-hover:bg-white group-hover:border-indigo-200'
                        }`}>
                            {item.date}
                            {/* Dot indicator for existing appointments on non-active days */}
                            {item.appointments.length > 0 && !isActive && (
                                <div className="absolute bottom-1.5 w-1 h-1 bg-indigo-400 rounded-full"></div>
                            )}
                        </div>
                    </div>
                 )
             })}
          </div>
        </div>
    
        {/* Card 6: Portfolio */}
        <div className="md:col-span-1 md:row-span-1 bg-neutral-800 rounded-[2rem] relative overflow-hidden group cursor-pointer shadow-md">
           <img 
            src="https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&q=80&w=400&h=400" 
            alt="Portfolio Preview"
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition duration-700 ease-out" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
           <div className="absolute top-4 right-4 text-white/50 group-hover:text-white transition-colors">
                <ImageIcon size={20} />
           </div>
           <div className="absolute bottom-0 left-0 p-6 w-full">
              <p className="text-white font-bold text-xl mb-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">Portfolio</p>
              <div className="flex items-center gap-2 text-neutral-300 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                <span className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center text-[10px]">+</span>
                Ajouter photo
              </div>
           </div>
        </div>
    
      </div>
    </div>
  );
};