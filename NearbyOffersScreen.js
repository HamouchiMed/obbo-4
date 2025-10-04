import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Image, TextInput, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function NearbyOffersScreen({ onBack, onOpenMap, onOpenMenus, userLocation, createdBaskets = [], onNavigateHome, onNavigatePanier, onNavigateProfil, onRefresh, cartItems = [], onNavigateToOrderConfirmation, onRequestLocation }) {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const items = useMemo(
    () => [
      {
        name: 'Carrefour',
        packs: 5,
        distance: '2 km',
        coords: { latitude: 33.586, longitude: -7.64 },
        category: 'Supermarché',
        menus: [
          { title: 'Panier anti-gaspi', price: 25, remaining: 5, pickupTime: '18h30' },
        ],
      },
      {
        name: 'PAUL',
        packs: 3,
        distance: '2,5 km',
        coords: { latitude: 33.589, longitude: -7.628 },
        category: 'Boulangerie',
        menus: [
          { title: 'Assortiment Viennoiseries', price: 15, remaining: 3, pickupTime: '19h' },
        ],
      },
      {
        name: 'McDo',
        packs: 4,
        distance: '3 km',
        coords: { latitude: 33.592, longitude: -7.62 },
        category: 'Restauration rapide',
        menus: [
          { title: 'Menu Big Mac', price: 20, remaining: 3, pickupTime: '22h30' },
          { title: 'McFlurry-Glace', price: 10, remaining: 3, pickupTime: '23h' },
        ],
      },
      {
        name: 'Marjane',
        packs: 6,
        distance: '1,8 km',
        coords: { latitude: 33.58, longitude: -7.61 },
        category: 'Hypermarché',
        menus: [
          { title: 'Panier Frais', price: 30, remaining: 2, pickupTime: '20h' },
        ],
      },
      {
        name: 'Aswak Assalam',
        packs: 2,
        distance: '1,2 km',
        coords: { latitude: 33.582, longitude: -7.635 },
        category: 'Supermarché',
        menus: [
          { title: 'Panier Bio', price: 35, remaining: 2, pickupTime: '19h30' },
        ],
      },
      {
        name: 'Bim',
        packs: 4,
        distance: '2,8 km',
        coords: { latitude: 33.595, longitude: -7.625 },
        category: 'Supermarché',
        menus: [
          { title: 'Panier Économique', price: 18, remaining: 4, pickupTime: '21h' },
        ],
      },
      // Add created baskets from dealers
      ...createdBaskets,
    ],
    [createdBaskets]
  );

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getItemsWithDistance = () => {
    if (!userLocation?.coords) return items;
    
    return items.map(item => {
      if (!item.coords) return item;
      const distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        item.coords.latitude,
        item.coords.longitude
      );
      return { 
        ...item, 
        distance: distance.toFixed(1) + ' km',
        distanceValue: distance
      };
    }).sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));
  };

  const itemsWithDistance = getItemsWithDistance();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return itemsWithDistance;
    return itemsWithDistance.filter((it) => 
      it.name.toLowerCase().includes(q) || 
      it.category.toLowerCase().includes(q)
    );
  }, [itemsWithDistance, query]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.resolve(onRefresh?.());
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#2d5a27"]} tintColor="#2d5a27" />
        }
      >
        <Text style={styles.title}>Paniers autour de moi</Text>

        {!userLocation?.coords && (
          <View style={styles.locationPrompt}>
            <Text style={styles.promptText}>Activez la localisation pour voir les paniers proches.</Text>
            <TouchableOpacity
              style={styles.enableButtonPrompt}
              onPress={() => {
                if (typeof onRequestLocation === 'function') {
                  onRequestLocation();
                } else if (onOpenMap) {
                  onOpenMap(itemsWithDistance, userLocation);
                } else {
                  Alert.alert('Activer la localisation', "Veuillez activer la localisation dans les paramètres ou via l'application.");
                }
              }}
            >
              <Text style={styles.enableButtonPromptText}>Activer la localisation</Text>
            </TouchableOpacity>
          </View>
        )}

        {userLocation?.coords && (
          <View style={styles.locationInfo}>
            <MaterialIcons name="location-on" size={16} color="#2d5a27" />
            <Text style={styles.locationText}>Localisation activée</Text>
            {/* Finaliser mes paniers button - only show when there are items in cart */}
            {cartItems.length > 0 && (
              <TouchableOpacity style={styles.finalizeButton} onPress={() => onNavigateToOrderConfirmation?.()}>
                <MaterialIcons name="shopping-basket" size={16} color="#fff" />
                <Text style={styles.finalizeButtonText}>Finaliser ({cartItems.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.headerRow}>
          {isSearching ? (
            <View style={styles.searchBar}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher (ex: Carrefour)"
                placeholderTextColor="#666"
                style={styles.searchInput}
                autoFocus
              />
              <TouchableOpacity onPress={() => { setQuery(''); setIsSearching(false); }}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.searchButton} onPress={() => setIsSearching(true)}>
              <MaterialIcons name="search" size={20} color="#2d5a27" />
              <Text style={styles.searchText}>Rechercher</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              if (!userLocation?.coords) {
                Alert.alert(
                  'Localisation requise',
                  'Pour voir la carte, veuillez activer la localisation.',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Activer', onPress: () => { if (typeof onRequestLocation === 'function') onRequestLocation(); else if (onOpenMap) onOpenMap(itemsWithDistance, userLocation); } }
                  ]
                );
                return;
              }
              onOpenMap?.(itemsWithDistance, userLocation);
            }}
          >
            <MaterialIcons name="map" size={20} color="#2d5a27" />
            <Text style={styles.mapText}>Voir sur la carte</Text>
          </TouchableOpacity>
        </View>

        {/* Cards */}
        {filtered.map((shop, index) => (
          <View key={shop.name} style={[
            styles.card,
            index < 3 && styles.highlightedCard,
            shop.isCreatedBasket && styles.createdBasketCard
          ]}>
            <View style={styles.logoPlaceholder}>
              <Image source={require('./assets/obbo.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{shop.name}</Text>
                <View style={styles.badgeContainer}>
                  {userLocation?.coords && index < 3 && (
                    <View style={styles.closestBadge}>
                      <Text style={styles.closestText}>Proche</Text>
                    </View>
                  )}
                  {shop.isCreatedBasket && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newText}>Nouveau</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.cardCategory}>{shop.category}</Text>
              <Text style={styles.cardSub}>{shop.packs} packs à récupérer après 18h</Text>
              <View style={styles.cardFooter}>
                {userLocation?.coords && (
                  <View style={styles.distanceContainer}>
                    <MaterialIcons name="location-on" size={16} color="#2d5a27" />
                    <Text style={styles.distanceText}>{shop.distance}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.menuButton} onPress={() => onOpenMenus?.(shop)}>
                  <Text style={styles.menuButtonText}>Voir les menus</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
            <Text style={styles.emptySubtext}>Essayez avec d'autres mots-clés</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom header with Home / Panier / Profil */}
      <View style={styles.bottomHeader}>
        <TouchableOpacity style={[styles.headerItem, styles.activeHeaderItem]} onPress={() => onNavigateHome?.()}>
          <MaterialIcons name="home" size={22} color="#fff" />
          <Text style={styles.activeHeaderItemText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={() => onNavigatePanier?.()}>
          <MaterialIcons name="shopping-cart" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Panier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={() => onNavigateProfil?.()}>
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
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
    color: '#000',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
    gap: 12,
  },
  locationText: {
    marginLeft: 4,
    color: '#2d5a27',
    fontWeight: '600',
    fontSize: 14,
  },
  locationPrompt: {
    alignItems: 'center',
    marginVertical: 12,
  },
  promptText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  enableButtonPrompt: {
    backgroundColor: '#2d5a27',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  enableButtonPromptText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
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
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: '#000',
  },
  cancelText: {
    color: '#2d5a27',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  searchText: {
    color: '#000',
    fontSize: 16,
  },
  mapButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  mapText: {
    color: '#000',
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    gap: 12,
  },
  highlightedCard: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closestBadge: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  closestText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cardSub: {
    marginTop: 4,
    color: '#444',
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    color: '#000',
    fontWeight: '600',
  },
  menuButton: {
    backgroundColor: '#2d5a27',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  finalizeButton: {
    backgroundColor: '#2d5a27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    gap: 4,
  },
  finalizeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});