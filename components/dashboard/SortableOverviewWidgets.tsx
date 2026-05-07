import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { syncWidgetOrderToApi, FIXED_WIDGET_IDS } from '../../lib/dashboardWidgetOrder';

export interface SortableWidgetItem {
  id: string;
  node: React.ReactNode;
}

interface SortableOverviewWidgetsProps {
  items: SortableWidgetItem[];
  customWidgetIds: string[];
  onOrderChange?: (order: string[]) => void;
  studioId?: string | null;
  useSupabase?: boolean;
  /** Désactive le drag sur mobile (< 768px) */
  disabled?: boolean;
  /** Élément à afficher en fin de grille */
  appendNode?: React.ReactNode;
  /** Colonnes desktop (2 ou 4) */
  gridCols?: 2 | 4;
}

const STORAGE_KEY = 'inkflow-dashboard-widget-order';

function getStoredOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...FIXED_WIDGET_IDS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...FIXED_WIDGET_IDS];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [...FIXED_WIDGET_IDS];
  }
}

function mergeOrder(stored: string[], customIds: string[]): string[] {
  const fixedIds = new Set<string>([...FIXED_WIDGET_IDS]);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of stored) {
    if (seen.has(id)) continue;
    if (fixedIds.has(id) || customIds.includes(id)) {
      result.push(id);
      seen.add(id);
    }
  }
  for (const id of FIXED_WIDGET_IDS) {
    if (!seen.has(id)) result.push(id);
  }
  for (const id of customIds) {
    if (!seen.has(id)) result.push(id);
  }
  return result;
}

function SortableWidget({
  id,
  children,
  disabled,
}: {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging && { willChange: 'transform' }),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative transition-all duration-200 ${
        isDragging
          ? 'opacity-90 shadow-xl shadow-black/20 scale-[1.02] z-50 ring-2 ring-blue-500/30 rounded-2xl'
          : ''
      }`}
    >
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-lg cursor-grab active:cursor-grabbing bg-white/70 dark:bg-white/10 backdrop-blur-sm text-zinc-600 dark:text-white/80 hover:opacity-100 opacity-30 hover:bg-white/90 dark:hover:bg-white/20 transition-all touch-none shadow-sm"
          aria-label="Déplacer le widget"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      <div className={disabled ? '' : 'pr-9'}>{children}</div>
    </div>
  );
}

export const SortableOverviewWidgets: React.FC<SortableOverviewWidgetsProps> = ({
  items,
  customWidgetIds,
  onOrderChange,
  studioId = null,
  useSupabase = false,
  disabled = false,
  appendNode,
  gridCols = 4,
}) => {
  const [order, setOrder] = useState<string[]>(() => {
    const stored = getStoredOrder();
    return mergeOrder(stored, customWidgetIds);
  });

  useEffect(() => {
    setOrder((prev) => mergeOrder(prev, customWidgetIds));
  }, [customWidgetIds]);

  useEffect(() => {
    if (!studioId || !useSupabase) return;
    let cancelled = false;
    import('../../lib/supabaseDashboard')
      .then(({ getWidgetOrderFromSupabase }) =>
        getWidgetOrderFromSupabase(studioId).then((fromApi) => {
          if (!cancelled && fromApi.length > 0)
            setOrder(() => mergeOrder(fromApi, customWidgetIds));
        })
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [studioId, useSupabase, customWidgetIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setOrder((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = arrayMove(prev, oldIndex, newIndex) as string[];
        if (studioId && useSupabase) void syncWidgetOrderToApi(studioId, next);
        else void syncWidgetOrderToApi('', next); // localStorage only when no studioId
        onOrderChange?.(next);
        return next;
      });
    },
    [onOrderChange, studioId, useSupabase]
  );

  const itemsById = useMemo(() => {
    const map = new Map<string, SortableWidgetItem>();
    for (const item of items) {
      map.set(item.id, item);
    }
    return map;
  }, [items]);

  const sortedItems = useMemo(() => {
    const result: SortableWidgetItem[] = [];
    for (const id of order) {
      const item = itemsById.get(id);
      if (item) result.push(item);
    }
    for (const item of items) {
      if (!order.includes(item.id)) result.push(item);
    }
    return result;
  }, [order, itemsById, items]);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  const dragDisabled = disabled || isMobile;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div
          className={`grid grid-cols-2 gap-4 ${gridCols === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}
        >
          {sortedItems.map((item) => (
            <div key={item.id} className="min-w-0">
              <SortableWidget id={item.id} disabled={dragDisabled}>
                {item.node}
              </SortableWidget>
            </div>
          ))}
          {appendNode}
        </div>
      </SortableContext>
    </DndContext>
  );
};
