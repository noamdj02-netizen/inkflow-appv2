import { supabase } from './supabase';

const SEL_SUPPLIER_CATALOG_ITEM =
  'id,studio_id,supplier_id,linked_product_id,name,brand,sku,ean,category,pack_size,list_price_cents,price_cents,promo_price_cents,promo_label,promo_starts_at,promo_ends_at,product_url,notes,is_active,created_at,updated_at';

export interface SupplierCatalogItemRow {
  id: string;
  studio_id: string;
  supplier_id: string;
  linked_product_id: string | null;
  name: string;
  brand: string | null;
  sku: string | null;
  ean: string | null;
  category: string;
  pack_size: number;
  list_price_cents: number | null;
  price_cents: number;
  promo_price_cents: number | null;
  promo_label: string | null;
  promo_starts_at: string | null;
  promo_ends_at: string | null;
  product_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchSupplierCatalogItems(
  studioId: string
): Promise<SupplierCatalogItemRow[]> {
  const { data, error } = await supabase
    .from('inkflow_supplier_catalog_items')
    .select(SEL_SUPPLIER_CATALOG_ITEM)
    .eq('studio_id', studioId)
    .order('supplier_id', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SupplierCatalogItemRow[];
}

export async function insertSupplierCatalogItem(
  studioId: string,
  payload: {
    supplier_id: string;
    linked_product_id?: string | null;
    name: string;
    brand?: string | null;
    sku?: string | null;
    ean?: string | null;
    category?: string;
    pack_size?: number;
    list_price_cents?: number | null;
    price_cents: number;
    promo_price_cents?: number | null;
    promo_label?: string | null;
    promo_starts_at?: string | null;
    promo_ends_at?: string | null;
    product_url?: string | null;
    notes?: string | null;
    is_active?: boolean;
  }
): Promise<SupplierCatalogItemRow> {
  const { data, error } = await supabase
    .from('inkflow_supplier_catalog_items')
    .insert({
      studio_id: studioId,
      supplier_id: payload.supplier_id,
      linked_product_id: payload.linked_product_id ?? null,
      name: payload.name.trim(),
      brand: payload.brand?.trim() || null,
      sku: payload.sku?.trim() || null,
      ean: payload.ean?.trim() || null,
      category: payload.category?.trim() || 'other',
      pack_size: Math.max(1, payload.pack_size ?? 1),
      list_price_cents:
        payload.list_price_cents == null ? null : Math.max(0, Math.round(payload.list_price_cents)),
      price_cents: Math.max(0, Math.round(payload.price_cents)),
      promo_price_cents:
        payload.promo_price_cents == null
          ? null
          : Math.max(0, Math.round(payload.promo_price_cents)),
      promo_label: payload.promo_label?.trim() || null,
      promo_starts_at: payload.promo_starts_at?.trim() || null,
      promo_ends_at: payload.promo_ends_at?.trim() || null,
      product_url: payload.product_url?.trim() || null,
      notes: payload.notes?.trim() || null,
      is_active: payload.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select(SEL_SUPPLIER_CATALOG_ITEM)
    .single();
  if (error) throw error;
  return data as SupplierCatalogItemRow;
}

export async function updateSupplierCatalogItem(
  studioId: string,
  id: string,
  payload: Partial<{
    supplier_id: string;
    linked_product_id: string | null;
    name: string;
    brand: string | null;
    sku: string | null;
    ean: string | null;
    category: string;
    pack_size: number;
    list_price_cents: number | null;
    price_cents: number;
    promo_price_cents: number | null;
    promo_label: string | null;
    promo_starts_at: string | null;
    promo_ends_at: string | null;
    product_url: string | null;
    notes: string | null;
    is_active: boolean;
  }>
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.supplier_id !== undefined) patch.supplier_id = payload.supplier_id;
  if (payload.linked_product_id !== undefined) patch.linked_product_id = payload.linked_product_id;
  if (payload.name !== undefined) patch.name = payload.name.trim();
  if (payload.brand !== undefined) patch.brand = payload.brand?.trim() || null;
  if (payload.sku !== undefined) patch.sku = payload.sku?.trim() || null;
  if (payload.ean !== undefined) patch.ean = payload.ean?.trim() || null;
  if (payload.category !== undefined) patch.category = payload.category.trim();
  if (payload.pack_size !== undefined) patch.pack_size = Math.max(1, payload.pack_size);
  if (payload.list_price_cents !== undefined) {
    patch.list_price_cents =
      payload.list_price_cents == null ? null : Math.max(0, Math.round(payload.list_price_cents));
  }
  if (payload.price_cents !== undefined)
    patch.price_cents = Math.max(0, Math.round(payload.price_cents));
  if (payload.promo_price_cents !== undefined) {
    patch.promo_price_cents =
      payload.promo_price_cents == null ? null : Math.max(0, Math.round(payload.promo_price_cents));
  }
  if (payload.promo_label !== undefined) patch.promo_label = payload.promo_label?.trim() || null;
  if (payload.promo_starts_at !== undefined)
    patch.promo_starts_at = payload.promo_starts_at?.trim() || null;
  if (payload.promo_ends_at !== undefined)
    patch.promo_ends_at = payload.promo_ends_at?.trim() || null;
  if (payload.product_url !== undefined) patch.product_url = payload.product_url?.trim() || null;
  if (payload.notes !== undefined) patch.notes = payload.notes?.trim() || null;
  if (payload.is_active !== undefined) patch.is_active = payload.is_active;

  const { error } = await supabase
    .from('inkflow_supplier_catalog_items')
    .update(patch)
    .eq('id', id)
    .eq('studio_id', studioId);
  if (error) throw error;
}

export async function deleteSupplierCatalogItem(studioId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('inkflow_supplier_catalog_items')
    .delete()
    .eq('id', id)
    .eq('studio_id', studioId);
  if (error) throw error;
}
