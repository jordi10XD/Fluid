/**
 * src/screens/admin/control/shared/supabaseList.ts
 *
 * Helper genérico para operaciones CRUD en Supabase.
 * Los hooks de cada Tab lo llaman — nunca llaman a supabase directamente.
 *
 * Ventaja: si mañana cambia el manejo de errores, tokens o la versión
 * del cliente, lo arreglas aquí y se propaga a los 4 tabs.
 */

import { supabase } from '../../../../lib/supabase';

// ─── Tipos base ───────────────────────────────────────────────────────────────

/** Todo registro de Supabase tiene al menos un id string. */
export interface BaseRecord {
  id: string;
}

/** Resultado estándar de cualquier operación. */
export interface ListResult<T> {
  data: T[];
  error: string | null;
}

export interface MutationResult {
  error: string | null;
}

// ─── Operaciones ──────────────────────────────────────────────────────────────

/**
 * Trae todos los registros de una tabla ordenados por un campo.
 *
 * @example
 * const { data, error } = await fetchList<Unidad>('units', 'numero_interno');
 */
export async function fetchList<T extends BaseRecord>(
  table: string,
  orderBy: string = 'created_at',
  ascending: boolean = false,
): Promise<ListResult<T>> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order(orderBy, { ascending });

  return {
    data:  (data ?? []) as T[],
    error: error?.message ?? null,
  };
}

/**
 * Inserta un registro nuevo. Nunca pases `id` en el draft
 * (Supabase lo genera con uuid).
 *
 * @example
 * const { error } = await createItem('units', { placa: 'ABC-1234', ... });
 */
export async function createItem<T extends object>(
  table: string,
  draft: T,
): Promise<MutationResult> {
  const { error } = await supabase.from(table).insert([draft]);
  return { error: error?.message ?? null };
}

/**
 * Actualiza un registro existente por su id.
 *
 * @example
 * const { error } = await updateItem('units', '123-abc', { placa: 'XYZ-9999' });
 */
export async function updateItem<T extends object>(
  table: string,
  id: string,
  draft: T,
): Promise<MutationResult> {
  const { error } = await supabase.from(table).update(draft).eq('id', id);
  return { error: error?.message ?? null };
}

/**
 * Elimina un registro por su id.
 *
 * @example
 * const { error } = await deleteItem('units', '123-abc');
 */
export async function deleteItem(
  table: string,
  id: string,
): Promise<MutationResult> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  return { error: error?.message ?? null };
}
