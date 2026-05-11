/**
 * src/screens/admin/control/tabs/HorariosTab.tsx
 *
 * Secciones:
 *   1. TYPES
 *   2. HOOK   — useHorarios()
 *   3. MODAL  — HorarioModal()
 *   4. SCREEN — HorariosTab()
 *
 * Nota sobre el Time Picker:
 *   Se usa un selector manual HH/MM con ScrollView para evitar
 *   dependencias nativas adicionales. Si prefieres @react-native-community/datetimepicker,
 *   reemplaza solo la sección "Hora de Salida" del modal.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

type Frecuencia = 'Diario' | 'Lunes-Viernes' | 'Lunes-Sábado' | 'Fines de Semana' | 'Personalizado';

interface Horario {
  id:          string;
  ruta_id:     string;
  ruta_nombre: string;  // desnormalizado para mostrarlo sin join
  hora_salida: string;  // formato "HH:MM"
  frecuencia:  Frecuencia;
  estado:      'Activo' | 'Inactivo';
}

// Ruta simplificada para el selector del modal
interface RutaOption {
  id:     string;
  codigo: string;
  nombre: string;
}

type HorarioDraft = Omit<Horario, 'id'>;
type FormErrors   = Partial<Record<keyof HorarioDraft, string>>;

const FRECUENCIAS: Frecuencia[] = [
  'Diario', 'Lunes-Viernes', 'Lunes-Sábado', 'Fines de Semana', 'Personalizado',
];

const EMPTY_DRAFT: HorarioDraft = {
  ruta_id:     '',
  ruta_nombre: '',
  hora_salida: '08:00',
  frecuencia:  'Diario',
  estado:      'Activo',
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. HOOK — useHorarios
// ══════════════════════════════════════════════════════════════════════════════

function useHorarios() {
  const [items,   setItems]   = useState<Horario[]>([]);
  const [rutas,   setRutas]   = useState<RutaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Carga horarios y rutas en paralelo
    const [horariosRes, rutasRes] = await Promise.all([
      fetchList<Horario>('schedules', 'hora_salida', true),
      fetchList<RutaOption>('routes',  'codigo',     true),
    ]);

    if (horariosRes.error) setError(horariosRes.error);
    else                   setItems(horariosRes.data);

    if (!rutasRes.error) setRutas(rutasRes.data);

    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (draft: HorarioDraft): Promise<string | null> => {
    const { error } = await createItem('schedules', draft);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const update = useCallback(async (id: string, draft: HorarioDraft): Promise<string | null> => {
    const { error } = await updateItem('schedules', id, draft);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await deleteItem('schedules', id);
    if (!error) setItems(prev => prev.filter(h => h.id !== id));
    return error;
  }, []);

  return { items, rutas, loading, error, refresh, create, update, remove };
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. MODAL — HorarioModal
// ══════════════════════════════════════════════════════════════════════════════

interface HorarioModalProps {
  visible:      boolean;
  mode:         'create' | 'edit';
  initialData?: Horario;
  rutas:        RutaOption[];
  onClose:      () => void;
  onSave:       (draft: HorarioDraft) => Promise<string | null>;
}

function HorarioModal({ visible, mode, initialData, rutas, onClose, onSave }: HorarioModalProps) {
  const [form,   setForm]   = useState<HorarioDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Time picker state
  const [hora, setHora] = useState('08');
  const [min,  setMin]  = useState('00');

  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      const [h, m] = initialData.hora_salida.split(':');
      setHora(h ?? '08');
      setMin(m  ?? '00');
      setForm({
        ruta_id:     initialData.ruta_id,
        ruta_nombre: initialData.ruta_nombre,
        hora_salida: initialData.hora_salida,
        frecuencia:  initialData.frecuencia,
        estado:      initialData.estado,
      });
    } else {
      setHora('08'); setMin('00');
      setForm(EMPTY_DRAFT);
    }
    setErrors({});
  }, [visible, initialData]);

  const set = <K extends keyof HorarioDraft>(field: K, value: HorarioDraft[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Sincroniza hora_salida al cambiar los pickers
  function updateHora(h: string, m: string) {
    const hh = h.padStart(2, '0');
    const mm = m.padStart(2, '0');
    setHora(hh); setMin(mm);
    set('hora_salida', `${hh}:${mm}`);
  }

  // Selecciona ruta y auto-completa ruta_nombre
  function selectRuta(ruta: RutaOption) {
    setForm(prev => ({ ...prev, ruta_id: ruta.id, ruta_nombre: `${ruta.codigo} · ${ruta.nombre}` }));
  }

  // ── Validación ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.ruta_id)     e.ruta_id     = 'Selecciona una ruta';
    if (!form.hora_salida) e.hora_salida = 'La hora de salida es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const serverError = await onSave(form);
    if (serverError) setErrors({ ruta_id: serverError });
    else             onClose();
    setSaving(false);
  }

  // Genera array de horas y minutos para el picker
  const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINS  = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={modal.container}>

          <View style={modal.handle} />

          <View style={modal.titleRow}>
            <Text style={modal.title}>{mode === 'create' ? 'Nuevo Horario' : 'Editar Horario'}</Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modal.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Selector de Ruta */}
            <FormField label="Ruta" error={errors.ruta_id}>
              {rutas.length === 0 ? (
                <Text style={modal.noRutas}>No hay rutas disponibles. Crea una en la pestaña Rutas.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modal.rutaScroll}>
                  {rutas.map(r => (
                    <TouchableOpacity
                      key={r.id}
                      style={[modal.rutaChip, form.ruta_id === r.id && modal.rutaChipActive]}
                      onPress={() => selectRuta(r)}
                    >
                      <Text style={[modal.rutaChipCode, form.ruta_id === r.id && modal.rutaChipTextActive]}>
                        {r.codigo}
                      </Text>
                      <Text style={[modal.rutaChipName, form.ruta_id === r.id && modal.rutaChipTextActive]} numberOfLines={1}>
                        {r.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </FormField>

            {/* Time Picker — Hora de Salida */}
            <FormField label="Hora de Salida" error={errors.hora_salida}>
              <View style={modal.timePicker}>
                {/* Hora */}
                <View style={modal.timeCol}>
                  <Text style={modal.timeColLabel}>HORA</Text>
                  <ScrollView style={modal.timeScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {HORAS.map(h => (
                      <TouchableOpacity
                        key={h}
                        style={[modal.timeItem, hora === h && modal.timeItemActive]}
                        onPress={() => updateHora(h, min)}
                      >
                        <Text style={[modal.timeItemText, hora === h && modal.timeItemTextActive]}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={modal.timeSep}>:</Text>

                {/* Minutos */}
                <View style={modal.timeCol}>
                  <Text style={modal.timeColLabel}>MIN</Text>
                  <ScrollView style={modal.timeScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {MINS.map(m => (
                      <TouchableOpacity
                        key={m}
                        style={[modal.timeItem, min === m && modal.timeItemActive]}
                        onPress={() => updateHora(hora, m)}
                      >
                        <Text style={[modal.timeItemText, min === m && modal.timeItemTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Preview */}
                <View style={modal.timePreview}>
                  <Text style={modal.timePreviewText}>{hora}:{min}</Text>
                </View>
              </View>
            </FormField>

            {/* Frecuencia */}
            <FormField label="Frecuencia">
              <View style={modal.frecuenciaGrid}>
                {FRECUENCIAS.map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[modal.frecBtn, form.frecuencia === f && modal.frecBtnActive]}
                    onPress={() => set('frecuencia', f)}
                  >
                    <Text style={[modal.frecText, form.frecuencia === f && modal.frecTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormField>

            {/* Estado */}
            <FormField label="Estado">
              <View style={modal.toggleRow}>
                {(['Activo', 'Inactivo'] as const).map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[modal.toggleBtn, form.estado === opt && modal.toggleActive]}
                    onPress={() => set('estado', opt)}
                  >
                    <Text style={[modal.toggleText, form.estado === opt && modal.toggleTextActive]}>{opt}</Text>
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

  // Selector de ruta
  noRutas:          { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },
  rutaScroll:       { marginBottom: 4 },
  rutaChip:         { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 10, marginRight: 8, minWidth: 120 },
  rutaChipActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rutaChipCode:     { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.5 },
  rutaChipName:     { fontSize: 12, color: Colors.textSecondary, marginTop: 2, maxWidth: 140 },
  rutaChipTextActive: { color: '#FFF' },

  // Time picker
  timePicker:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeCol:          { flex: 1, alignItems: 'center' },
  timeColLabel:     { fontSize: 9, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  timeScroll:       { height: 140, width: '100%' },
  timeItem:         { paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  timeItemActive:   { backgroundColor: Colors.primary + '20' },
  timeItemText:     { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
  timeItemTextActive: { color: Colors.primary, fontWeight: '800' },
  timeSep:          { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginTop: 20 },
  timePreview:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 12 },
  timePreviewText:  { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 1 },

  // Frecuencia
  frecuenciaGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frecBtn:         { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  frecBtnActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  frecText:        { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  frecTextActive:  { color: '#FFF', fontWeight: '700' },

  // Toggle estado
  toggleRow:        { flexDirection: 'row', gap: 10 },
  toggleBtn:        { flex: 1, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  toggleActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleText:       { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  toggleTextActive: { color: '#FFF', fontWeight: '700' },

  footer:           { flexDirection: 'row', gap: 12, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  cancelBtn:        { flex: 1, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelText:       { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn:          { flex: 2, paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', minHeight: 50 },
  saveBtnDisabled:  { opacity: 0.6 },
  saveText:         { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. SCREEN — HorariosTab
// ══════════════════════════════════════════════════════════════════════════════

const ESTADO_COLOR = { Activo: Colors.success, Inactivo: Colors.danger };
const FREC_ICON: Record<Frecuencia, any> = {
  'Diario':           'repeat-outline',
  'Lunes-Viernes':    'briefcase-outline',
  'Lunes-Sábado':     'calendar-outline',
  'Fines de Semana':  'sunny-outline',
  'Personalizado':    'options-outline',
};

export default function HorariosTab() {
  const { items, rutas, loading, error, remove, create, update } = useHorarios();

  const [search,     setSearch]     = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<Horario | undefined>();

  const filtered = items.filter(h =>
    h.ruta_nombre.toLowerCase().includes(search.toLowerCase()) ||
    h.hora_salida.includes(search),
  );

  function openCreate() { setEditTarget(undefined); setModalOpen(true); }
  function openEdit(item: Horario) { setEditTarget(item); setModalOpen(true); }

  return (
    <View style={screen.container}>

      <SearchActionBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por ruta u hora"
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
            <EmptyState icon="time-outline" message={'No hay horarios registrados.\nPresiona + Nuevo para agregar uno.'} />
          }
          renderItem={({ item }) => (
            <ItemCard
              badge={item.hora_salida}
              title={item.ruta_nombre}
              onEdit={() => openEdit(item)}
              onDelete={() => remove(item.id)}
            >
              <View style={screen.cardBody}>
                {/* Frecuencia */}
                <View style={screen.infoRow}>
                  <Ionicons name={FREC_ICON[item.frecuencia]} size={13} color={Colors.textMuted} />
                  <Text style={screen.infoLabel}>Frecuencia</Text>
                  <Text style={screen.infoValue}>{item.frecuencia}</Text>
                </View>

                {/* Estado */}
                <View style={screen.infoRow}>
                  <View style={[screen.statusDot, { backgroundColor: ESTADO_COLOR[item.estado] }]} />
                  <Text style={screen.infoLabel}>Estado</Text>
                  <Text style={[screen.infoValue, { color: ESTADO_COLOR[item.estado], fontWeight: '700' }]}>
                    {item.estado}
                  </Text>
                </View>
              </View>
            </ItemCard>
          )}
        />
      )}

      <HorarioModal
        visible={modalOpen}
        mode={editTarget ? 'edit' : 'create'}
        initialData={editTarget}
        rutas={rutas}
        onClose={() => setModalOpen(false)}
        onSave={draft => editTarget ? update(editTarget.id, draft) : create(draft)}
      />
    </View>
  );
}

const screen = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  errorBanner: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, fontSize: 13, color: Colors.danger, textAlign: 'center' },

  cardBody:   { gap: 6 },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel:  { fontSize: 11, color: Colors.textMuted, width: 70 },
  infoValue:  { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
});
