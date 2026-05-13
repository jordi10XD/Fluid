/**
 * src/screens/admin/control/tabs/ConductoresTab.tsx
 *
 * Secciones:
 *   1. TYPES
 *   2. HOOK   — useConductores()
 *   3. MODAL  — ConductorModal()
 *   4. SCREEN — ConductoresTab()
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  FlatList, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, Radius } from '../../../../theme/colors';
import { fetchList, createItem, updateItem, deleteItem } from '../shared/supabaseList';
import {
  SearchActionBar, ItemCard, EmptyState,
  SkeletonCard, FormField, fieldStyles,
} from '../shared/components';

// ══════════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ══════════════════════════════════════════════════════════════════════════════

type TipoLicencia = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

interface Conductor {
  id:             string;
  nombre:         string;
  cedula:         string;
  email:          string;
  telefono:       string;
  licencia_num:   string;
  licencia_tipo:  TipoLicencia;
}

type ConductorDraft = Omit<Conductor, 'id'>;
type FormErrors = Partial<Record<keyof ConductorDraft, string>>;

const EMPTY_DRAFT: ConductorDraft = {
  nombre:        '',
  cedula:        '',
  email:         '',
  telefono:      '',
  licencia_num:  '',
  licencia_tipo: 'D',
};

const TIPOS_LICENCIA: TipoLicencia[] = ['A', 'B', 'C', 'D', 'E', 'F'];

// ══════════════════════════════════════════════════════════════════════════════
// 2. HOOK — useConductores
// ══════════════════════════════════════════════════════════════════════════════

function useConductores() {
  const [items,   setItems]   = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchList<Conductor>('driver_profiles', 'nombre', true);
    if (result.error) setError(result.error);
    else              setItems(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (draft: ConductorDraft): Promise<string | null> => {
    const { error } = await createItem('driver_profiles', draft);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const update = useCallback(async (id: string, draft: ConductorDraft): Promise<string | null> => {
    const { error } = await updateItem('driver_profiles', id, draft);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await deleteItem('driver_profiles', id);
    if (!error) setItems(prev => prev.filter(c => c.id !== id));
    return error;
  }, []);

  return { items, loading, error, refresh, create, update, remove };
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. MODAL — ConductorModal
// ══════════════════════════════════════════════════════════════════════════════

interface ConductorModalProps {
  visible:      boolean;
  mode:         'create' | 'edit';
  initialData?: Conductor;
  onClose:      () => void;
  onSave:       (draft: ConductorDraft) => Promise<string | null>;
}

function ConductorModal({ visible, mode, initialData, onClose, onSave }: ConductorModalProps) {
  const [form,   setForm]   = useState<ConductorDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm(
      initialData
        ? {
            nombre:       initialData.nombre || '',
            cedula:       initialData.cedula || '',
            email:        initialData.email || '',
            telefono:     initialData.telefono || '',
            licencia_num: initialData.licencia_num || '',
            licencia_tipo: initialData.licencia_tipo || 'D',
          }
        : EMPTY_DRAFT,
    );
    setErrors({});
  }, [visible, initialData]);

  const set = <K extends keyof ConductorDraft>(field: K, value: ConductorDraft[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // ── Validación ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: FormErrors = {};

    if (!form.nombre.trim())
      e.nombre = 'El nombre completo es requerido';

    if (!form.cedula.trim())
      e.cedula = 'La cédula / DNI es requerida';
    else if (!/^\d{8,13}$/.test(form.cedula.replace(/\s/g, '')))
      e.cedula = 'Ingresa una cédula válida (8-13 dígitos)';

    if (!form.email.trim())
      e.email = 'El correo electrónico es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Ingresa un correo válido';

    if (!form.telefono.trim())
      e.telefono = 'El teléfono es requerido';

    if (!form.licencia_num.trim())
      e.licencia_num = 'El número de licencia es requerido';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const serverError = await onSave(form);
    if (serverError) setErrors({ nombre: serverError });
    else             onClose();
    setSaving(false);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={modal.container}>

          <View style={modal.handle} />

          <View style={modal.titleRow}>
            <Text style={modal.title}>{mode === 'create' ? 'Nuevo Conductor' : 'Editar Conductor'}</Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modal.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Nombre */}
            <FormField label="Nombre Completo" error={errors.nombre}>
              <TextInput
                style={[fieldStyles.input, errors.nombre && fieldStyles.inputError]}
                placeholder="Tim Capi"
                placeholderTextColor={Colors.textMuted}
                value={form.nombre}
                onChangeText={t => set('nombre', t)}
                autoCapitalize="words"
              />
            </FormField>

            {/* Cédula */}
            <FormField label="Cédula / DNI" error={errors.cedula}>
              <TextInput
                style={[fieldStyles.input, errors.cedula && fieldStyles.inputError]}
                placeholder="1234521232"
                placeholderTextColor={Colors.textMuted}
                value={form.cedula}
                onChangeText={t => set('cedula', t)}
                keyboardType="numeric"
                maxLength={13}
              />
            </FormField>

            {/* Email */}
            <FormField label="Correo Electrónico" error={errors.email}>
              <TextInput
                style={[fieldStyles.input, errors.email && fieldStyles.inputError]}
                placeholder="timcapi@gmail.com"
                placeholderTextColor={Colors.textMuted}
                value={form.email}
                onChangeText={t => set('email', t.toLowerCase())}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </FormField>

            {/* Teléfono */}
            <FormField label="Teléfono" error={errors.telefono}>
              <TextInput
                style={[fieldStyles.input, errors.telefono && fieldStyles.inputError]}
                placeholder="+593 99 999 9999"
                placeholderTextColor={Colors.textMuted}
                value={form.telefono}
                onChangeText={t => set('telefono', t)}
                keyboardType="phone-pad"
              />
            </FormField>

            {/* Licencia — Número */}
            <FormField label="Número de Licencia" error={errors.licencia_num}>
              <TextInput
                style={[fieldStyles.input, errors.licencia_num && fieldStyles.inputError]}
                placeholder="LIC-00123456"
                placeholderTextColor={Colors.textMuted}
                value={form.licencia_num}
                onChangeText={t => set('licencia_num', t.toUpperCase())}
                autoCapitalize="characters"
              />
            </FormField>

            {/* Licencia — Tipo (selector de chips) */}
            <FormField label="Tipo de Licencia">
              <View style={modal.tipoRow}>
                {TIPOS_LICENCIA.map(tipo => (
                  <TouchableOpacity
                    key={tipo}
                    style={[modal.tipoBtn, form.licencia_tipo === tipo && modal.tipoBtnActive]}
                    onPress={() => set('licencia_tipo', tipo)}
                  >
                    <Text style={[modal.tipoText, form.licencia_tipo === tipo && modal.tipoTextActive]}>
                      {tipo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormField>

            <View style={{ height: 32 }} />
          </ScrollView>

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

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  handle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 10 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:     { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  closeBtn:  { padding: 4 },
  scroll:    { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  tipoRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipoBtn:         { paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  tipoBtnActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tipoText:        { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  tipoTextActive:  { color: '#FFF' },

  footer:          { flexDirection: 'row', gap: 12, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  cancelBtn:       { flex: 1, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelText:      { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn:         { flex: 2, paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', minHeight: 50 },
  saveBtnDisabled: { opacity: 0.6 },
  saveText:        { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. SCREEN — ConductoresTab
// ══════════════════════════════════════════════════════════════════════════════

export default function ConductoresTab() {
  const { items, loading, error, remove, create, update } = useConductores();

  const [search,     setSearch]     = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<Conductor | undefined>();

  const filtered = items.filter(c =>
    (c.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.cedula || '').includes(search),
  );

  function openCreate() { setEditTarget(undefined); setModalOpen(true); }
  function openEdit(item: Conductor) { setEditTarget(item); setModalOpen(true); }

  return (
    <View style={screen.container}>

      <SearchActionBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por nombre o cédula"
        onNew={openCreate}
      />

      {error && <Text style={screen.errorBanner}>⚠ {error}</Text>}

      {loading ? (
        <View><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 32 }}
          ListEmptyComponent={
            <EmptyState icon="person-outline" message={'No hay conductores registrados.\nPresiona + Nuevo para agregar uno.'} />
          }
          renderItem={({ item }) => (
            <ItemCard
              title={item.nombre}
              onEdit={() => openEdit(item)}
              onDelete={() => remove(item.id)}
            >
              <View style={screen.infoGrid}>
                <InfoRow icon="card-outline"  label="Cédula"   value={item.cedula} />
                <InfoRow icon="mail-outline"  label="Correo"   value={item.email} />
                <InfoRow icon="call-outline"  label="Teléfono" value={item.telefono} />
                <InfoRow
                  icon="ribbon-outline"
                  label="Licencia"
                  value={`${item.licencia_num}  ·  Tipo ${item.licencia_tipo}`}
                />
              </View>
            </ItemCard>
          )}
        />
      )}

      <ConductorModal
        visible={modalOpen}
        mode={editTarget ? 'edit' : 'create'}
        initialData={editTarget}
        onClose={() => setModalOpen(false)}
        onSave={draft => editTarget ? update(editTarget.id, draft) : create(draft)}
      />
    </View>
  );
}

// ── Sub-componente local para las filas de info del conductor ─────────────────
function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={screen.infoRow}>
      <Ionicons name={icon} size={13} color={Colors.textMuted} />
      <Text style={screen.infoLabel}>{label}</Text>
      <Text style={screen.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const screen = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  errorBanner: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, fontSize: 13, color: Colors.danger, textAlign: 'center' },

  infoGrid:   { gap: 6 },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel:  { fontSize: 11, color: Colors.textMuted, width: 58 },
  infoValue:  { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
});
