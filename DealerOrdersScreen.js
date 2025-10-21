import React, { useMemo, useState } from 'react';
import { View, Text, StatusBar, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert, Platform } from 'react-native';
import SafeAreaWrapper from './utils/SafeAreaWrapper';
import { MaterialIcons } from '@expo/vector-icons';

export default function DealerOrdersScreen({
  onNavigateHome,
  onNavigateBaskets,
  onNavigateProfile,
  reservations = [],
  onUpdateReservations,
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // all | reserved | confirmed | ready | picked_up | cancelled

  const filterOptions = [
    { key: 'all', label: 'TOUS' },
    { key: 'reserved', label: 'RÉSERVÉS' },
    { key: 'confirmed', label: 'CONFIRMÉS' },
    { key: 'ready', label: 'PRÊTS' },
    { key: 'picked_up', label: 'RETIRÉS' },
    { key: 'cancelled', label: 'ANNULÉS' },
  ];

  const counts = useMemo(() => {
    const c = { all: reservations.length, reserved: 0, confirmed: 0, ready: 0, picked_up: 0, cancelled: 0 };
    for (const r of reservations) {
      const s = r.status;
      if (s === 'reserved') c.reserved += 1;
      else if (s === 'confirmed') c.confirmed += 1;
      else if (s === 'ready_for_pickup' || s === 'ready') c.ready += 1;
      else if (s === 'picked_up' || s === 'completed') c.picked_up += 1;
      else if (s === 'cancelled') c.cancelled += 1;
    }
    return c;
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    if (activeFilter === 'all') return reservations;
    if (activeFilter === 'ready') {
      return reservations.filter(r => r.status === 'ready_for_pickup' || r.status === 'ready');
    }
    if (activeFilter === 'picked_up') {
      return reservations.filter(r => r.status === 'picked_up' || r.status === 'completed');
    }
    return reservations.filter(r => r.status === activeFilter);
  }, [reservations, activeFilter]);

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const [expandedIds, setExpandedIds] = useState({});
  const toggleExpand = (id) => setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));

  // urgency: returns 'urgent' when reservation is within next 30 minutes,
  // 'late' when reservation time is in the past and order not completed/picked/cancelled
  const computeUrgency = (reservation) => {
    if (!reservation || !reservation.reservedAt) return null;
    const now = Date.now();
    const t = new Date(reservation.reservedAt).getTime();
    if (Number.isNaN(t)) return null;
    // ignore completed/cancelled
    const finished = ['picked_up', 'completed', 'cancelled'].includes(reservation.status);
    if (finished) return null;
    const diffMin = (t - now) / 60000; // minutes until reservedAt
    if (diffMin <= 0) return 'late';
    if (diffMin <= 30) return 'urgent';
    return null;
  };

  const updateStatus = (id, nextStatus) => {
    if (!onUpdateReservations) return;
    const updated = reservations.map(r => r.id === id ? { ...r, status: nextStatus } : r);
    onUpdateReservations(updated);
  };

  const callClient = (phone) => {
    if (!phone) {
      Alert.alert('Numéro indisponible', "Aucun numéro de téléphone n'est associé à cette commande.");
      return;
    }
    const telUrl = `tel:${phone.replace(/\s+/g, '')}`;
    Linking.openURL(telUrl).catch(() => {
      Alert.alert('Erreur', "Impossible d'ouvrir le composeur d'appel.");
    });
  };

  const renderActions = (reservation) => {
    const phone = reservation.customerPhone;
    switch (reservation.status) {
      case 'reserved':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.phoneButton]} onPress={() => callClient(phone)}>
              <MaterialIcons name="phone" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={() => updateStatus(reservation.id, 'confirmed')}>
              <MaterialIcons name="check" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => updateStatus(reservation.id, 'cancelled')}>
              <MaterialIcons name="close" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        );
      case 'confirmed':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.phoneButton]} onPress={() => callClient(phone)}>
              <MaterialIcons name="phone" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.readyButton]} onPress={() => updateStatus(reservation.id, 'ready_for_pickup')}>
              <MaterialIcons name="local-shipping" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Prêt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => updateStatus(reservation.id, 'cancelled')}>
              <MaterialIcons name="close" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        );
      case 'ready_for_pickup':
      case 'ready':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.phoneButton]} onPress={() => callClient(phone)}>
              <MaterialIcons name="phone" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.pickedButton]} onPress={() => updateStatus(reservation.id, 'picked_up')}>
              <MaterialIcons name="done-all" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Retiré</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.phoneButton]} onPress={() => callClient(phone)}>
              <MaterialIcons name="phone" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Appeler</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaWrapper style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commandes</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        {filterOptions.map(opt => {
          const isActive = activeFilter === opt.key;
          const count = counts[opt.key] ?? 0;
          return (
            <TouchableOpacity key={opt.key} style={[styles.filterChip, isActive && styles.activeFilterChip]} onPress={() => setActiveFilter(opt.key)}>
              <Text style={[styles.filterChipText, isActive && styles.activeFilterChipText]}>{opt.label}</Text>
              <View style={[styles.filterCount, isActive && styles.activeFilterCount]}>
                <Text style={[styles.filterCountText, isActive && styles.activeFilterCountText]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

  <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 140 : 120 }}>
        {filteredReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptySubtitle}>Les commandes des clients apparaîtront ici</Text>
          </View>
        ) : (
          <View>
            {filteredReservations.map(res => {
                const total = typeof res.total === 'number' ? res.total : (Array.isArray(res.items) ? res.items.reduce((s,i) => s + ((i.price||0) * (i.qty||1)), 0) : (res.amount || 0));
                const itemsCount = Array.isArray(res.items) ? res.items.length : (res.itemCount || 1);
                return (
                  <View key={res.id} style={styles.card}>
                    <View style={styles.cardRow}>
                      <View style={styles.avatar}>
                        <MaterialIcons name="person" size={26} color="#2d5a27" />
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.customerName}>{res.customerName || 'Client'}</Text>
                        <Text style={styles.metaText}>Tél: {res.customerPhone || '-'}</Text>
                        <Text style={styles.metaText}>Heure: {formatTime(res.reservedAt)}</Text>
                        <Text style={styles.itemsText}>{itemsCount} article{itemsCount>1?'s':''} • {res.paymentMethod ? res.paymentMethod : '—'}</Text>
                      </View>

                      <View style={styles.rightColumn}>
                        <Text style={styles.orderTotal}>{total} DH</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {(() => {
                            const urgency = computeUrgency(res);
                            if (urgency === 'urgent') return <Text style={styles.urgentBadge}>Urgent</Text>;
                            if (urgency === 'late') return <Text style={styles.lateBadge}>En retard</Text>;
                            return null;
                          })()}
                          <Text style={[styles.statusBadge, styles[`status_${(res.status || 'reserved').replace(/[^a-z_]/g, '')}`]]}>
                            {(() => {
                              switch (res.status) {
                                case 'reserved': return 'Réservé';
                                case 'confirmed': return 'Confirmé';
                                case 'ready_for_pickup':
                                case 'ready': return 'Prêt';
                                case 'picked_up':
                                case 'completed': return 'Retiré';
                                case 'cancelled': return 'Annulé';
                                default: return res.status || 'Réservé';
                              }
                            })()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {Array.isArray(res.items) && res.items.length > 0 && (
                      <View style={styles.itemsContainerCollapse}>
                        <ScrollView style={expandedIds[res.id] ? styles.itemsScrollOpen : styles.itemsScroll} nestedScrollEnabled>
                          {res.items.map((it, ix) => (
                            <View key={ix} style={styles.itemRow}>
                              <Text style={styles.itemName}>{it.name || 'Article'}</Text>
                              <Text style={styles.itemQty}>{(it.qty||1)}× {(it.price||0)} DH</Text>
                            </View>
                          ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.expandToggle} onPress={() => toggleExpand(res.id)}>
                          <Text style={styles.expandToggleText}>{expandedIds[res.id] ? 'Réduire' : 'Voir les articles'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {renderActions(res)}
                  </View>
                );
              })}
          </View>
        )}
  </ScrollView>

      <View style={styles.bottomHeader}>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateHome}>
          <MaterialIcons name="home" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateBaskets}>
          <MaterialIcons name="shopping-bag" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Paniers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.headerItem, styles.activeHeaderItem]} onPress={() => {}}>
          <MaterialIcons name="receipt" size={22} color="#fff" />
          <Text style={styles.activeHeaderItemText}>Commandes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateProfile}>
          <MaterialIcons name="person" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  filters: {
    marginTop: 8,
  },
  filtersContent: {
    paddingHorizontal: 10,
    gap: 4,
  },
  filterChip: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 4,
    minWidth: 68,
    minHeight: 40,
  },
  activeFilterChip: {
    backgroundColor: '#2d5a27',
    borderColor: '#2d5a27',
  },
  filterChipText: {
    color: '#2d5a27',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  activeFilterChipText: {
    color: '#fff',
    fontWeight: '700',
  },
  filterCount: {
    marginTop: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  activeFilterCount: {
    backgroundColor: '#fff',
  },
  filterCountText: {
    color: '#2d5a27',
    fontWeight: '700',
    fontSize: 10,
  },
  activeFilterCountText: {
    color: '#2d5a27',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  itemsText: {
    fontSize: 12,
    color: '#7a836f',
    marginTop: 6,
  },
  itemsContainerCollapse: {
    marginTop: 10,
  },
  itemsScroll: {
    maxHeight: 0,
    overflow: 'hidden',
  },
  itemsScrollOpen: {
    maxHeight: 160,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: { color: '#333' },
  itemQty: { color: '#666' },
  expandToggle: { marginTop: 8, alignItems: 'center' },
  expandToggleText: { color: '#2d5a27', fontWeight: '700' },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d5a27',
    marginBottom: 6,
  },
  urgentBadge: {
    backgroundColor: '#ffcf3d',
    color: '#663c00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontWeight: '700',
    fontSize: 12,
  },
  lateBadge: {
    backgroundColor: '#ff4d4f',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontWeight: '700',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  status_reserved: {
    backgroundColor: '#fff7e6',
    color: '#b26a00',
  },
  status_confirmed: {
    backgroundColor: '#e6f7ff',
    color: '#0050b3',
  },
  status_ready_for_pickup: {
    backgroundColor: '#e6fffb',
    color: '#006d75',
  },
  status_picked_up: {
    backgroundColor: '#f6ffed',
    color: '#237804',
  },
  status_cancelled: {
    backgroundColor: '#fff1f0',
    color: '#a8071a',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  phoneButton: {
    backgroundColor: '#2d5a27',
  },
  confirmButton: {
    backgroundColor: '#2d5a27',
  },
  readyButton: {
    backgroundColor: '#2d5a27',
  },
  pickedButton: {
    backgroundColor: '#2d5a27',
  },
  cancelButton: {
    backgroundColor: '#ff4d4f',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  bottomHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#dcefe0',
    borderRadius: 500,
    paddingVertical: 10,
  },
  headerItem: {
    alignItems: 'center',
    gap: 4,
  },
  activeHeaderItem: {
    backgroundColor: '#2d5a27',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerItemText: {
    color: '#2d5a27',
    fontWeight: '600',
    fontSize: 12,
  },
  activeHeaderItemText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});
