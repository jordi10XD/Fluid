/**
 * src/screens/admin/ViajesScreen.tsx
 *
 * Panel de Viajes — pantalla completa.
 *
 * Secciones:
 *   1. TYPES       — Viaje, ViajeDraft, opciones de catálogos, estados
 *   2. HOOKS       — useViajes()  +  useCatalogos()
 *   3. COMPONENTS  — EstadoBadge, AccordionSection
 *   4. MODAL       — ViajeModal  (formulario con secciones desplegables)
 *   5. SCREEN      — ViajesScreen  (punto de entrada exportado)
 *
 * Nueva tabla Supabase requerida: `trips`
 *   id                 uuid  PK default gen_random_uuid()
 *   unidad_id          text  NOT NULL
 *   unidad_placa       text  NOT NULL
 *   unidad_numero      text  NOT NULL
 *   ruta_id            text  NOT NULL
 *   ruta_nombre        text  NOT NULL
 *   ruta_codigo        text  NOT NULL
 *   conductor_id       text  NOT NULL
 *   conductor_nombre   text  NOT NULL
 *   horario_id         text  NOT NULL
 *   hora_salida        text  NOT NULL   -- formato "HH:MM"
 *   estado             text  NOT NULL   -- Programado | Operativo | Retrasado | Cancelado
 *   razon_cancelacion  text  DEFAULT ''
 *   fecha              text  NOT NULL   -- formato "YYYY-MM-DD"
 *   created_at         timestamptz DEFAULT now()
 */

import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, Radius } from '../../theme/colors';
import {
  fetchList, createItem, updateItem, deleteItem,
} from './control/shared/supabaseList';
import {
  SearchActionBar, ItemCard, EmptyState,
  SkeletonCard, FormField, fieldStyles,
} from './control/shared/components';

// ══════════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type ViajeEstado = 'Programado' | 'En Espera' | 'En Ruta' | 'Completado' | 'Cancelado' | 'Retrasado';

interface Viaje {
  id:                string;
  unidad_id:         string;
  unidad_placa:      string;
  unidad_numero:     string;
  ruta_id:           string;
  ruta_nombre:       string;
  ruta_codigo:       string;
  conductor_id:      string;
  conductor_nombre:  string;
  horario_id:        string;
  hora_salida:       string;   // "HH:MM"
  estado:            ViajeEstado;
  razon_cancelacion: string;
  fecha:             string;   // "YYYY-MM-DD"
}

type ViajeDraft = Omit<Viaje, 'id'>;

// ── Tipos simplificados para los selectores del formulario ───────────────────

interface UnidadOption {
  id:             string;
  placa:          string;
  numero_interno: string;
  marca:          string;
  capacidad:      number;
  estado:         string;
}

interface RutaOption {
  id:      string;
  codigo:  string;
  nombre:  string;
  origen:  string;
  destino: string;
}

interface ConductorOption {
  id:     string;
  nombre: string;
  cedula: string;
}

interface HorarioOption {
  id:          string;
  ruta_id:     string;
  ruta_nombre: string;
  hora_salida: string;
  frecuencia:  string;
  estado:      string;
}

// ── Configuración visual de estados ─────────────────────────────────────────

const ESTADO_CONFIG: Record<ViajeEstado, {
  color: string; bg: string; icon: string;
}> = {
  Programado: { color: Colors.primary,  bg: Colors.primary + '18', icon: 'time-outline'             },
  'En Espera': { color: Colors.accent,  bg: Colors.accent + '18', icon: 'checkmark-circle-outline' },
  'En Ruta':    { color: Colors.success, bg: Colors.success + '18', icon: 'bus-outline'              },
  Completado:   { color: '#6B7280',      bg: '#6B728018',            icon: 'flag-outline'            },
  Retrasado:    { color: '#F59E0B',      bg: '#F59E0B18',            icon: 'warning-outline'         },
  Cancelado:    { color: Colors.danger,  bg: Colors.danger  + '18', icon: 'close-circle-outline'     },
};

const ESTADOS = Object.keys(ESTADO_CONFIG) as ViajeEstado[];

// ── Draft vacío ──────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

