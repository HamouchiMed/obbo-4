import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Image, TextInput, RefreshControl, Alert, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function NearbyOffersScreen({ onBack, onOpenMap, onOpenMenus, userLocation, createdBaskets = [], onNavigateHome, onNavigatePanier, onNavigateProfil, onRefresh, cartItems = [], onNavigateToOrderConfirmation, onRequestLocation }) {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tous'); // Tous | Proches | Promos | Bio | Boulangerie | Café | Snack | Restaurant

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

  const [favorites, setFavorites] = useState({}); // track favorites by shop.name

  const toggleFavorite = (shop) => {
    setFavorites(prev => {
      const next = { ...prev };
      if (next[shop.name]) delete next[shop.name];
      else next[shop.name] = true;
      return next;
    });
  };

  const handleShare = async (shop) => {
    try {
      const title = shop.menus?.[0]?.title || shop.name;
      const text = `Découvrez ${shop.name} - ${title} sur Obbo.`;
      await Share.share({ message: text });
    } catch (err) {
      Alert.alert('Partager', 'Impossible d\'ouvrir le partage.');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = itemsWithDistance;
    // Apply chip-based filter first
    switch (activeFilter) {
      case 'Proches':
        list = list.filter(i => (i.distanceValue || 9999) <= 2.5); // within 2.5 km
        break;
      case 'Promos':
        // simple heuristic: promos are created baskets or price under 20
        list = list.filter(i => i.isCreatedBasket || (i.menus?.some(m => (Number(m.price) || 0) < 20)));
        break;
      case 'Bio':
        list = list.filter(i => (i.category || '').toLowerCase().includes('bio'));
        break;
      case 'Boulangerie':
        list = list.filter(i => (i.category || '').toLowerCase().includes('boulanger'));
        break;
      case 'Café':
        list = list.filter(i => (i.category || '').toLowerCase().includes('café') || (i.category || '').toLowerCase().includes('cafe'));
        break;
      case 'Snack':
      case 'Restaurant':
        list = list.filter(i => (i.category || '').toLowerCase().includes('snack') || (i.category || '').toLowerCase().includes('restaurant'));
        break;
      default:
        // 'Tous' -> no filter
        break;
    }

    if (!q) return list;
    return list.filter((it) => 
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

  // Hide specific menu items for certain retailers (e.g., remove 'Panier Bio' and 'Panier anti-gaspi')
  const shouldHideMenuForShop = (shopName, menuTitle) => {
    if (!shopName || !menuTitle) return false;
    // shops to apply the hide rule to
    const shopMatch = /(aswak|assalam|carrefour)/i.test(shopName);
    const menuMatch = /panier\s*(bio|anti[-\s]?gaspi|antigaspi|anti-gaspi)/i.test(menuTitle);
    return shopMatch && menuMatch;
  };

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

        {/* Filters */}
        <View style={styles.filtersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6 }}>
            {['Tous', 'Proches', 'Promos', 'Bio', 'Boulangerie', 'Café', 'Snack', 'Restaurant'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, activeFilter === f && styles.activeFilterChip]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterChipText, activeFilter === f && styles.activeFilterChipText]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Cards */}
        {filtered.map((shop, index) => (
          <TouchableOpacity
            key={`${shop.name}_${index}`}
            activeOpacity={0.9}
            style={[
              styles.card,
              index < 3 && styles.highlightedCard,
              shop.isCreatedBasket && styles.createdBasketCard
            ]}
            onPress={() => onOpenMenus?.(shop)}
          >
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
                  {/* action icons */}
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity onPress={() => toggleFavorite(shop)} style={styles.actionButton}>
                      <MaterialIcons name={favorites[shop.name] ? 'favorite' : 'favorite-border'} size={18} color={favorites[shop.name] ? '#ff6b6b' : '#777'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleShare(shop)} style={styles.actionButton}>
                      <MaterialIcons name="share" size={18} color="#777" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <Text style={styles.cardCategory}>{shop.category}</Text>
              <Text style={styles.cardSub}>{shop.packs} packs · {shop.menus?.[0]?.pickupTime || ''}</Text>
              {/* Menu preview */}
              {shop.menus && shop.menus.length > 0 && (
                <View style={styles.menuPreview}>
                  {shop.menus.slice(0,2).map((m, mi) => (
                    <View key={`${shop.name}_menu_${mi}`} style={styles.menuItem}>
                      <Text style={styles.menuTitle} numberOfLines={1}>{m.title}</Text>
                      <Text style={styles.menuMeta}>{m.remaining} left · {m.pickupTime}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.cardFooter}>
                {userLocation?.coords && (
                  <View style={styles.distanceContainer}>
                    <MaterialIcons name="location-on" size={16} color="#2d5a27" />
                    <Text style={styles.distanceText}>{shop.distance}</Text>
                  </View>
                )}
                <View style={styles.rightFooter}>
                  <TouchableOpacity style={styles.menuButton} onPress={() => onOpenMenus?.(shop)}>
                    <Text style={styles.menuButtonText}>Voir les menus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
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
  headerBlock: {
    alignItems: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7a6b',
    textAlign: 'center',
    marginBottom: 6,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 20,
    
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
  filtersRow: {
    marginVertical: 8,
  },
  filterChip: {
    backgroundColor: '#f3faf3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e6f3e6',
  },
  filterChipText: {
    color: '#2d5a27',
    fontWeight: '600',
  },
  activeFilterChip: {
    backgroundColor: '#2d5a27',
    borderColor: '#2d5a27',
  },
  activeFilterChipText: {
    color: '#fff',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
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
    left: 11,
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
  rightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    marginLeft: 6,
    padding: 6,
    borderRadius: 8,
  },
  menuPreview: {
    marginTop: 6,
    backgroundColor: '#fbfbfb',
    borderRadius: 8,
    padding: 6,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  menuTitle: {
    flex: 1,
    color: '#222',
    fontWeight: '600',
    fontSize: 13,
  },
  menuMeta: {
    marginLeft: 6,
    color: '#777',
    fontSize: 11,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2d5a27',
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