import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../../../theme/colors';
import { supabase } from '../../../../lib/supabase';

interface UserItem {
  id: string;
  email: string;
  role: 'passenger' | 'admin' | 'operator';
  blocked: boolean;
  created_at: string;
  nombres: string | null;
  apellidos: string | null;
  telefono: string | null;
}

export default function UsuariosTab() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Role Modal state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentAdminId(user.id);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      console.log('Error fetching users:', e);
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleBlock = async (user: UserItem) => {
    if (user.id === currentAdminId) {
      Alert.alert('Acción no permitida', 'No puedes bloquear tu propia cuenta de administrador.');
      return;
    }

    const nextBlockedState = !user.blocked;
    const actionText = nextBlockedState ? 'bloquear' : 'desbloquear';
    
    Alert.alert(
      'Confirmar Acción',
      `¿Estás seguro de que deseas ${actionText} a ${user.nombres || user.email}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('users')
                .update({ blocked: nextBlockedState })
                .eq('id', user.id);

              if (error) throw error;

              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, blocked: nextBlockedState } : u));
              Alert.alert('Éxito', `Usuario ${nextBlockedState ? 'bloqueado' : 'habilitado'} con éxito.`);
            } catch (err) {
              console.log('Error updating block status:', err);
              Alert.alert('Error', 'No se pudo cambiar el estado del usuario.');
            }
          }
        }
      ]
    );
  };

  const handleOpenRoleModal = (user: UserItem) => {
    if (user.id === currentAdminId) {
      Alert.alert('Acción no permitida', 'No puedes modificar tu propio rol de administrador.');
      return;
    }
    setSelectedUser(user);
    setRoleModalVisible(true);
  };

  const handleChangeRole = async (targetRole: 'passenger' | 'admin' | 'operator') => {
    if (!selectedUser) return;
    setUpdatingRole(true);
    try {
      // 1. Update user role in users table
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ role: targetRole })
        .eq('id', selectedUser.id);

      if (userUpdateError) throw userUpdateError;

      // 2. If promoted to operator, verify they have a driver profile
      if (targetRole === 'operator') {
        const { data: profile } = await supabase
          .from('driver_profiles')
          .select('id')
          .eq('id', selectedUser.id)
          .maybeSingle();

        if (!profile) {
          // Create driver profile if missing
          const { error: profileError } = await supabase
            .from('driver_profiles')
            .insert({
              id: selectedUser.id,
              email: selectedUser.email,
              nombre: `${selectedUser.nombres || ''} ${selectedUser.apellidos || ''}`.trim() || selectedUser.email.split('@')[0],
              telefono: selectedUser.telefono || ''
            });

          if (profileError) console.log('Warning: Error auto-creating driver profile:', profileError);
        }
      }

      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: targetRole } : u));
      setRoleModalVisible(false);
      Alert.alert('Éxito', 'Rol de usuario actualizado con éxito.');
    } catch (err) {
      console.log('Error updating role:', err);
      Alert.alert('Error', 'No se pudo actualizar el rol del usuario.');
    } finally {
      setUpdatingRole(false);
      setSelectedUser(null);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: '#F5F3FF', text: '#7C3AED', label: 'Admin' };
      case 'operator':
        return { bg: '#DCFCE7', text: '#16A34A', label: 'Conductor' };
      default:
        return { bg: '#E0F2FE', text: '#0284C7', label: 'Pasajero' };
    }
  };

  const filteredUsers = users.filter(u => {
    const search = searchQuery.toLowerCase();
    const fullName = `${u.nombres || ''} ${u.apellidos || ''}`.toLowerCase();
    const email = u.email.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const renderItem = ({ item }: { item: UserItem }) => {
    const roleBadge = getRoleBadgeStyle(item.role);
    const isMe = item.id === currentAdminId;

    return (
      <View style={[styles.card, item.blocked && styles.cardBlocked]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {(item.nombres?.[0] || item.email[0]).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.nombres ? `${item.nombres} ${item.apellidos || ''}`.trim() : 'Usuario Registrado'}
              {isMe && <Text style={styles.meTag}> (Tú)</Text>}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          </View>

          <View style={styles.badgesRow}>
            {item.blocked && (
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedBadgeText}>Bloqueado</Text>
              </View>
            )}
            <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
              <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>{roleBadge.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, isMe && styles.actionBtnDisabled]} 
            onPress={() => handleOpenRoleModal(item)}
            disabled={isMe}
          >
            <Ionicons name="shield-outline" size={16} color={isMe ? Colors.textMuted : Colors.primary} />
            <Text style={[styles.actionBtnText, isMe && styles.actionBtnTextDisabled, { color: Colors.primary }]}>Cambiar Rol</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionBtn, 
              item.blocked ? styles.actionBtnEnable : styles.actionBtnBlock,
              isMe && styles.actionBtnDisabled
            ]} 
            onPress={() => handleToggleBlock(item)}
            disabled={isMe}
          >
            <Ionicons 
              name={item.blocked ? 'lock-open-outline' : 'lock-closed-outline'} 
              size={16} 
              color={isMe ? Colors.textMuted : item.blocked ? Colors.success : Colors.danger} 
            />
            <Text style={[
              styles.actionBtnText, 
              isMe && styles.actionBtnTextDisabled,
              { color: item.blocked ? Colors.success : Colors.danger }
            ]}>
              {item.blocked ? 'Habilitar' : 'Bloquear'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o correo..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loaderText}>Cargando usuarios...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No se encontraron usuarios</Text>
            </View>
          }
        />
      )}

      {/* Role Picker Modal */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Asignar Rol a Usuario</Text>
            <Text style={styles.modalSubtitle}>{selectedUser?.nombres || selectedUser?.email}</Text>
            
            {updatingRole ? (
              <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={{ marginTop: Spacing.sm, color: Colors.textSecondary, fontWeight: '600' }}>Actualizando rol...</Text>
              </View>
            ) : (
              <View style={styles.modalOptions}>
                {[
                  { value: 'passenger', label: 'Pasajero', desc: 'Acceso a rutas y rastreo', icon: 'people-outline' },
                  { value: 'operator', label: 'Conductor', desc: 'Panel de navegación y ubicación', icon: 'bus-outline' },
                  { value: 'admin', label: 'Administrador', desc: 'Acceso completo al sistema', icon: 'shield-checkmark-outline' }
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.modalOptionCard,
                      selectedUser?.role === opt.value && styles.modalOptionSelected
                    ]}
                    onPress={() => handleChangeRole(opt.value as any)}
                  >
                    <Ionicons name={opt.icon as any} size={22} color={selectedUser?.role === opt.value ? Colors.primary : Colors.textSecondary} />
                    <View style={styles.modalOptionText}>
                      <Text style={[styles.modalOptionLabel, selectedUser?.role === opt.value && { color: Colors.primary }]}>{opt.label}</Text>
                      <Text style={styles.modalOptionDesc}>{opt.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => {
                setRoleModalVisible(false);
                setSelectedUser(null);
              }}
              disabled={updatingRole}
            >
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    ...Shadow.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardBlocked: {
    opacity: 0.85,
    backgroundColor: '#F8FAFC',
    borderColor: '#EF444430',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  userInfo: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  meTag: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  badgesRow: {
    alignItems: 'flex-end',
    gap: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  blockedBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  blockedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.danger,
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnBlock: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  actionBtnEnable: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnTextDisabled: {
    color: Colors.textMuted,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 49, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    width: '88%',
    borderRadius: Radius.xl,
    padding: 20,
    ...Shadow.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  modalOptions: {
    gap: Spacing.md,
    marginBottom: 20,
  },
  modalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
    gap: Spacing.md,
  },
  modalOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#0A193108',
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  modalOptionDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  modalCloseBtn: {
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
