import React from 'react';
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

  const handleReserve = (menuItem) => {
    const itemToAdd = {
      ...menuItem,
      shopName: shop.name,
      category: shop.category,
    };
    onAddToCart?.(itemToAdd);
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
            <MaterialIcons name="shopping-basket" size={24} color="#2d5a27" />
            <Text style={styles.basketText}>Finaliser ma commande</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.shopInfo}>
          <View style={styles.shopLogo}>
            <Image source={require('./assets/obbo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.shopDetails}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <Text style={styles.shopCategory}>{shop.category}</Text>
            <Text style={styles.shopDistance}>{shop.distance}</Text>
          </View>
        </View>

        <Text style={styles.menuTitle}>Menus disponibles</Text>
        
        {shop.menus?.map((menu, index) => (
          <View key={index} style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <Text style={styles.menuItemTitle}>{menu.title}</Text>
              <Text style={styles.menuItemPrice}>{menu.price}€</Text>
              <Text style={styles.menuItemDetails}>
                {menu.remaining} restants • Récupération à {menu.pickupTime}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.reserveButton}
              onPress={() => handleReserve(menu)}
            >
              <MaterialIcons name="shopping-cart" size={20} color="#fff" />
              <Text style={styles.reserveButtonText}>Réserver</Text>
            </TouchableOpacity>
          </View>
        ))}

        {(!shop.menus || shop.menus.length === 0) && (
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
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  content: {
    flex: 1,
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
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  shopCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  shopDistance: {
    fontSize: 14,
    color: '#2d5a27',
    fontWeight: '600',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    color: '#2d5a27',
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  reserveButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reserveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyMenu: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyMenuText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyMenuSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  basketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  basketText: {
    color: '#2d5a27',
    fontSize: 14,
    fontWeight: '600',
  },
});
