import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function MenuScreen({ onBack, shop, onAddToCart, cartItems = [], onNavigateToCart }) {
  if (!shop) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Menu</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.placeholderText}>Aucun menu disponible</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Local state for richer interactions
  const [localMenus, setLocalMenus] = useState(shop?.menus ? [...shop.menus] : []);
  const [quantities, setQuantities] = useState({});
  const [expanded, setExpanded] = useState({});

  const increaseQty = (idx) => setQuantities(q => ({ ...q, [idx]: (q[idx] || 1) + 1 }));
  const decreaseQty = (idx) => setQuantities(q => ({ ...q, [idx]: Math.max(1, (q[idx] || 1) - 1) }));

  const handleReserveWithQty = (menuItem, idx) => {
    const qty = quantities[idx] || 1;
    for (let i = 0; i < qty; i++) {
      const itemToAdd = { ...menuItem, shopName: shop.name, category: shop.category };
      onAddToCart?.(itemToAdd);
    }
  };

  const toggleExpand = (idx) => setExpanded(e => ({ ...e, [idx]: !e[idx] }));

  const addMoreSampleItems = () => {
    const start = localMenus.length + 1;
    const extras = Array.from({ length: 3 }).map((_, i) => ({
      title: `Article supplémentaire ${start + i}`,
      price: 10 + i,
      remaining: 5,
      pickupTime: 'ASAP',
      description: 'Un petit complément proposé par le commerçant.'
    }));
    setLocalMenus(prev => [...prev, ...extras]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shop.name} - Menus</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity style={styles.basketButton} onPress={onNavigateToCart}>
            <MaterialIcons name="shopping-basket" size={20} color="#2d5a27" />
            <Text style={styles.basketText}>Finaliser ma commande</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.shopInfo}>
          <View style={styles.shopLogo}>
            {/* optional logo - keep a safe require path; if missing replace with a blank view */}
            {/** Ensure asset path exists in project; otherwise this will throw at runtime */}
            <Image source={require('./assets/obbo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.shopDetails}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <Text style={styles.shopCategory}>{shop.category}</Text>
            <Text style={styles.shopDistance}>{shop.distance}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Menus disponibles</Text>

        {localMenus.map((m, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>{m.title}</Text>
                <Text style={styles.menuMeta}>{m.remaining ?? '-'} restants • {m.pickupTime ?? '—'}</Text>
                {expanded[i] ? <Text style={styles.description}>{m.description ?? 'Pas de description.'}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>{m.price} DH</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(i)}>
                    <Text style={styles.qtyText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.qtyValueBox}>
                    <Text style={styles.qtyValue}>{quantities[i] || 1}</Text>
                  </View>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(i)}>
                    <Text style={styles.qtyText}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.reserveBtn} onPress={() => handleReserveWithQty(m, i)}>
                  <Text style={styles.reserveText}>Ajouter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreBtn} onPress={() => toggleExpand(i)}>
                  <Text style={styles.moreText}>{expanded[i] ? 'Réduire' : 'Voir détails'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.moreArticlesBtn} onPress={addMoreSampleItems}>
          <Text style={styles.moreArticlesText}>Voir plus d'articles</Text>
        </TouchableOpacity>

        {(!localMenus || localMenus.length === 0) && (
          <View style={styles.emptyMenu}>
            <MaterialIcons name="restaurant-menu" size={48} color="#ccc" />
            <Text style={styles.emptyMenuText}>Aucun menu disponible</Text>
            <Text style={styles.emptyMenuSubtext}>Revenez plus tard pour voir les offres</Text>
          </View>
        )}
      </ScrollView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  shopInfo: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  shopLogo: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logo: {
    width: 40,
    height: 40,
  },
  shopDetails: { flex: 1 },
  shopName: { fontSize: 18, fontWeight: '700', color: '#333' },
  shopCategory: { fontSize: 14, color: '#666' },
  shopDistance: { fontSize: 14, color: '#2d5a27', fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 12, marginTop: 6 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  menuTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  menuMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  description: { marginTop: 8, color: '#555', fontSize: 13 },
  price: { fontSize: 16, color: '#2d5a27', fontWeight: '700', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  qtyBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 18, fontWeight: '700' },
  qtyValueBox: { minWidth: 34, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  qtyValue: { fontSize: 16, fontWeight: '700' },
  reserveBtn: { backgroundColor: '#2d9c2f', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  reserveText: { color: '#fff', fontWeight: '700' },
  moreBtn: { marginTop: 6 },
  moreText: { color: '#2d5a27', fontWeight: '600' },
  moreArticlesBtn: { marginTop: 8, alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e6e6e6' },
  moreArticlesText: { color: '#2d5a27', fontWeight: '700' },
  emptyMenu: { alignItems: 'center', marginTop: 40 },
  emptyMenuText: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 12 },
  emptyMenuSubtext: { fontSize: 14, color: '#999', marginTop: 4 },
  basketButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  basketText: { color: '#2d5a27', fontSize: 13, fontWeight: '700' },
});
