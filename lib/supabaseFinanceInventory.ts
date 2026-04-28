import { supabase } from './supabase';
import type { Json } from '../types/database';
import { normalizeStudioFinancePrefs, type StudioFinancePrefs } from '../types/studioFinancePrefs';

export async function getStudioFinancePrefsFromSupabase(
  studioId: string
): Promise<StudioFinancePrefs> {
  const { data, error } = await supabase
    .from('inkflow_studio_finance_prefs')
    .select('settings')
    .eq('studio_id', studioId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  const raw = (data?.settings as Record<string, unknown> | undefined) ?? {};
  return normalizeStudioFinancePrefs(raw);
}

export async function saveStudioFinancePrefsToSupabase(
  studioId: string,
  prefs: StudioFinancePrefs
): Promise<void> {
  const { error } = await supabase.from('inkflow_studio_finance_prefs').upsert(
    {
      studio_id: studioId,
      settings: prefs as unknown as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'studio_id' }
  );
  if (error) throw error;
}

export interface FiscalChecklistRow {
  id: string;
  studio_id: string;
  month: string;
  item_key: string;
  checked: boolean;
  checked_at: string | null;
  created_at: string;
}

export async function fetchFiscalChecklistForMonth(
  studioId: string,
  monthYYYYMM: string
): Promise<FiscalChecklistRow[]> {
  const { data, error } = await supabase
    .from('inkflow_fiscal_checklist')
    .select('id, studio_id, month, item_key, checked, checked_at, created_at')
    .eq('studio_id', studioId)
    .eq('month', monthYYYYMM);
  if (error) throw error;
  return (data ?? []) as FiscalChecklistRow[];
}

export async function setFiscalChecklistItem(
  studioId: string,
  monthYYYYMM: string,
  itemKey: string,
  checked: boolean
): Promise<void> {
  const { error } = await supabase.from('inkflow_fiscal_checklist').upsert(
    {
      studio_id: studioId,
      month: monthYYYYMM,
      item_key: itemKey,
      checked,
      checked_at: checked ? new Date().toISOString() : null,
    } as Record<string, unknown>,
    { onConflict: 'studio_id,month,item_key' }
  );
  if (error) throw error;
}

export interface ConsumableProductRow {
  id: string;
  studio_id: string;
  name: string;
  category: string;
  unit: string;
  qty_on_hand: number;
  brand: string | null;
  sku: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsumableSupplierRow {
  id: string;
  studio_id: string;
  name: string;
  website: string | null;
  default_shipping_fee_cents: number;
  free_shipping_threshold_cents: number | null;
  created_at: string;
}

export interface ConsumablePriceRow {
  id: string;
  studio_id: string;
  product_id: string;
  supplier_id: string;
  price_cents: number;
  pack_size: number;
  valid_from: string;
  notes: string | null;
  created_at: string;
}

export interface StockMovementRow {
  id: string;
  studio_id: string;
  product_id: string;
  delta_qty: number;
  reason: string | null;
  source: 'manual' | 'voice' | 'adjustment' | 'appointment';
  appointment_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface ConsumableLotRow {
  id: string;
  studio_id: string;
  raw_barcode: string | null;
  lot_number: string;
  expiry_date: string | null;
  product_label: string | null;
  supplier_name: string | null;
  client_id: string | null;
  appointment_id: string | null;
  created_at: string;
}

export interface AppointmentCostRow {
  id: string;
  studio_id: string;
  appointment_id: string | null;
  label: string;
  amount_cents: number;
  created_at: string;
}

export async function fetchConsumableProducts(studioId: string): Promise<ConsumableProductRow[]> {
  const { data, error } = await supabase
    .from('inkflow_consumable_products')
    .select('*')
    .eq('studio_id', studioId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...(r as ConsumableProductRow),
    brand: (r as { brand?: string | null }).brand ?? null,
    sku: (r as { sku?: string | null }).sku ?? null,
  }));
}

export async function insertConsumableProduct(
  studioId: string,
  payload: {
    name: string;
    category?: string;
    unit?: string;
    brand?: string | null;
    sku?: string | null;
  }
): Promise<ConsumableProductRow> {
  const { data, error } = await supabase
    .from('inkflow_consumable_products')
    .insert({
      studio_id: studioId,
      name: payload.name.trim(),
      category: payload.category?.trim() || 'other',
      unit: payload.unit?.trim() || 'unité',
      brand: payload.brand?.trim() || null,
      sku: payload.sku?.trim() || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ConsumableProductRow;
}

export async function updateConsumableProduct(
  studioId: string,
  productId: string,
  payload: Partial<{
    name: string;
    category: string;
    unit: string;
    brand: string | null;
    sku: string | null;
  }>
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.name !== undefined) patch.name = payload.name.trim();
  if (payload.category !== undefined) patch.category = payload.category.trim();
  if (payload.unit !== undefined) patch.unit = payload.unit.trim();
  if (payload.brand !== undefined) patch.brand = payload.brand?.trim() || null;
  if (payload.sku !== undefined) patch.sku = payload.sku?.trim() || null;
  const { error } = await supabase
    .from('inkflow_consumable_products')
    .update(patch)
    .eq('id', productId)
    .eq('studio_id', studioId);
  if (error) throw error;
}

export async function fetchConsumableSuppliers(studioId: string): Promise<ConsumableSupplierRow[]> {
  const { data, error } = await supabase
    .from('inkflow_consumable_suppliers')
    .select('*')
    .eq('studio_id', studioId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as ConsumableSupplierRow & {
      default_shipping_fee_cents?: number;
      free_shipping_threshold_cents?: number | null;
    };
    return {
      ...row,
      default_shipping_fee_cents: row.default_shipping_fee_cents ?? 0,
      free_shipping_threshold_cents: row.free_shipping_threshold_cents ?? null,
    };
  });
}

export async function insertConsumableSupplier(
  studioId: string,
  payload: {
    name: string;
    website?: string | null;
    default_shipping_fee_cents?: number;
    free_shipping_threshold_cents?: number | null;
  }
): Promise<ConsumableSupplierRow> {
  const { data, error } = await supabase
    .from('inkflow_consumable_suppliers')
    .insert({
      studio_id: studioId,
      name: payload.name.trim(),
      website: payload.website?.trim() || null,
      default_shipping_fee_cents: Math.max(0, Math.round(payload.default_shipping_fee_cents ?? 0)),
      free_shipping_threshold_cents:
        payload.free_shipping_threshold_cents == null
          ? null
          : Math.max(0, Math.round(payload.free_shipping_threshold_cents)),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ConsumableSupplierRow;
}

export async function updateConsumableSupplier(
  studioId: string,
  supplierId: string,
  payload: Partial<{
    name: string;
    website: string | null;
    default_shipping_fee_cents: number;
    free_shipping_threshold_cents: number | null;
  }>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (payload.name !== undefined) patch.name = payload.name.trim();
  if (payload.website !== undefined) patch.website = payload.website?.trim() || null;
  if (payload.default_shipping_fee_cents !== undefined) {
    patch.default_shipping_fee_cents = Math.max(0, Math.round(payload.default_shipping_fee_cents));
  }
  if (payload.free_shipping_threshold_cents !== undefined) {
    const v = payload.free_shipping_threshold_cents;
    patch.free_shipping_threshold_cents = v == null ? null : Math.max(0, Math.round(v));
  }
  const { error } = await supabase
    .from('inkflow_consumable_suppliers')
    .update(patch)
    .eq('id', supplierId)
    .eq('studio_id', studioId);
  if (error) throw error;
}

export async function fetchPricesForStudio(studioId: string): Promise<ConsumablePriceRow[]> {
  const { data, error } = await supabase
    .from('inkflow_consumable_prices')
    .select('*')
    .eq('studio_id', studioId)
    .order('valid_from', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ConsumablePriceRow[];
}

export async function insertConsumablePrice(
  studioId: string,
  payload: {
    product_id: string;
    supplier_id: string;
    price_cents: number;
    pack_size?: number;
    notes?: string | null;
    /** YYYY-MM-DD — nouvelle entrée historisée */
    valid_from?: string;
  }
): Promise<ConsumablePriceRow> {
  const { data, error } = await supabase
    .from('inkflow_consumable_prices')
    .insert({
      studio_id: studioId,
      product_id: payload.product_id,
      supplier_id: payload.supplier_id,
      price_cents: Math.max(0, Math.round(payload.price_cents)),
      pack_size: Math.max(1, payload.pack_size ?? 1),
      notes: payload.notes?.trim() || null,
      valid_from: payload.valid_from?.trim() || new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ConsumablePriceRow;
}

export async function insertStockMovement(
  studioId: string,
  payload: {
    product_id: string;
    delta_qty: number;
    reason?: string | null;
    source?: StockMovementRow['source'];
    appointment_id?: string | null;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from('inkflow_stock_movements').insert({
    studio_id: studioId,
    product_id: payload.product_id,
    delta_qty: payload.delta_qty,
    reason: payload.reason ?? null,
    source: payload.source ?? 'manual',
    appointment_id: payload.appointment_id ?? null,
    meta: (payload.meta ?? {}) as Json,
  });
  if (error) throw error;
}

export async function fetchStockMovements(
  studioId: string,
  limit = 80
): Promise<StockMovementRow[]> {
  const { data, error } = await supabase
    .from('inkflow_stock_movements')
    .select('*')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as StockMovementRow[];
}

export async function fetchConsumableLots(studioId: string): Promise<ConsumableLotRow[]> {
  const { data, error } = await supabase
    .from('inkflow_consumable_lots')
    .select('*')
    .eq('studio_id', studioId)
    .order('expiry_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as ConsumableLotRow[];
}

export async function insertConsumableLot(
  studioId: string,
  payload: {
    raw_barcode?: string | null;
    lot_number: string;
    expiry_date?: string | null;
    product_label?: string | null;
    supplier_name?: string | null;
    client_id?: string | null;
    appointment_id?: string | null;
  }
): Promise<ConsumableLotRow> {
  const { data, error } = await supabase
    .from('inkflow_consumable_lots')
    .insert({
      studio_id: studioId,
      raw_barcode: payload.raw_barcode ?? null,
      lot_number: payload.lot_number.trim(),
      expiry_date: payload.expiry_date || null,
      product_label: payload.product_label?.trim() || null,
      supplier_name: payload.supplier_name?.trim() || null,
      client_id: payload.client_id ?? null,
      appointment_id: payload.appointment_id ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ConsumableLotRow;
}

export async function updateConsumableLot(
  lotId: string,
  patch: Partial<
    Pick<
      ConsumableLotRow,
      | 'lot_number'
      | 'expiry_date'
      | 'product_label'
      | 'supplier_name'
      | 'client_id'
      | 'appointment_id'
      | 'raw_barcode'
    >
  >
): Promise<void> {
  const row: Record<string, string | null> = {};
  if (patch.lot_number !== undefined) row.lot_number = patch.lot_number;
  if (patch.expiry_date !== undefined) row.expiry_date = patch.expiry_date;
  if (patch.product_label !== undefined) row.product_label = patch.product_label;
  if (patch.supplier_name !== undefined) row.supplier_name = patch.supplier_name;
  if (patch.client_id !== undefined) row.client_id = patch.client_id;
  if (patch.appointment_id !== undefined) row.appointment_id = patch.appointment_id;
  if (patch.raw_barcode !== undefined) row.raw_barcode = patch.raw_barcode;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from('inkflow_consumable_lots').update(row).eq('id', lotId);
  if (error) throw error;
}

export async function deleteConsumableLot(lotId: string): Promise<void> {
  const { error } = await supabase.from('inkflow_consumable_lots').delete().eq('id', lotId);
  if (error) throw error;
}

export async function fetchAppointmentCosts(studioId: string): Promise<AppointmentCostRow[]> {
  const { data, error } = await supabase
    .from('inkflow_appointment_costs')
    .select('*')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as AppointmentCostRow[];
}

export async function insertAppointmentCost(
  studioId: string,
  payload: { appointment_id?: string | null; label: string; amount_cents: number }
): Promise<void> {
  const { error } = await supabase.from('inkflow_appointment_costs').insert({
    studio_id: studioId,
    appointment_id: payload.appointment_id ?? null,
    label: payload.label.trim() || 'Charge',
    amount_cents: Math.max(0, Math.round(payload.amount_cents)),
  });
  if (error) throw error;
}

export async function insertPriceContribution(
  studioId: string,
  payload: {
    category_slug: string;
    label_normalized: string;
    price_cents: number;
    pack_size?: number;
    supplier_label?: string | null;
  }
): Promise<void> {
  const { error } = await supabase.from('inkflow_price_contributions').insert({
    studio_id: studioId,
    category_slug: payload.category_slug.trim().toLowerCase().slice(0, 64),
    label_normalized: payload.label_normalized.trim().slice(0, 200),
    price_cents: Math.max(0, Math.round(payload.price_cents)),
    pack_size: Math.max(1, payload.pack_size ?? 1),
    supplier_label: payload.supplier_label?.trim().slice(0, 120) || null,
  });
  if (error) throw error;
}
