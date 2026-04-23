/**
 * Dashboard avec widgets réorganisables par drag-and-drop.
 * Les utilisateurs peuvent déplacer les widgets entre les colonnes.
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GripVertical, Settings2, RotateCcw, Lock, Unlock, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getLayoutFromStorage,
  setLayoutToStorage,
  DEFAULT_LAYOUT,
  type DashboardLayout,
} from '../../lib/dashboardWidgetOrder';

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  component: React.ReactNode;
  minWidth?: 'full' | 'half';
  canHide?: boolean;
}

interface DraggableDashboardProps {
  widgets: DashboardWidgetConfig[];
  kpiWidgets?: DashboardWidgetConfig[];
  studioId?: string | null;
  useSupabase?: boolean;
  header?: React.ReactNode;
  alerts?: React.ReactNode;
}

interface SortableWidgetProps {
  key?: React.Key;
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  isEditMode?: boolean;
  title?: string;
  onRemove?: () => void;
}

function SortableWidget({ id, children, disabled, isEditMode, title, onRemove }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group transition-all duration-200 ${
        isDragging ? 'z-50' : ''
      } ${isOver ? 'ring-2 ring-blue-500/30 ring-offset-2 rounded-2xl' : ''} ${
        isEditMode ? 'cursor-move' : ''
      }`}
    >
      {isEditMode && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="absolute -top-2 -left-2 z-20 p-1.5 rounded-lg cursor-grab active:cursor-grabbing bg-blue-600 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity touch-none"
            aria-label="Déplacer le widget"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 z-20 p-1.5 rounded-lg bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              aria-label="Masquer le widget"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-600 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
      )}
      {children}
    </div>
  );
}

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isEditMode?: boolean;
}

function DroppableColumn({ id, children, className = '', isEditMode }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${
        isOver && isEditMode ? 'bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl' : ''
      } transition-colors duration-200`}
    >
      {children}
    </div>
  );
}

export const DraggableDashboard: React.FC<DraggableDashboardProps> = ({
  widgets,
  kpiWidgets = [],
  studioId,
  useSupabase = false,
  header,
  alerts,
}) => {
  const [layout, setLayout] = useState<DashboardLayout>(() => getLayoutFromStorage());
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());

  const widgetsMap = useMemo(() => {
    const map = new Map<string, DashboardWidgetConfig>();
    [...widgets, ...kpiWidgets].forEach(w => map.set(w.id, w));
    return map;
  }, [widgets, kpiWidgets]);

  useEffect(() => {
    setLayoutToStorage(layout);
  }, [layout]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const findColumn = (id: string): 'left' | 'right' | 'kpi' | null => {
      if (layout.leftColumn.includes(id)) return 'left';
      if (layout.rightColumn.includes(id)) return 'right';
      if (layout.kpiOrder.includes(id)) return 'kpi';
      if (id === 'left-column') return 'left';
      if (id === 'right-column') return 'right';
      return null;
    };

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    if (activeColumn === 'kpi' || overColumn === 'kpi') return;

    setLayout(prev => {
      const newLayout = { ...prev };
      
      if (activeColumn === 'left') {
        newLayout.leftColumn = prev.leftColumn.filter(id => id !== activeId);
      } else {
        newLayout.rightColumn = prev.rightColumn.filter(id => id !== activeId);
      }

      if (overColumn === 'left') {
        const overIndex = prev.leftColumn.indexOf(overId);
        if (overIndex >= 0) {
          newLayout.leftColumn = [
            ...newLayout.leftColumn.slice(0, overIndex),
            activeId,
            ...newLayout.leftColumn.slice(overIndex),
          ];
        } else {
          newLayout.leftColumn = [...newLayout.leftColumn, activeId];
        }
      } else {
        const overIndex = prev.rightColumn.indexOf(overId);
        if (overIndex >= 0) {
          newLayout.rightColumn = [
            ...newLayout.rightColumn.slice(0, overIndex),
            activeId,
            ...newLayout.rightColumn.slice(overIndex),
          ];
        } else {
          newLayout.rightColumn = [...newLayout.rightColumn, activeId];
        }
      }

      return newLayout;
    });
  }, [layout]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setLayout(prev => {
      const newLayout = { ...prev };

      if (prev.kpiOrder.includes(activeId) && prev.kpiOrder.includes(overId)) {
        const oldIndex = prev.kpiOrder.indexOf(activeId);
        const newIndex = prev.kpiOrder.indexOf(overId);
        newLayout.kpiOrder = arrayMove(prev.kpiOrder, oldIndex, newIndex);
        return newLayout;
      }

      if (prev.leftColumn.includes(activeId) && prev.leftColumn.includes(overId)) {
        const oldIndex = prev.leftColumn.indexOf(activeId);
        const newIndex = prev.leftColumn.indexOf(overId);
        newLayout.leftColumn = arrayMove(prev.leftColumn, oldIndex, newIndex);
        return newLayout;
      }

      if (prev.rightColumn.includes(activeId) && prev.rightColumn.includes(overId)) {
        const oldIndex = prev.rightColumn.indexOf(activeId);
        const newIndex = prev.rightColumn.indexOf(overId);
        newLayout.rightColumn = arrayMove(prev.rightColumn, oldIndex, newIndex);
        return newLayout;
      }

      return newLayout;
    });
  }, []);

  const handleResetLayout = useCallback(() => {
    setLayout({ ...DEFAULT_LAYOUT });
    setHiddenWidgets(new Set());
  }, []);

  const handleHideWidget = useCallback((widgetId: string) => {
    setHiddenWidgets(prev => new Set([...prev, widgetId]));
  }, []);

  const handleShowWidget = useCallback((widgetId: string) => {
    setHiddenWidgets(prev => {
      const next = new Set(prev);
      next.delete(widgetId);
      return next;
    });
  }, []);

  const activeWidget = activeId ? widgetsMap.get(activeId) : null;

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const fn = () => setIsMobile(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const renderWidget = (widgetId: string) => {
    if (hiddenWidgets.has(widgetId)) return null;
    const widget = widgetsMap.get(widgetId);
    if (!widget) return null;
    return (
      <SortableWidget
        key={widgetId}
        id={widgetId}
        disabled={!isEditMode || isMobile}
        isEditMode={isEditMode && !isMobile}
        title={widget.title}
        onRemove={widget.canHide ? () => handleHideWidget(widgetId) : undefined}
      >
        {widget.component}
      </SortableWidget>
    );
  };

  const visibleLeftWidgets = layout.leftColumn.filter(id => !hiddenWidgets.has(id));
  const visibleRightWidgets = layout.rightColumn.filter(id => !hiddenWidgets.has(id));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-full bg-slate-50/50 dark:bg-black">
        {/* Edit Mode Controls */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          {isEditMode && (
            <>
              <button
                onClick={handleResetLayout}
                className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Réinitialiser le layout"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              {hiddenWidgets.size > 0 && (
                <div className="relative group">
                  <button
                    className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                    title={`${hiddenWidgets.size} widget(s) masqué(s)`}
                  >
                    <span className="text-sm font-bold">{hiddenWidgets.size}</span>
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mb-2 px-2">Widgets masqués</p>
                    {[...hiddenWidgets].map(id => {
                      const w = widgetsMap.get(id);
                      return w ? (
                        <button
                          key={id}
                          onClick={() => handleShowWidget(id)}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          + {w.title}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </>
          )}
          <button
            onClick={() => setIsEditMode(prev => !prev)}
            className={`p-3 rounded-xl shadow-lg transition-all ${
              isEditMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            title={isEditMode ? 'Terminer la personnalisation' : 'Personnaliser le dashboard'}
          >
            {isEditMode ? <Lock className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Edit Mode Banner */}
        {isEditMode && !isMobile && (
          <div className="sticky top-0 z-40 bg-blue-600 text-white px-4 py-2.5 text-center">
            <p className="text-sm font-medium flex items-center justify-center gap-2">
              <GripVertical className="w-4 h-4" />
              Mode personnalisation — Glissez les widgets pour les réorganiser
            </p>
          </div>
        )}

        {/* Header */}
        {header}

        {/* Alerts */}
        {alerts}

        {/* KPI Grid */}
        {kpiWidgets.length > 0 && (
          <div className="px-4 sm:px-6 lg:px-8 pb-6">
            <SortableContext items={layout.kpiOrder} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {layout.kpiOrder.map(id => renderWidget(id))}
              </div>
            </SortableContext>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <DroppableColumn id="left-column" className="lg:col-span-2 space-y-6" isEditMode={isEditMode}>
              <SortableContext items={visibleLeftWidgets} strategy={verticalListSortingStrategy}>
                {visibleLeftWidgets.map(id => renderWidget(id))}
              </SortableContext>
            </DroppableColumn>

            {/* Right Column */}
            <DroppableColumn id="right-column" className="space-y-6" isEditMode={isEditMode}>
              <SortableContext items={visibleRightWidgets} strategy={verticalListSortingStrategy}>
                {visibleRightWidgets.map(id => renderWidget(id))}
              </SortableContext>
            </DroppableColumn>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeWidget ? (
          <div className="opacity-90 shadow-2xl rounded-2xl ring-2 ring-blue-500 scale-[1.02]">
            {activeWidget.component}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
