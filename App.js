import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SwipeGestureWrapper from './SwipeGestureWrapper.js';
import ClientAuthScreen from './ClientAuthScreen.js';
import DealerRegistrationScreen from './DealerRegistrationScreen.js';
import DealerLoginScreen from './DealerLoginScreen.js';
import DealerHomeScreen from './DealerHomeScreen.js';
import DealerProfileScreen from './DealerProfileScreen.js';
import DealerOrdersScreen from './DealerOrdersScreen.js';
import LoginScreen from './LoginScreen.js';
import LocationPermissionScreen from './LocationPermissionScreen.js';
import NearbyOffersScreen from './NearbyOffersScreen.js';
import MapScreen from './MapScreen.js';
import MenuScreen from './MenuScreen.js';
import CreateBasketScreen from './CreateBasketScreen.js';
import BasketListScreen from './BasketListScreen.js';
import EditBasketScreen from './EditBasketScreen.js';
import OrderConfirmationScreen from './OrderConfirmationScreen.js';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('userType'); // 'userType' | 'clientAuth' | 'dealerReg' | 'dealerLogin' | 'locationPerm' | 'nearbyOffers' | 'map' | 'menus' | 'panier' | 'profil' | 'createBasket' | 'basketList' | 'editBasket'
  const [mapProps, setMapProps] = useState({ items: [], userLocation: null });
  const [menuProps, setMenuProps] = useState({ shop: null });
  const [userLocation, setUserLocation] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [createdBaskets, setCreatedBaskets] = useState([]);
  const [editingBasket, setEditingBasket] = useState(null);
  const [globalOffers, setGlobalOffers] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [reservations, setReservations] = useState([
    // Sample reservations for demo
    {
      id: 1,
      basketId: 1, // This should match a basket ID
      customerName: "Marie Dupont",
      customerPhone: "06 12 34 56 78",
      reservedAt: new Date().toISOString(),
      status: "reserved"
    },
    {
      id: 2,
      basketId: 2,
      customerName: "Jean Martin",
      customerPhone: "06 87 65 43 21",
      reservedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      status: "reserved"
    }
  ]);

  // Animation for smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isTransitioning, setIsTransitioning] = useState(false);

  const smoothNavigate = (newScreen) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsTransitioning(false);
    });
    
    setCurrentScreen(newScreen);
  };

  const handleClientSelection = () => {
    console.log('Client selected');
    setCurrentScreen('clientAuth');
  };

  const handleDealerSelection = () => {
    console.log('Dealer selected');
    setCurrentScreen('dealerLogin');
  };

  const handleBackToUserType = () => {
    setCurrentScreen('userType');
  };

  const handleAddToCart = (item) => {
    setCartItems(prev => [...prev, { ...item, id: Date.now(), reservedAt: new Date() }]);
  };

  const handleConfirmOrder = (phoneNumber, orderItems) => {
    const newOrder = {
      id: Date.now(),
      phoneNumber,
      items: orderItems,
      total: orderItems.reduce((sum, item) => sum + (item.price || 0), 0),
      status: 'confirmed',
      confirmedAt: new Date(),
    };
    
    setConfirmedOrders(prev => [...prev, newOrder]);
    setCartItems([]); // Clear cart after confirmation
    setCurrentScreen('nearbyOffers');
  };

  const handleDealerLoginSuccess = () => {
    smoothNavigate('dealerHome');
  };

  if (currentScreen === 'clientAuth') {
    return (
      <ClientAuthScreen
        onBack={handleBackToUserType}
        onLoginSuccess={(profile) => {
          // store profile if provided
          if (profile) setUserProfile(profile);
          setCurrentScreen('locationPerm');
        }}
      />
    );
  }
  if (currentScreen === 'dealerLogin') {
    return (
      <DealerLoginScreen
        onBack={handleBackToUserType}
        onGoToRegistration={() => setCurrentScreen('dealerReg')}
        onLoginSuccess={handleDealerLoginSuccess}
      />
    );
  }
  if (currentScreen === 'dealerHome') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <DealerHomeScreen
          onNavigateBaskets={() => smoothNavigate('basketList')}
          onNavigateOrders={() => smoothNavigate('dealerOrders')}
          onNavigateProfile={() => smoothNavigate('dealerProfile')}
          reservations={reservations}
          createdBaskets={createdBaskets}
        />
      </Animated.View>
    );
  }
  if (currentScreen === 'dealerProfile') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <DealerProfileScreen
          onNavigateHome={() => smoothNavigate('dealerHome')}
          onNavigateBaskets={() => smoothNavigate('basketList')}
          onNavigateOrders={() => smoothNavigate('dealerOrders')}
          onLogout={() => smoothNavigate('userType')}
        />
      </Animated.View>
    );
  }
  if (currentScreen === 'dealerOrders') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <DealerOrdersScreen
          onNavigateHome={() => smoothNavigate('dealerHome')}
          onNavigateBaskets={() => smoothNavigate('basketList')}
          onNavigateProfile={() => smoothNavigate('dealerProfile')}
          reservations={reservations}
          onUpdateReservations={(updatedReservations) => {
            setReservations(updatedReservations);
          }}
        />
      </Animated.View>
    );
  }
  if (currentScreen === 'dealerReg') {
    return (
      <DealerRegistrationScreen
        onBack={() => setCurrentScreen('dealerLogin')}
        onGoToLogin={() => setCurrentScreen('dealerLogin')}
        onBasketCreation={() => setCurrentScreen('basketList')}
      />
    );
  }
  if (currentScreen === 'locationPerm') {
    return (
      <LocationPermissionScreen
        onBack={handleBackToUserType}
        onGranted={(location) => {
          setUserLocation(location);
          setCurrentScreen('nearbyOffers');
        }}
        onSkip={() => setCurrentScreen('nearbyOffers')}
      />
    );
  }
  if (currentScreen === 'nearbyOffers') {
    return (
      <NearbyOffersScreen
        onBack={handleBackToUserType}
        userLocation={userLocation}
        createdBaskets={globalOffers}
        cartItems={cartItems}
        onRefresh={() => {
          // Here you'd typically re-fetch offers from backend or update location
          // For now, we just simulate a short refresh
          console.log('Refreshing nearby offers...');
        }}
        onOpenMap={(items, userLocation) => {
          setMapProps({ items, userLocation });
          setCurrentScreen('map');
        }}
        onRequestLocation={() => setCurrentScreen('locationPerm')}
        onOpenMenus={(shop) => {
          setMenuProps({ shop });
          setCurrentScreen('menus');
        }}
        onNavigateHome={() => setCurrentScreen('nearbyOffers')}
        onNavigatePanier={() => setCurrentScreen('panier')}
        onNavigateProfil={() => setCurrentScreen('profil')}
        onNavigateToOrderConfirmation={() => setCurrentScreen('orderConfirmation')}
      />
    );
  }
  if (currentScreen === 'map') {
    return (
      <MapScreen
        onBack={() => setCurrentScreen('nearbyOffers')}
        items={[...mapProps.items, ...globalOffers]}
        userLocation={mapProps.userLocation}
      />
    );
  }
  if (currentScreen === 'menus') {
    return (
      <MenuScreen 
        onBack={() => setCurrentScreen('nearbyOffers')} 
        shop={menuProps.shop} 
        onAddToCart={handleAddToCart}
        cartItems={cartItems}
        onNavigateToCart={() => setCurrentScreen('panier')}
      />
    );
  }
  if (currentScreen === 'createBasket') {
    return (
      <CreateBasketScreen
        onBack={() => smoothNavigate('dealerHome')}
        onBasketCreated={(basketData) => {
          // Convert basket data to offer format
          const newOffer = {
            id: Date.now(), // Add unique ID
            name: 'Mon Commerce', // This would come from dealer registration
            packs: 1,
            distance: '0.5 km', // This would be calculated based on location
            coords: { latitude: 33.586, longitude: -7.64 }, // This would come from dealer location
            category: 'Commerce Local',
            menus: [{
              title: basketData.name,
              price: basketData.price,
              remaining: typeof basketData.remaining === 'number' ? basketData.remaining : 1,
              pickupTime: basketData.collectionTime,
              collectionDate: basketData.collectionDate,
              image: basketData.image
            }],
            isCreatedBasket: true,
            createdAt: basketData.createdAt,
            // Store original basket data for the list
            basketData: {
              status: 'active',
              remaining: typeof basketData.remaining === 'number' ? basketData.remaining : 1,
              ...basketData,
            }
          };
          
          setCreatedBaskets(prev => [...prev, newOffer]);
          // Also add to global offers so clients can see it
          setGlobalOffers(prev => [...prev, newOffer]);
          console.log('Basket created:', basketData);
          Alert.alert('Succès', 'Votre panier a été créé avec succès!');
          smoothNavigate('dealerHome');
        }}
      />
    );
  }
  if (currentScreen === 'basketList') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <BasketListScreen
          onBack={() => smoothNavigate('dealerHome')}
          createdBaskets={createdBaskets}
          reservations={reservations}
          onNavigateHome={() => smoothNavigate('dealerHome')}
          onNavigateOrders={() => smoothNavigate('dealerOrders')}
          onNavigateProfile={() => smoothNavigate('dealerProfile')}
          onRefresh={() => {
            // Refresh the basket list
            console.log('Refreshing basket list...');
          }}
          onCreateBasket={() => smoothNavigate('createBasket')}
          onDeleteBasket={(basketId) => {
            setCreatedBaskets(prev => prev.filter(basket => basket.id !== basketId));
            // Also remove from global offers so clients can't see it anymore
            setGlobalOffers(prev => prev.filter(basket => basket.id !== basketId));
            Alert.alert('Succès', 'Panier supprimé avec succès!');
          }}
          onEditBasket={(basket) => {
            setEditingBasket(basket);
            smoothNavigate('editBasket');
          }}
          onToggleBasketStatus={(basketId) => {
            setCreatedBaskets(prev => prev.map(b => {
              if (b.id !== basketId) return b;
              const currentStatus = b.basketData?.status || 'active';
              const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
              return {
                ...b,
                basketData: { ...b.basketData, status: nextStatus }
              };
            }));
          }}
          onAdjustBasketQuantity={(basketId, delta) => {
            setCreatedBaskets(prev => prev.map(b => {
              if (b.id !== basketId) return b;
              const current = typeof (b.basketData?.remaining) === 'number' ? b.basketData.remaining : (b.menus?.[0]?.remaining || 1);
              const updated = Math.max(0, current + delta);
              const updatedMenus = (b.menus || []).map((m, idx) => idx === 0 ? { ...m, remaining: updated } : m);
              return {
                ...b,
                menus: updatedMenus,
                basketData: { ...b.basketData, remaining: updated }
              };
            }));
          }}
          onDuplicateBasket={(basketId) => {
            setCreatedBaskets(prev => {
              const original = prev.find(b => b.id === basketId);
              if (!original) return prev;
              const copy = {
                ...original,
                id: Date.now(),
                createdAt: new Date().toISOString(),
                basketData: {
                  ...original.basketData,
                  createdAt: new Date().toISOString(),
                  status: 'draft',
                },
              };
              return [copy, ...prev];
            });
            Alert.alert('Duplication', 'Panier dupliqué. Vous pouvez l’éditer maintenant.');
          }}
          onShareBasket={(basketId) => {
            const basket = createdBaskets.find(b => b.id === basketId);
            if (!basket) return;
            const title = basket.basketData?.name || basket.menus?.[0]?.title || 'Panier Obbo';
            const price = basket.basketData?.price ?? basket.menus?.[0]?.price;
            const shareText = `Découvrez mon panier "${title}" à ${price}€ sur Obbo. Disponible à la collecte ${basket.basketData?.collectionDate || ''} ${basket.basketData?.collectionTime || ''}.`;
            Alert.alert('Partager', shareText);
          }}
        />
      </Animated.View>
    );
  }
  if (currentScreen === 'editBasket') {
    return (
      <EditBasketScreen
        onBack={() => smoothNavigate('dealerHome')}
        basket={editingBasket}
        onBasketUpdated={(basketId, updatedData) => {
          const updatedBasket = {
            ...editingBasket,
            basketData: {
              ...editingBasket?.basketData,
              ...updatedData
            },
            menus: [{
              ...(editingBasket?.menus?.[0] || {}),
              title: updatedData.name,
              price: updatedData.price,
              pickupTime: updatedData.collectionTime,
              collectionDate: updatedData.collectionDate,
              image: updatedData.image
            }]
          };
          
          setCreatedBaskets(prev => prev.map(basket => 
            basket.id === basketId ? updatedBasket : basket
          ));
          // Also update global offers so clients see the updated version
          setGlobalOffers(prev => prev.map(basket => 
            basket.id === basketId ? updatedBasket : basket
          ));
          Alert.alert('Succès', 'Panier mis à jour avec succès!');
          smoothNavigate('dealerHome');
        }}
      />
    );
  }
  if (currentScreen === 'panier') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('nearbyOffers')} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Panier ({cartItems.length})</Text>
        </View>
        <View style={styles.content}>
          {cartItems.length === 0 ? (
            <View style={styles.emptyCartContainer}>
              <MaterialIcons name="shopping-cart" size={64} color="#ccc" />
              <Text style={styles.emptyCartTitle}>Votre panier est vide</Text>
              <Text style={styles.emptyCartSubtitle}>Ajoutez des produits depuis les offres disponibles</Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => setCurrentScreen('nearbyOffers')}
              >
                <Text style={styles.browseButtonText}>Parcourir les offres</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.cartContainer} showsVerticalScrollIndicator={false}>
              {(() => {
                // Group items by shop/market
                const groupedItems = cartItems.reduce((groups, item, index) => {
                  const shopName = item.shopName || 'Autre';
                  if (!groups[shopName]) {
                    groups[shopName] = [];
                  }
                  groups[shopName].push({ ...item, originalIndex: index });
                  return groups;
                }, {});

                const marketNames = Object.keys(groupedItems);
                
                // Set default selected market if none selected
                if (!selectedMarket && marketNames.length > 0) {
                  setSelectedMarket(marketNames[0]);
                }

                return (
                  <View>
                    {/* Horizontal Market Tabs */}
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.marketTabsContainer}
                      contentContainerStyle={styles.marketTabsContent}
                    >
                      {marketNames.map((marketName) => (
                        <TouchableOpacity
                          key={marketName}
                          style={[
                            styles.marketTab,
                            selectedMarket === marketName && styles.activeMarketTab
                          ]}
                          onPress={() => setSelectedMarket(marketName)}
                        >
                          <MaterialIcons 
                            name="store" 
                            size={16} 
                            color={selectedMarket === marketName ? '#fff' : '#2d5a27'} 
                          />
                          <Text style={[
                            styles.marketTabText,
                            selectedMarket === marketName && styles.activeMarketTabText
                          ]}>
                            {marketName}
                          </Text>
                          <View style={[
                            styles.marketTabBadge,
                            selectedMarket === marketName && styles.activeMarketTabBadge
                          ]}>
                            <Text style={[
                              styles.marketTabBadgeText,
                              selectedMarket === marketName && styles.activeMarketTabBadgeText
                            ]}>
                              {groupedItems[marketName].length}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Items for Selected Market */}
                    {selectedMarket && groupedItems[selectedMarket] && (
                      <View style={styles.selectedMarketItems}>
                        {groupedItems[selectedMarket].map((item) => (
                          <View key={item.id} style={styles.cartItem}>
                            <View style={styles.cartItemImage}>
                              <Image source={require('./assets/obbo.png')} style={styles.cartItemLogo} resizeMode="contain" />
                            </View>
                            <View style={styles.cartItemInfo}>
                              <Text style={styles.cartItemTitle}>{item.title || item.name}</Text>
                              <Text style={styles.cartItemCategory}>{item.category || 'Menu'}</Text>
                              <Text style={styles.cartItemPacks}>Prix: {item.price}€</Text>
                              <Text style={styles.cartItemTime}>
                                Réservé à {item.reservedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </View>
                            <TouchableOpacity 
                              style={styles.removeButton}
                              onPress={() => setCartItems(prev => prev.filter((_, i) => i !== item.originalIndex))}
                            >
                              <MaterialIcons name="close" size={20} color="#ff4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}
              <TouchableOpacity 
                style={styles.checkoutButton}
                onPress={() => setCurrentScreen('orderConfirmation')}
              >
                <Text style={styles.checkoutButtonText}>Finaliser la commande</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
        
        {/* Bottom header */}
        <View style={styles.bottomHeader}>
          <TouchableOpacity style={styles.headerItem} onPress={() => setCurrentScreen('nearbyOffers')}>
            <MaterialIcons name="home" size={22} color="#2d5a27" />
            <Text style={styles.headerItemText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerItem, styles.activeHeaderItem]} onPress={() => setCurrentScreen('panier')}>
            <MaterialIcons name="shopping-cart" size={22} color="#fff" />
            <Text style={styles.activeHeaderItemText}>Panier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerItem} onPress={() => setCurrentScreen('profil')}>
            <MaterialIcons name="person" size={22} color="#2d5a27" />
            <Text style={styles.headerItemText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  if (currentScreen === 'profil') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('nearbyOffers')} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.profileContainer}>
            <View style={styles.profileAvatar}>
              <MaterialIcons name="person" size={48} color="#2d5a27" />
            </View>
            <Text style={styles.profileName}>{userProfile?.name || userProfile?.given_name || 'Utilisateur Obbo'}</Text>
            <Text style={styles.profileEmail}>{userProfile?.email || userProfile?.email_address || 'user@obbo.com'}</Text>
            
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Commandes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Paniers sauvés</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>

            <View style={styles.profileMenu}>
              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="history" size={24} color="#2d5a27" />
                <Text style={styles.menuText}>Historique des commandes</Text>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="favorite" size={24} color="#2d5a27" />
                <Text style={styles.menuText}>Favoris</Text>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="notifications" size={24} color="#2d5a27" />
                <Text style={styles.menuText}>Notifications</Text>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="settings" size={24} color="#2d5a27" />
                <Text style={styles.menuText}>Paramètres</Text>
                <MaterialIcons name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Bottom header */}
        <View style={styles.bottomHeader}>
          <TouchableOpacity style={styles.headerItem} onPress={() => setCurrentScreen('nearbyOffers')}>
            <MaterialIcons name="home" size={22} color="#2d5a27" />
            <Text style={styles.headerItemText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerItem} onPress={() => setCurrentScreen('panier')}>
            <MaterialIcons name="shopping-cart" size={22} color="#2d5a27" />
            <Text style={styles.headerItemText}>Panier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerItem, styles.activeHeaderItem]} onPress={() => setCurrentScreen('profil')}>
            <MaterialIcons name="person" size={22} color="#fff" />
            <Text style={styles.activeHeaderItemText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  if (currentScreen === 'orderConfirmation') {
    return (
      <OrderConfirmationScreen
        onBack={() => setCurrentScreen('panier')}
        cartItems={cartItems}
        onConfirmOrder={handleConfirmOrder}
      />
    );
  }

  const handleSwipeRight = () => {
    // Handle swipe right to go back based on current screen
    switch (currentScreen) {
      case 'clientAuth':
      case 'dealerReg':
      case 'dealerLogin':
        setCurrentScreen('userType');
        break;
      case 'locationPerm':
        setCurrentScreen('userType');
        break;
      case 'nearbyOffers':
        // No back action for main screen
        break;
      case 'map':
        setCurrentScreen('nearbyOffers');
        break;
      case 'menus':
        setCurrentScreen('nearbyOffers');
        break;
      case 'panier':
        setCurrentScreen('nearbyOffers');
        break;
      case 'profil':
        setCurrentScreen('nearbyOffers');
        break;
      case 'createBasket':
        setCurrentScreen('basketList');
        break;
      case 'basketList':
        setCurrentScreen('dealerReg');
        break;
      case 'editBasket':
        setCurrentScreen('basketList');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Welcome Text */}
      <Text style={styles.welcomeText}>Bienvenue sur Obbo</Text>
    
           {/* Shopping Bag Image */}
     <View style={styles.imageContainer}>
       <Image
         source={require('./assets/obbo.png')}
         style={styles.image}
         resizeMode="contain"
       />
     </View>
     
     {/* Selection Text */}
     <Text style={styles.selectionText}>Qui êtes-vous ?</Text>
     
             {/* User Type Options */}
      <View style={styles.optionsContainer}>
        {/* Client Option */}
        <TouchableOpacity style={styles.optionButton} onPress={handleClientSelection}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="person" size={30} color="#ffffff" />
          </View>
          <Text style={styles.optionTitle}>Client</Text>
          <Text style={styles.optionDescription}>Je veux acheter des produits</Text>
        </TouchableOpacity>
        
        {/* Dealer Option */}
        <TouchableOpacity style={styles.optionButton} onPress={handleDealerSelection}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="store" size={30} color="#ffffff" />
          </View>
          <Text style={styles.optionTitle}>Commerçant</Text>
          <Text style={styles.optionDescription}>Je veux vendre mes produits</Text>
        </TouchableOpacity>
      </View>
   </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  image: {
    width: 250,
    height: 300,
  },
  selectionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 40,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  optionButton: {
    backgroundColor: '#2d5a27',
    borderWidth: 0,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    marginHorizontal: 5,
  },
  iconContainer: {
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Bottom header styles
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
  // Empty cart styles
  emptyCartContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#2d5a27',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Profile styles
  profileContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d5a27',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  profileMenu: {
    width: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  // Cart styles
  cartContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cartItemImage: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cartItemLogo: {
    width: 40,
    height: 40,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cartItemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cartItemPacks: {
    fontSize: 14,
    color: '#2d5a27',
    fontWeight: '600',
    marginBottom: 2,
  },
  cartItemTime: {
    fontSize: 12,
    color: '#999',
  },
  removeButton: {
    padding: 8,
  },
  checkoutButton: {
    backgroundColor: '#2d5a27',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Horizontal Market Tabs styles
  marketTabsContainer: {
    marginBottom: 16,
  },
  marketTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  marketTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
    minWidth: 120,
  },
  activeMarketTab: {
    backgroundColor: '#2d5a27',
    borderColor: '#2d5a27',
  },
  marketTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d5a27',
    flex: 1,
  },
  activeMarketTabText: {
    color: '#fff',
  },
  marketTabBadge: {
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeMarketTabBadge: {
    backgroundColor: '#fff',
  },
  marketTabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d5a27',
  },
  activeMarketTabBadgeText: {
    color: '#2d5a27',
  },
  selectedMarketItems: {
    paddingHorizontal: 16,
  },
});
