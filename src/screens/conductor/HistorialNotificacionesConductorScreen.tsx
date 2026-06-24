import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { supabase } from '../../lib/supabase';

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  audiencia: string;
  estado: string;
  created_at: string;
}

export default function HistorialNotificacionesConductorScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notificaciones_historial')
        .select('*')
        .in('audiencia', ['all', 'drivers'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (e) {
      console.log('Error fetching conductor notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const formatTime = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const today = new Date();
      const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

      const dateStr = isToday ? 'Hoy' : d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
      return `${dateStr}, ${formattedHours}:${formattedMinutes} ${ampm}`;
    } catch {
      return '';
    }
  };

  const renderItem = ({ item }: { item: Notificacion }) => {
    const isGlobal = item.audiencia === 'all';
    
    return (
      <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: isGlobal ? '#E0F2FE' : '#DCFCE7' }]}>
          <Ionicons 
            name={isGlobal ? 'megaphone' : 'bus'} 
            size={22} 
            color={isGlobal ? '#0284C7' : '#16A34A'} 
          />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <View style={[styles.audienceBadge, { backgroundColor: isGlobal ? '#0284C715' : '#16A34A15' }]}>
              <Text style={[styles.audienceBadgeText, { color: isGlobal ? '#0284C7' : '#16A34A' }]}>
                {isGlobal ? 'Global' : 'Conductor'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardMessage}>{item.mensaje}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones del Admin</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loaderText}>Cargando notificaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>Sin notificaciones</Text>
              <Text style={styles.emptySubtext}>No se han enviado alertas de administración por el momento.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.md,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Shadow.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardBody: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  audienceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  audienceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});
