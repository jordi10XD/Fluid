/**
 * src/screens/admin/control/tabs/UnidadesTab.tsx
 *
 * Tab de Unidades — implementación de referencia completa.
 * Los otros 3 tabs (Rutas, Conductores, Horarios) siguen esta misma
 * estructura: cambian los tipos, los campos del formulario y la tabla.
 *
 * Secciones de este archivo:
 *   1. TYPES       — Unidad, UnidadDraft, errores de validación
 *   2. HOOK        — useUnidades()  llama al helper de supabaseList
 *   3. MODAL       — UnidadModal()  formulario Nuevo / Editar
 *   4. SCREEN      — UnidadesTab()  punto de entrada exportado
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  FlatList, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '../../../../theme/colors';
import {
  fetchList, createItem, updateItem, deleteItem,
} from '../shared/supabaseList';
import {
  SearchActionBar, ItemCard, EmptyState,
  SkeletonCard, FormField, fieldStyles,
} from '../shared/components';

// ══════════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ══════════════════════════════════════════════════════════════════════════════

type UnitStatus = 'Activo' | 'Inactivo';

interface Unidad {
  id:             string;
  placa:          string;
  numero_interno: string;
  marca:          string;
  capacidad:      number;
  estado:         UnitStatus;
}

// Draft: todo excepto el id (que genera Supabase)
type UnidadDraft = Omit<Unidad, 'id'>;

type FormErrors = Partial<Record<keyof UnidadDraft, string>>;

const ESTADO_COLOR: Record<UnitStatus, string> = {
  Activo:  Colors.success,
  Inactivo: Colors.danger,
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. HOOK — useUnidades
// Encapsula toda la lógica de datos de esta sección.
// Llama al helper genérico; nunca llama a supabase directamente.
// ══════════════════════════════════════════════════════════════════════════════

function useUnidades() {
  const [items,   setItems]   = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchList<Unidad>('units', 'numero_interno', true);
    if (result.error) setError(result.error);
    else              setItems(result.data);
    setLoading(false);
  }, []);

  // Carga inicial
  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (draft: UnidadDraft): Promise<string | null> => {
    const { error } = await createItem('units', draft);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const update = useCallback(async (id: string, draft: UnidadDraft): Promise<string | null> => {
    const { error } = await updateItem('units', id, draft);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await deleteItem('units', id);
    if (!error) setItems(prev => prev.filter(u => u.id !== id)); // optimistic update
    return error;
  }, []);

  return { items, loading, error, refresh, create, update, remove };
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. MODAL — UnidadModal
// Sirve tanto para "Nueva Unidad" como para "Editar Unidad".
// Se monta una sola vez en el tab; su visibilidad se controla con `visible`.
// ══════════════════════════════════════════════════════════════════════════════

const EMPTY_DRAFT: UnidadDraft = {
  placa:          '',
  numero_interno: '',
  marca:          '',
  capacidad:      0,
  estado:         'Activo',
};

interface UnidadModalProps {
  visible:      boolean;
  mode:         'create' | 'edit';
  initialData?: Unidad;                              // solo en mode='edit'
  onClose:      () => void;
  onSave:       (draft: UnidadDraft) => Promise<string | null>; // retorna error o null
}

function UnidadModal({ visible, mode, initialData, onClose, onSave }: UnidadModalProps) {
  const [form,   setForm]   = useState<UnidadDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Precarga los datos cuando se abre en modo editar
  useEffect(() => {
    if (!visible) return;
    setForm(
      initialData
        ? { placa: initialData.placa, numero_interno: initialData.numero_interno,
            marca: initialData.marca, capacidad: initialData.capacidad,
            estado: initialData.estado }
        : EMPTY_DRAFT,
    );
    setErrors({});
  }, [visible, initialData]);

  // Setter tipado para un solo campo
  const set = <K extends keyof UnidadDraft>(field: K, value: UnidadDraft[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // ── Validación ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: FormErrors = {};

    if (!form.placa.trim())
      e.placa = 'La placa es requerida (ej: ABC-1234)';

    if (!form.numero_interno.trim())
      e.numero_interno = 'El número interno es requerido';

    if (!form.marca.trim())
      e.marca = 'La marca / modelo es requerida';

    if (!form.capacidad || form.capacidad < 1)
      e.capacidad = 'Ingresa una capacidad válida (mínimo 1)';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const serverError = await onSave(form);
    if (serverError) {
      // Muestra el error de Supabase en el primer campo como fallback
      setErrors({ placa: serverError });
    } else {
      onClose();
    }
    setSaving(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={modal.container}>

          {/* Handle visual (pageSheet en iOS) */}
          <View style={modal.handle} />

          {/* Título */}
          <View style={modal.titleRow}>
            <Text style={modal.title}>
              {mode === 'create' ? 'Nueva Unidad' : 'Editar Unidad'}
            </Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Formulario */}
          <ScrollView
            style={modal.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Placa */}
            <FormField label="Placa" error={errors.placa}>
              <TextInput
                style={[fieldStyles.input, errors.placa && fieldStyles.inputError]}
                placeholder="ABC-1234"
                placeholderTextColor={Colors.textMuted}
                value={form.placa}
                onChangeText={t => set('placa', t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={8}
              />
            </FormField>

            {/* Número Interno */}
            <FormField label="Número Interno" error={errors.numero_interno}>
              <TextInput
                style={[fieldStyles.input, errors.numero_interno && fieldStyles.inputError]}
                placeholder="042"
                placeholderTextColor={Colors.textMuted}
                value={form.numero_interno}
                onChangeText={t => set('numero_interno', t)}
                keyboardType="numeric"
              />
            </FormField>

            {/* Marca / Modelo */}
            <FormField label="Marca / Modelo" error={errors.marca}>
              <TextInput
                style={[fieldStyles.input, errors.marca && fieldStyles.inputError]}
                placeholder="Hino Selekt"
                placeholderTextColor={Colors.textMuted}
                value={form.marca}
                onChangeText={t => set('marca', t)}
              />
            </FormField>

            {/* Capacidad */}
            <FormField label="Capacidad de Pasajeros" error={errors.capacidad}>
              <TextInput
                style={[fieldStyles.input, errors.capacidad && fieldStyles.inputError]}
                placeholder="45"
                placeholderTextColor={Colors.textMuted}
                value={form.capacidad ? String(form.capacidad) : ''}
                onChangeText={t => set('capacidad', parseInt(t, 10) || 0)}
                keyboardType="numeric"
              />
            </FormField>

            {/* Estado — toggle Activo / Inactivo */}
            <FormField label="Estado">
              <View style={modal.toggleRow}>
                {(['Activo', 'Inactivo'] as UnitStatus[]).map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[modal.toggleBtn, form.estado === opt && modal.toggleActive]}
                    onPress={() => set('estado', opt)}
                  >
                    <Text style={[modal.toggleText, form.estado === opt && modal.toggleTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormField>

            <View style={{ height: 32 }} />
          </ScrollView>

          {/* Footer: Cancelar + Guardar */}
          <View style={modal.footer}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
              <Text style={modal.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[modal.saveBtn, saving && modal.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={modal.saveText}>Guardar</Text>
              }
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Estilos del modal ─────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#FFF' },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: 10,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:   { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  closeBtn: { padding: 4 },
  scroll:  { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  // Toggle estado
  toggleRow:       { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  toggleActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleText:      { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  toggleTextActive: { color: '#FFF', fontWeight: '700' },

  // Footer
  footer: {
    flexDirection: 'row', gap: 12,
    padding: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: Radius.md,
    backgroundColor: Colors.primary, alignItems: 'center', minHeight: 50,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText:        { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. SCREEN — UnidadesTab
// Orquesta el hook, la lista y el modal.
// Es el único export de este archivo.
// ══════════════════════════════════════════════════════════════════════════════

export default function UnidadesTab() {
  const { items, loading, error, remove, create, update } = useUnidades();

  const [search,     setSearch]     = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<Unidad | undefined>();

  // Filtra localmente sin petición extra a Supabase
  const filtered = items.filter(u =>
    u.placa.toLowerCase().includes(search.toLowerCase()) ||
    u.numero_interno.includes(search),
  );

  function openCreate() {
    setEditTarget(undefined);
    setModalOpen(true);
  }

  function openEdit(item: Unidad) {
    setEditTarget(item);
    setModalOpen(true);
  }

  return (
    <View style={screen.container}>

      <SearchActionBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por placa o ID"
        onNew={openCreate}
      />

      {/* Error de red / Supabase */}
      {error && (
        <Text style={screen.errorBanner}>⚠ {error}</Text>
      )}

      {loading ? (
        // Skeletons mientras cargan los datos
        <View>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={
            filtered.length === 0 ? { flex: 1 } : { paddingBottom: 32 }
          }
          ListEmptyComponent={
            <EmptyState
              icon="bus-outline"
              message={'No hay unidades registradas.\nPresiona + Nuevo para agregar una.'}
            />
          }
          renderItem={({ item }) => (
            <ItemCard
              badge={item.placa}
              title={item.marca}
              subtitle={`Nº ${item.numero_interno}  ·  ${item.capacidad} pasajeros`}
              onEdit={() => openEdit(item)}
              onDelete={() => remove(item.id)}
            >
              {/* Indicador de estado dentro del slot de la card */}
              <View style={screen.statusRow}>
                <View style={[screen.statusDot, { backgroundColor: ESTADO_COLOR[item.estado] }]} />
                <Text style={[screen.statusText, { color: ESTADO_COLOR[item.estado] }]}>
                  {item.estado}
                </Text>
              </View>
            </ItemCard>
          )}
        />
      )}

      {/* Modal — se monta una sola vez, se muestra/oculta con `visible` */}
      <UnidadModal
        visible={modalOpen}
        mode={editTarget ? 'edit' : 'create'}
        initialData={editTarget}
        onClose={() => setModalOpen(false)}
        onSave={draft =>
          editTarget
            ? update(editTarget.id, draft)
            : create(draft)
        }
      />

    </View>
  );
}

// ── Estilos del tab ───────────────────────────────────────────────────────────
const screen = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  errorBanner: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    fontSize: 13, color: Colors.danger, textAlign: 'center',
  },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusText:  { fontSize: 12, fontWeight: '700' },
});