const EMPTY_DRAFT: ViajeDraft = {
  unidad_id: '', unidad_placa: '', unidad_numero: '',
  ruta_id:   '', ruta_nombre:  '', ruta_codigo:   '',
  conductor_id: '', conductor_nombre: '',
  horario_id: '', hora_salida: '',
  estado: 'Programado',
  razon_cancelacion: '',
  fecha: todayStr(),
};

// ── Nombre de las secciones del formulario ───────────────────────────────────
type SectionKey = 'ruta' | 'unidad' | 'conductor' | 'horario';

// ══════════════════════════════════════════════════════════════════════════════
// 2. HOOKS
// ══════════════════════════════════════════════════════════════════════════════

// ── useViajes ─────────────────────────────────────────────────────────────────
// Maneja el CRUD de la tabla `trips`.
// Incluye un timer que transiciona automáticamente Programado → En Espera
// cuando llega la hora de salida del día de hoy.
function useViajes() {
  const [items,   setItems]   = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Ref para que el timer siempre tenga acceso al estado actual sin re-subscribeirse
  const itemsRef = useRef<Viaje[]>([]);
  itemsRef.current = items;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchList<Viaje>('trips', 'hora_salida', true);
    if (result.error) setError(result.error);
    else              setItems(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Timer: cada 60 s verifica si algún viaje Programado ya debería salir ──
  useEffect(() => {
    const tick = async () => {
      const now   = new Date();
      const hhmm  = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = todayStr();

      // Filtra los que deben pasar a En Espera
      const due = itemsRef.current.filter(v =>
        v.estado === 'Programado' &&
        v.fecha  === today        &&
        v.hora_salida <= hhmm,
      );

      if (due.length === 0) return;

      // Actualiza en Supabase (background) y en estado local
      await Promise.all(due.map(v => {
        const { id, ...draft } = v;
        return updateItem('trips', id, { ...draft, estado: 'En Espera' });
      }));

      const dueIds = new Set(due.map(v => v.id));
      setItems(prev =>
        prev.map(v => dueIds.has(v.id) ? { ...v, estado: 'En Espera' as ViajeEstado } : v),
      );
    };

    // Ejecuta al montar y cada minuto
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const create = useCallback(async (draft: ViajeDraft): Promise<string | null> => {
    const { error } = await createItem('trips', draft);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const update = useCallback(async (id: string, draft: ViajeDraft): Promise<string | null> => {
    const { error } = await updateItem('trips', id, draft);
    if (!error) await refresh();
    return error;
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await deleteItem('trips', id);
    if (!error) setItems(prev => prev.filter(v => v.id !== id));
    return error;
  }, []);

  return { items, loading, error, refresh, create, update, remove };
}

// ── useCatalogos ──────────────────────────────────────────────────────────────
// Carga todos los catálogos de Control en paralelo.
// Solo expone unidades y horarios con estado Activo.
function useCatalogos() {
  const [unidades,    setUnidades]    = useState<UnidadOption[]>([]);
  const [rutas,       setRutas]       = useState<RutaOption[]>([]);
  const [conductores, setConductores] = useState<ConductorOption[]>([]);
  const [horarios,    setHorarios]    = useState<HorarioOption[]>([]);
  const [loading,     setLoading]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [u, r, c, h] = await Promise.all([
      fetchList<UnidadOption>  ('units',           'numero_interno', true),
      fetchList<RutaOption>    ('routes',           'codigo',         true),
      fetchList<ConductorOption>('driver_profiles', 'nombre',         true),
      fetchList<HorarioOption> ('schedules',        'hora_salida',    true),
    ]);
    if (!u.error) setUnidades   (u.data.filter(x => x.estado === 'Activo'));
    if (!r.error) setRutas      (r.data);
    if (!c.error) setConductores(c.data);
    if (!h.error) setHorarios   (h.data.filter(x => x.estado === 'Activo'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { unidades, rutas, conductores, horarios, loading, reload: load };
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── EstadoBadge ───────────────────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: ViajeEstado }) {
  const cfg = ESTADO_CONFIG[estado];
  return (
    <View style={[badge.container, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={[badge.text, { color: cfg.color }]}>
        {estado.toUpperCase()}
      </Text>
    </View>
  );
}

const badge = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
});

// ── AccordionSection ─────────────────────────────────────────────────────────
// Sección colapsable genérica que muestra un header con ícono y la selección
// actual, y un body con los ítems seleccionables cuando está abierta.
interface AccordionSectionProps {
  icon:          string;
  title:         string;
  selectedLabel: string | null;
  selectedSub?:  string;
  isOpen:        boolean;
  hasError?:     boolean;
  onToggle:      () => void;
  children:      React.ReactNode;
}

function AccordionSection({
  icon, title, selectedLabel, selectedSub,
  isOpen, hasError, onToggle, children,
}: AccordionSectionProps) {
  return (
    <View style={[acc.wrapper, isOpen && acc.wrapperOpen, hasError && acc.wrapperError]}>

      {/* Header */}
      <TouchableOpacity
        style={[acc.header, isOpen && acc.headerOpen]}
        onPress={onToggle}
        activeOpacity={0.75}
      >
        <View style={[acc.iconBox, isOpen && acc.iconBoxActive]}>
          <Ionicons name={icon as any} size={17} color={isOpen ? '#FFF' : Colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={acc.sectionLabel}>{title.toUpperCase()}</Text>
          {selectedLabel
            ? <>
                <Text style={acc.selectedText} numberOfLines={1}>{selectedLabel}</Text>
                {selectedSub && <Text style={acc.selectedSub}>{selectedSub}</Text>}
              </>
            : <Text style={[acc.placeholder, hasError && acc.placeholderError]}>
                Seleccionar...
              </Text>
          }
        </View>

        <Ionicons
          name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={18}
          color={Colors.textMuted}
        />
      </TouchableOpacity>

      {/* Body — solo visible cuando está abierto */}
      {isOpen && (
        <View style={acc.body}>{children}</View>
      )}
    </View>
  );
}

const acc = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  wrapperOpen:  { borderColor: Colors.primary + '60' },
  wrapperError: { borderColor: Colors.danger },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md,
  },
  headerOpen: {
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },

  iconBox: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: Colors.primary },

  sectionLabel:   { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.6 },
  selectedText:   { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  selectedSub:    { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  placeholder:    { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  placeholderError: { color: Colors.danger },

  body: { padding: Spacing.md, backgroundColor: Colors.background },
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. MODAL — ViajeModal
// Formulario en pageSheet con 4 secciones accordion para elegir
// Ruta → Unidad → Conductor → Horario.
// En modo 'edit' también muestra el selector de estado.
// ══════════════════════════════════════════════════════════════════════════════

interface ViajeModalProps {
  visible:     boolean;
  mode:        'create' | 'edit';
  initialData?: Viaje;
  catalogos:   ReturnType<typeof useCatalogos>;
  onClose:     () => void;
  onSave:      (draft: ViajeDraft) => Promise<string | null>;
}

function ViajeModal({
  visible, mode, initialData, catalogos, onClose, onSave,
}: ViajeModalProps) {
  const [form,        setForm]        = useState<ViajeDraft>({ ...EMPTY_DRAFT });
  const [openSection, setOpenSection] = useState<SectionKey | null>('ruta');
  const [formErrors,  setFormErrors]  = useState<Partial<Record<string, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);

  // Precarga datos al abrir el modal
  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      const { id, ...rest } = initialData;
      setForm(rest);
    } else {
      setForm({ ...EMPTY_DRAFT, fecha: todayStr() });
    }

    setOpenSection(mode === 'create' ? 'ruta' : null);
    setFormErrors({});
    setServerError(null);
  }, [visible, initialData, mode]);

  // Setter genérico tipado
  const set = <K extends keyof ViajeDraft>(field: K, value: ViajeDraft[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Alterna qué sección está abierta (solo una a la vez)
  function toggleSection(key: SectionKey) {
    setOpenSection(prev => prev === key ? null : key);
  }

  // Cuando se selecciona una ruta, resetea el horario (que depende de la ruta)
  function selectRuta(r: RutaOption) {
    setForm(prev => ({
      ...prev,
      ruta_id:   r.id,
      ruta_nombre: r.nombre,
      ruta_codigo: r.codigo,
      // Si la ruta cambia, el horario previo ya no aplica
      horario_id:  '',
      hora_salida: '',
    }));
    toggleSection('unidad');
  }

  function selectUnidad(u: UnidadOption) {
    setForm(prev => ({
      ...prev,
      unidad_id:     u.id,
      unidad_placa:  u.placa,
      unidad_numero: u.numero_interno,
    }));
    toggleSection('conductor');
  }

  function selectConductor(c: ConductorOption) {
    setForm(prev => ({
      ...prev,
      conductor_id:     c.id,
      conductor_nombre: c.nombre,
    }));
    toggleSection('horario');
  }

  function selectHorario(h: HorarioOption) {
    setForm(prev => ({
      ...prev,
      horario_id:  h.id,
      hora_salida: h.hora_salida,
    }));
    setOpenSection(null);
  }

  // Horarios filtrados: si hay ruta seleccionada muestra solo los de esa ruta
  const filteredHorarios = form.ruta_id
    ? catalogos.horarios.filter(h => h.ruta_id === form.ruta_id)
    : catalogos.horarios;

  // ── Validación ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.ruta_id)      e.ruta      = 'Selecciona una ruta';
    if (!form.unidad_id)    e.unidad    = 'Selecciona una unidad';
    if (!form.conductor_id) e.conductor = 'Selecciona un conductor';
    if (!form.horario_id)   e.horario   = 'Selecciona un horario';
    if (form.estado === 'Cancelado' && !form.razon_cancelacion.trim())
      e.razon = 'Ingresa la razón de cancelación';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Guardar ───────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const err = await onSave(form);
    if (err) setServerError(err);
    else     onClose();
    setSaving(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────
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
        <View style={mst.container}>

          {/* Handle */}
          <View style={mst.handle} />

          {/* Título */}
          <View style={mst.titleRow}>
            <Text style={mst.title}>
              {mode === 'create' ? 'Nuevo Viaje' : 'Editar Viaje'}
            </Text>
            <TouchableOpacity onPress={onClose} style={mst.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Formulario */}
          <ScrollView
            style={mst.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* Error de servidor */}
            {serverError && (
              <View style={mst.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text style={mst.errorText}>{serverError}</Text>
              </View>
            )}

            {/* ── 1. RUTA ──────────────────────────────────────────────── */}
            <AccordionSection
              icon="map-outline"
              title="Ruta"
              selectedLabel={form.ruta_nombre || null}
              selectedSub={form.ruta_codigo ? `Código: ${form.ruta_codigo}` : undefined}
              isOpen={openSection === 'ruta'}
              hasError={!!formErrors.ruta}
              onToggle={() => toggleSection('ruta')}
            >
              {catalogos.rutas.length === 0
                ? <Text style={mst.emptyHint}>
                    No hay rutas disponibles.{'\n'}Agrégalas en Control → Rutas.
                  </Text>
                : catalogos.rutas.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[mst.optItem, form.ruta_id === r.id && mst.optItemActive]}
                    onPress={() => selectRuta(r)}
                    activeOpacity={0.75}
                  >
                    <View style={mst.optLeft}>
                      <Text style={[
                        mst.optBadge,
                        form.ruta_id === r.id && mst.optBadgeActive,
                      ]}>
                        {r.codigo}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[mst.optTitle, form.ruta_id === r.id && mst.optTitleActive]}
                          numberOfLines={1}
                        >
                          {r.nombre}
                        </Text>
                        <Text style={mst.optSub} numberOfLines={1}>
                          {r.origen} → {r.destino}
                        </Text>
                      </View>
                    </View>
                    {form.ruta_id === r.id &&
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    }
                  </TouchableOpacity>
                ))
              }
            </AccordionSection>

            {/* ── 2. UNIDAD ────────────────────────────────────────────── */}
            <AccordionSection
              icon="bus-outline"
              title="Unidad"
              selectedLabel={form.unidad_placa || null}
              selectedSub={form.unidad_numero ? `Nº interno: ${form.unidad_numero}` : undefined}
              isOpen={openSection === 'unidad'}
              hasError={!!formErrors.unidad}
              onToggle={() => toggleSection('unidad')}
            >
              {catalogos.unidades.length === 0
                ? <Text style={mst.emptyHint}>
                    No hay unidades activas.{'\n'}Agrégalas en Control → Unidades.
                  </Text>
                : catalogos.unidades.map(u => (
                  <TouchableOpacity
                    key={u.id}
                    style={[mst.optItem, form.unidad_id === u.id && mst.optItemActive]}
                    onPress={() => selectUnidad(u)}
                    activeOpacity={0.75}
                  >
                    <View style={mst.optLeft}>
                      <Text style={[
                        mst.optBadge,
                        form.unidad_id === u.id && mst.optBadgeActive,
                      ]}>
                        {u.placa}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[mst.optTitle, form.unidad_id === u.id && mst.optTitleActive]}
                          numberOfLines={1}
                        >
                          {u.marca}
                        </Text>
                        <Text style={mst.optSub}>
                          Nº {u.numero_interno}  ·  {u.capacidad} pasajeros
                        </Text>
                      </View>
                    </View>
                    {form.unidad_id === u.id &&
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    }
                  </TouchableOpacity>
                ))
              }
            </AccordionSection>

            {/* ── 3. CONDUCTOR ─────────────────────────────────────────── */}
            <AccordionSection
              icon="person-outline"
              title="Conductor"
              selectedLabel={form.conductor_nombre || null}
              isOpen={openSection === 'conductor'}
              hasError={!!formErrors.conductor}
              onToggle={() => toggleSection('conductor')}
            >
              {catalogos.conductores.length === 0
                ? <Text style={mst.emptyHint}>
                    No hay conductores registrados.{'\n'}Agrégalos en Control → Conductores.
                  </Text>
                : catalogos.conductores.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[mst.optItem, form.conductor_id === c.id && mst.optItemActive]}
                    onPress={() => selectConductor(c)}
                    activeOpacity={0.75}
                  >
                    <View style={mst.optLeft}>
                      {/* Avatar con inicial */}
                      <View style={[
                        mst.avatar,
                        form.conductor_id === c.id && mst.avatarActive,
                      ]}>
                        <Text style={[
                          mst.avatarText,
                          form.conductor_id === c.id && mst.avatarTextActive,
                        ]}>
                          {c.nombre.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[mst.optTitle, form.conductor_id === c.id && mst.optTitleActive]}
                          numberOfLines={1}
                        >
                          {c.nombre}
                        </Text>
                        <Text style={mst.optSub}>Cédula: {c.cedula}</Text>
                      </View>
                    </View>
                    {form.conductor_id === c.id &&
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    }
                  </TouchableOpacity>
                ))
              }
            </AccordionSection>

            {/* ── 4. HORARIO ───────────────────────────────────────────── */}
            <AccordionSection
              icon="time-outline"
              title="Horario"
              selectedLabel={form.hora_salida || null}
              selectedSub={
                !form.ruta_id
                  ? 'Selecciona una ruta para filtrar horarios'
                  : undefined
              }
              isOpen={openSection === 'horario'}
              hasError={!!formErrors.horario}
              onToggle={() => toggleSection('horario')}
            >
              {filteredHorarios.length === 0
                ? <Text style={mst.emptyHint}>
                    {form.ruta_id
                      ? 'No hay horarios activos para esta ruta.\nAgrégalos en Control → Horarios.'
                      : 'Primero selecciona una ruta para ver sus horarios disponibles.'}
                  </Text>
                : filteredHorarios.map(h => (
                  <TouchableOpacity
                    key={h.id}
                    style={[mst.optItem, form.horario_id === h.id && mst.optItemActive]}
                    onPress={() => selectHorario(h)}
                    activeOpacity={0.75}
                  >
                    <View style={mst.optLeft}>
                      {/* Chip de hora */}
                      <View style={[
                        mst.timeChip,
                        form.horario_id === h.id && mst.timeChipActive,
                      ]}>
                        <Text style={[
                          mst.timeChipText,
                          form.horario_id === h.id && mst.timeChipTextActive,
                        ]}>
                          {h.hora_salida}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[mst.optTitle, form.horario_id === h.id && mst.optTitleActive]}
                          numberOfLines={1}
                        >
                          {h.frecuencia}
                        </Text>
                        <Text style={mst.optSub} numberOfLines={1}>{h.ruta_nombre}</Text>
                      </View>
                    </View>
                    {form.horario_id === h.id &&
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    }
                  </TouchableOpacity>
                ))
              }
            </AccordionSection>

            {/* ── ESTADO (solo en modo edición) ───────────────────────── */}
            {mode === 'edit' && (
              <View style={mst.estadoSection}>
                <Text style={mst.estadoSectionLabel}>ESTADO DEL VIAJE</Text>

                <View style={mst.estadoGrid}>
                  {ESTADOS.map(e => {
                    const cfg      = ESTADO_CONFIG[e];
                    const isActive = form.estado === e;
                    return (
                      <TouchableOpacity
                        key={e}
                        style={[
                          mst.estadoBtn,
                          isActive && { backgroundColor: cfg.bg, borderColor: cfg.color },
                        ]}
                        onPress={() => set('estado', e)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={cfg.icon as any}
                          size={15}
                          color={isActive ? cfg.color : Colors.textMuted}
                        />
                        <Text style={[
                          mst.estadoBtnText,
                          isActive && { color: cfg.color, fontWeight: '700' },
                        ]}>
                          {e}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Razón de cancelación — aparece solo cuando estado = Cancelado */}
                {form.estado === 'Cancelado' && (
                  <View style={{ marginTop: Spacing.md }}>
                    <FormField label="Razón de cancelación" error={formErrors.razon}>
                      <TextInput
                        style={[
                          fieldStyles.input,
                          { minHeight: 72, textAlignVertical: 'top' },
                          formErrors.razon && fieldStyles.inputError,
                        ]}
                        placeholder="Ej: Protocolo RF, falla mecánica, ruta cortada..."
                        placeholderTextColor={Colors.textMuted}
                        value={form.razon_cancelacion}
                        onChangeText={t => set('razon_cancelacion', t)}
                        multiline
                        numberOfLines={3}
                      />
                    </FormField>
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>

          {/* Footer */}
          <View style={mst.footer}>
            <TouchableOpacity style={mst.cancelBtn} onPress={onClose}>
              <Text style={mst.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[mst.saveBtn, saving && mst.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={mst.saveText}>
                    {mode === 'create' ? 'Programar Viaje' : 'Guardar Cambios'}
                  </Text>
              }
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Estilos del modal ─────────────────────────────────────────────────────────
const mst = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  handle:    {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: 10,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: '#FFF',
  },
  title:    { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  closeBtn: { padding: 4 },
  scroll:   { flex: 1, padding: Spacing.lg },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.danger + '15',
    padding: Spacing.md, borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.danger, fontWeight: '600' },

  emptyHint: {
    fontSize: 13, color: Colors.textMuted,
    fontStyle: 'italic', textAlign: 'center',
    paddingVertical: Spacing.md, lineHeight: 20,
  },

  // ── Ítems de opción dentro del accordion ──────────────────────────────────
  optItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.sm, borderRadius: Radius.md,
    marginBottom: 6, backgroundColor: '#FFF',
    borderWidth: 1, borderColor: Colors.border,
  },
  optItemActive:   { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  optLeft:         { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  optBadge: {
    fontSize: 11, fontWeight: '800', color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.sm, letterSpacing: 0.3, overflow: 'hidden',
  },
  optBadgeActive:  { backgroundColor: Colors.primary, color: '#FFF' },
  optTitle:        { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  optTitleActive:  { color: Colors.primary, fontWeight: '700' },
  optSub:          { fontSize: 12, color: Colors.textMuted, marginTop: 1 },

  // ── Avatar conductor ───────────────────────────────────────────────────────
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarActive:    { backgroundColor: Colors.primary },
  avatarText:      { fontSize: 16, fontWeight: '800', color: Colors.primary },
  avatarTextActive: { color: '#FFF' },

  // ── Chip de hora para horarios ─────────────────────────────────────────────
  timeChip: {
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    minWidth: 58, alignItems: 'center',
  },
  timeChipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeChipText:      { fontSize: 15, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 0.5 },
  timeChipTextActive: { color: '#FFF' },

  // ── Selector de estado (solo edición) ─────────────────────────────────────
  estadoSection:      { marginBottom: Spacing.md },
  estadoSectionLabel: {
    fontSize: 10, fontWeight: '800', color: Colors.textMuted,
    letterSpacing: 0.6, marginBottom: Spacing.sm,
  },
  estadoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estadoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: '#FFF', minWidth: '45%',
  },
  estadoBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row', gap: 12,
    padding: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: '#FFF',
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  cancelText:      { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: Radius.md,
    backgroundColor: Colors.primary, alignItems: 'center', minHeight: 50,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText:        { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. SCREEN — ViajesScreen
// ══════════════════════════════════════════════════════════════════════════════

// ── Header del panel ──────────────────────────────────────────────────────────
function ViajesHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[hdr.container, { paddingTop: insets.top + 12 }]}>
      <Text style={hdr.sup}>OPERACIONES DEL DÍA</Text>
      <Text style={hdr.title}>Panel de Viajes</Text>
    </View>
  );
}

const hdr = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sup: {
    fontSize: 10, fontWeight: '700',
    color: 'rgba(255,255,255,0.55)', letterSpacing: 0.6, marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#FFF' },
});

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function ViajesScreen() {
  const { items, loading, error, create, update, remove } = useViajes();
  const catalogos = useCatalogos();

  const [search,     setSearch]     = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<Viaje | undefined>();

  // Filtro local — busca en ruta, conductor y placa
  const filtered = items.filter(v =>
    (v.ruta_nombre        || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.conductor_nombre   || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.unidad_placa       || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.hora_salida        || '').includes(search),
  );

  function openCreate() {
    setEditTarget(undefined);
    setModalOpen(true);
  }

  function openEdit(item: Viaje) {
    setEditTarget(item);
    setModalOpen(true);
  }

  return (
    <View style={scr.container}>

      <ViajesHeader />

      <SearchActionBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar ruta, conductor o placa"
        onNew={openCreate}
      />

      {error && (
        <Text style={scr.errorBanner}>⚠ {error}</Text>
      )}

      {loading ? (
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
              message={'No hay viajes programados.\nPresiona + Nuevo para agregar uno.'}
            />
          }
          renderItem={({ item }) => (
            <ItemCard
              badge={item.hora_salida}
              title={item.ruta_nombre}
              subtitle={item.ruta_codigo}
              onEdit={() => openEdit(item)}
              onDelete={() => remove(item.id)}
            >
              <View style={scr.cardBody}>

                {/* Unidad */}
                <View style={scr.infoRow}>
                  <Ionicons name="bus-outline" size={13} color={Colors.textMuted} />
                  <Text style={scr.infoLabel}>Unidad</Text>
                  <Text style={scr.infoValue} numberOfLines={1}>
                    {item.unidad_placa}  ·  Nº {item.unidad_numero}
                  </Text>
                </View>

                {/* Conductor */}
                <View style={scr.infoRow}>
                  <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
                  <Text style={scr.infoLabel}>Conductor</Text>
                  <Text style={scr.infoValue} numberOfLines={1}>
                    {item.conductor_nombre}
                  </Text>
                </View>

                {/* Razón de cancelación (solo si aplica) */}
                {item.estado === 'Cancelado' && !!item.razon_cancelacion && (
                  <View style={scr.infoRow}>
                    <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
                    <Text style={[scr.infoLabel, { color: Colors.danger }]}>Razón</Text>
                    <Text style={[scr.infoValue, { color: Colors.danger }]} numberOfLines={2}>
                      {item.razon_cancelacion}
                    </Text>
                  </View>
                )}

                {/* Estado badge */}
                <View style={{ marginTop: 8 }}>
                  <EstadoBadge estado={item.estado} />
                </View>

              </View>
            </ItemCard>
          )}
        />
      )}

      {/* Modal — montado una sola vez, controlado con visible */}
      <ViajeModal
        visible={modalOpen}
        mode={editTarget ? 'edit' : 'create'}
        initialData={editTarget}
        catalogos={catalogos}
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

// ── Estilos de la pantalla ────────────────────────────────────────────────────
const scr = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  errorBanner: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    fontSize: 13, color: Colors.danger, textAlign: 'center',
  },
  cardBody:  { gap: 6 },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 11, color: Colors.textMuted, width: 64 },
  infoValue: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
});
