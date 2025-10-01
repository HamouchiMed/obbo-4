import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function BasketListScreen({ onBack, createdBaskets = [], onRefresh, onCreateBasket, onDeleteBasket, onEditBasket, reservations = [], onNavigateHome, onNavigateOrders, onNavigateProfile, onToggleBasketStatus, onAdjustBasketQuantity, onDuplicateBasket, onShareBasket }) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefreshHandler = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      onRefresh?.();
      setRefreshing(false);
    }, 1000);
  };

  const handleDeleteBasket = (basketId) => {
    Alert.alert(
      'Supprimer le panier',
      'Êtes-vous sûr de vouloir supprimer ce panier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            onDeleteBasket?.(basketId);
          }
        }
      ]
    );
  };

  const handleEditBasket = (basket) => {
    onEditBasket?.(basket);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getReservationInfo = (basketId) => {
    return reservations.find(reservation => reservation.basketId === basketId);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Paniers</Text>
        <View style={styles.headerRight}>
          <Text style={styles.basketCount}>{createdBaskets.length}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshHandler}
            colors={['#2d5a27']}
            tintColor="#2d5a27"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {createdBaskets.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="shopping-basket" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucun panier créé</Text>
            <Text style={styles.emptySubtitle}>
              Créez votre premier panier pour commencer à vendre
            </Text>
          </View>
        ) : (
          <View style={styles.basketList}>
            {createdBaskets.map((basket, index) => {
              // Use basketData if available, otherwise use the basket itself
              const basketData = basket.basketData || basket;
              const reservation = getReservationInfo(basket.id);
              const status = basket.basketData?.status || 'active';
              const remaining = typeof basket.basketData?.remaining === 'number' ? basket.basketData.remaining : (basket.menus?.[0]?.remaining || 1);
              return (
                <View key={basket.id || index} style={[styles.basketCard, reservation && styles.reservedBasket]}>
                  <View style={styles.basketImageContainer}>
                    {basketData.image ? (
                      <Image source={{ uri: basketData.image.uri }} style={styles.basketImage} />
                    ) : (
                      <View style={styles.basketImagePlaceholder}>
                        <MaterialIcons name="shopping-basket" size={32} color="#2d5a27" />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.basketInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.basketName}>{basketData.name}</Text>
                      <TouchableOpacity onPress={() => onToggleBasketStatus?.(basket.id)}>
                        <Text style={[styles.statusBadge, status === 'active' ? styles.statusActive : styles.statusPaused]}>{status === 'active' ? 'Actif' : status === 'paused' ? 'En pause' : status}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.basketPrice}>{basketData.price}€</Text>
                    <View style={styles.basketDetails}>
                      <View style={styles.detailItem}>
                        <MaterialIcons name="event" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {formatDate(basketData.collectionDate)}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialIcons name="access-time" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {basketData.collectionTime}
                        </Text>
                      </View>
                      <View style={[styles.detailItem, { marginLeft: 'auto' }]}> 
                        <MaterialIcons name="inventory-2" size={16} color="#2d5a27" />
                        <Text style={[styles.detailText, { color: '#2d5a27', fontWeight: '700' }]}>Restant: {remaining}</Text>
                      </View>
                    </View>

                    <View style={styles.quantityRow}>
                      <TouchableOpacity style={[styles.qtyButton, styles.qtyMinus]} onPress={() => onAdjustBasketQuantity?.(basket.id, -1)}>
                        <MaterialIcons name="remove" size={18} color="#2d5a27" />
                      </TouchableOpacity>
                      <View style={styles.qtyValue}><Text style={styles.qtyValueText}>{remaining}</Text></View>
                      <TouchableOpacity style={[styles.qtyButton, styles.qtyPlus]} onPress={() => onAdjustBasketQuantity?.(basket.id, +1)}>
                        <MaterialIcons name="add" size={18} color="#2d5a27" />
                      </TouchableOpacity>

                      {reservation && (
                        <TouchableOpacity style={styles.reservationBadge} onPress={() => onNavigateOrders?.()}>
                          <MaterialIcons name="notifications" size={16} color="#fff" />
                          <Text style={styles.reservationBadgeText}>1 réservation</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.createdDate}>
                      Créé le {formatDate(basketData.createdAt)}
                    </Text>
                    
                    {/* Reservation Information */}
                    {reservation && (
                      <View style={styles.reservationInfo}>
                        <View style={styles.reservationHeader}>
                          <MaterialIcons name="person" size={14} color="#2d5a27" />
                          <Text style={styles.reservationTitle}>Réservé par {reservation.customerName}</Text>
                        </View>
                        <View style={styles.reservationDetails}>
                          <Text style={styles.reservationText}>
                            📞 {reservation.customerPhone}
                          </Text>
                          <Text style={styles.reservationText}>
                            🕒 Réservé à {formatTime(reservation.reservedAt)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.basketActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => onEditBasket?.(basket)}
                    >
                      <MaterialIcons name="edit" size={20} color="#2d5a27" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => onDuplicateBasket?.(basket.id)}
                    >
                      <MaterialIcons name="content-copy" size={20} color="#2d5a27" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => onShareBasket?.(basket.id)}
                    >
                      <MaterialIcons name="share" size={20} color="#2d5a27" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => onDeleteBasket?.(basket.id)}
                    >
                      <MaterialIcons name="delete" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => onCreateBasket?.()}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Dealer Bottom Navigation - pill style */}
      <View style={styles.bottomHeader}>
        <TouchableOpacity style={styles.headerItem} onPress={() => onNavigateHome?.()}>
          <MaterialIcons name="home" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Accueil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.headerItem, styles.activeHeaderItem]}>
          <MaterialIcons name="shopping-basket" size={22} color="#fff" />
          <Text style={styles.activeHeaderItemText}>Mes Paniers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerItem} onPress={() => onNavigateOrders?.()}>
          <MaterialIcons name="receipt" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Commandes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerItem} onPress={() => onNavigateProfile?.()}>
          <MaterialIcons name="person" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  headerRight: {
    backgroundColor: '#2d5a27',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  basketCount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    lineHeight: 22,
  },
  basketList: {
    paddingBottom: 100,
  },
  basketCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  basketImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  basketImage: {
    width: '100%',
    height: '100%',
  },
  basketImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  basketInfo: {
    flex: 1,
    paddingRight: 64,
  },
  basketName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  basketPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5a27',
    marginBottom: 8,
  },
  basketDetails: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  createdDate: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  basketActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButton: {
    padding: 8,
    marginLeft: 2,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#ffe6e6',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  statusActive: {
    backgroundColor: '#e6fffb',
    color: '#006d75',
  },
  statusPaused: {
    backgroundColor: '#fff7e6',
    color: '#b26a00',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  qtyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e8f5e8',
  },
  qtyMinus: {},
  qtyPlus: {},
  qtyValue: {
    minWidth: 40,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  qtyValueText: {
    fontWeight: '700',
    color: '#2d5a27',
  },
  reservationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    backgroundColor: '#2d5a27',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  reservationBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  createButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2d5a27',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  createButtonText: {
    // removed text for FAB style
  },
  reservedBasket: {
    borderLeftWidth: 4,
    borderLeftColor: '#2d5a27',
    backgroundColor: '#f0f8f0',
  },
  reservationInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2d5a27',
  },
  reservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reservationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d5a27',
    marginLeft: 4,
  },
  reservationDetails: {
    marginLeft: 18,
  },
  reservationText: {
    fontSize: 11,
    color: '#2d5a27',
    marginBottom: 2,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeNavItem: {
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
  },
  navLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#2d5a27',
    fontWeight: 'bold',
  },
  notificationBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // New pill-style bottom header (consistent)
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
