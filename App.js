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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Linking } from 'react-native';
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
import SafeAreaWrapper from './utils/SafeAreaWrapper';

// --- Inline small placeholders for client profile targets ---
function OrdersPlaceholder({ onBack, orders }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes commandes</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {(!orders || orders.length === 0) ? (
          <Text style={styles.placeholderText}>Vous n'avez aucune commande pour le moment.</Text>
        ) : orders.map(o => (
          <View key={o.id} style={{ padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10 }}>
            <Text style={{ fontWeight: '700' }}>#{o.id} — {o.total?.toFixed ? o.total.toFixed(2) : o.total} DH</Text>
            <Text style={{ color: '#666', marginTop: 6 }}>{o.status}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Top-level wrapper to ensure keyboard doesn't hide content on iOS/Android
export default function App() {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
    >
      <SafeAreaWrapper>
        <AppInner />
      </SafeAreaWrapper>
    </KeyboardAvoidingView>
  );
}

function SimplePlaceholder({ title, onBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={[styles.content, { paddingHorizontal: 20 }]}> 
        <Text style={styles.placeholderText}>Cette page est temporaire — implémentez la logique réelle plus tard.</Text>
      </View>
    </SafeAreaView>
  );
}

function LegalPlaceholder({ title, content, onBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <ScrollView style={{ padding: 16 }}>
        <Text style={{ color: '#333', lineHeight: 20 }}>{content || 'Contenu temporaire. Remplacez par votre texte légal.'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function EditProfileScreen({ profile, onSave, onBack }) {
  // lightweight edit: toggles the display name only
  const [name, setName] = React.useState(profile?.name || '');

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
      </View>
      <View style={{ padding: 20 }}>
        <Text style={{ marginBottom: 8, color: '#444' }}>Nom</Text>
        <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => { /* focus input — keep simple */ }}>
            <Text>{name || '—'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.checkoutButton, { paddingVertical: 12 }]} onPress={() => { onSave({ ...profile, name }); onBack(); }}>
          <Text style={styles.checkoutButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function AppInner() {
  const [currentScreen, setCurrentScreen] = useState('userType'); // 'userType' | 'clientAuth' | 'dealerReg' | 'dealerLogin' | 'locationPerm' | 'nearbyOffers' | 'map' | 'menus' | 'panier' | 'profil' | 'createBasket' | 'basketList' | 'editBasket'
  const [mapProps, setMapProps] = useState({ items: [], userLocation: null });
  const [mapSaveHandler, setMapSaveHandler] = useState(null);
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

  // Dynamically load Vercel Analytics only on web (safe for React Native)
  const [WebAnalyticsComp, setWebAnalyticsComp] = useState(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return; // only for web builds

    let mounted = true;
    (async () => {
      try {
        // Try the Next-specific entry first (per your request)
        const mod = await import('@vercel/analytics/next');
        if (mounted && mod && (mod.Analytics || mod.default)) {
          setWebAnalyticsComp(() => mod.Analytics || mod.default);
          return;
        }
      } catch (err) {
        // ignore and try fallback
      }

      try {
        // Fallback to main package if available
        const mod2 = await import('@vercel/analytics');
        if (mounted && mod2 && (mod2.Analytics || mod2.default)) {
          setWebAnalyticsComp(() => mod2.Analytics || mod2.default);
          return;
        }
      } catch (err) {
        console.warn('Vercel Analytics not available in this environment:', err.message || err);
      }
    })();

    return () => { mounted = false; };
  }, []);

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
    // Ask user to enable location first
    setCurrentScreen('locationPerm');
  };

  const handleDealerSelection = () => {
    console.log('Dealer selected');
    // Route to dealer login/registration flow
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

  // Client profile actions
  const handleViewHistory = () => {
    if (!confirmedOrders || confirmedOrders.length === 0) {
      Alert.alert('Historique', 'Vous n\'avez pas encore de commandes.');
      return;
    }
    // Build a short summary of orders
  const list = confirmedOrders.map(o => `#${o.id} — ${o.total?.toFixed ? o.total.toFixed(2) : o.total} DH`).join('\n');
    Alert.alert('Historique des commandes', list, [{ text: 'Fermer' }]);
  };

  const handleFavorites = () => {
    Alert.alert(
      'Favoris',
      'La page des favoris n\'est pas encore implémentée.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Parcourir les offres', onPress: () => setCurrentScreen('nearbyOffers') }
      ]
    );
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Aucune notification pour le moment.');
  };

  const handleSettings = () => {
    Alert.alert('Paramètres', 'Les paramètres ne sont pas disponibles dans cette version.');
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
  // Placeholder targets for client profile actions
  if (currentScreen === 'orders') {
    return (
      <OrdersPlaceholder onBack={() => setCurrentScreen('profil')} orders={confirmedOrders} />
    );
  }
  if (currentScreen === 'favorites') {
    return (
      <SimplePlaceholder title="Favoris" onBack={() => setCurrentScreen('profil')} />
    );
  }
  if (currentScreen === 'faq') {
    return (
      <LegalPlaceholder title="FAQ" content={'Q: Comment ça marche ?\nR: ...\n\nQ: Comment contacter le support ?\nR: ...'} onBack={() => setCurrentScreen('profil')} />
    );
  }
  if (currentScreen === 'terms') {
    return (
      <LegalPlaceholder title="Conditions & Utilisation" content={null} onBack={() => setCurrentScreen('profil')} />
    );
  }
  if (currentScreen === 'privacy') {
    return (
      <LegalPlaceholder title="Politique de confidentialité" content={null} onBack={() => setCurrentScreen('profil')} />
    );
  }
  if (currentScreen === 'settings') {
    return (
      <SimplePlaceholder title="Paramètres" onBack={() => setCurrentScreen('profil')} />
    );
  }
  if (currentScreen === 'notifications') {
    return (
      <SimplePlaceholder title="Notifications" onBack={() => setCurrentScreen('profil')} />
    );
  }
  if (currentScreen === 'editProfile') {
    return (
      <EditProfileScreen profile={userProfile} onSave={(p) => setUserProfile(p)} onBack={() => setCurrentScreen('profil')} />
    );
  }
  if (currentScreen === 'map') {
    return (
      <MapScreen
        onBack={() => setCurrentScreen('profil')}
        items={[...mapProps.items, ...globalOffers]}
        userLocation={mapProps.userLocation || userLocation}
        onSaveLocation={mapSaveHandler}
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
        dealerProfile={userProfile}
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
            const shareText = `Découvrez mon panier "${title}" à ${price} DH sur Obbo. Disponible à la collecte ${basket.basketData?.collectionDate || ''} ${basket.basketData?.collectionTime || ''}.`;
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
          <Text style={styles.headerTitle}>Mon Panier</Text>
          <Text style={styles.smallCount}>{cartItems.length} article{cartItems.length > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.content}>
          {cartItems.length === 0 ? (
            <View style={styles.emptyCartContainerNew}>
              <MaterialIcons name="remove-shopping-cart" size={84} color="#e0e0e0" />
              <Text style={styles.emptyCartTitle}>Votre panier est vide</Text>
              <Text style={styles.emptyCartSubtitle}>Ajoutez des produits depuis les offres pour les réserver.</Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => setCurrentScreen('nearbyOffers')}
              >
                <Text style={styles.browseButtonText}>Parcourir les offres</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cartLayout}>
              <ScrollView style={styles.cartList} contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
                {/* Group items by shop/market */}
                {(() => {
                  const groupedItems = cartItems.reduce((groups, item, index) => {
                    const shopName = item.shopName || item.name || 'Autre';
                    if (!groups[shopName]) groups[shopName] = [];
                    groups[shopName].push({ ...item, originalIndex: index });
                    return groups;
                  }, {});

                  const marketNames = Object.keys(groupedItems);
                  if (!selectedMarket && marketNames.length > 0) setSelectedMarket(marketNames[0]);

                  return marketNames.map((marketName) => (
                    <View key={marketName} style={styles.marketGroup}>
                      <View style={styles.marketHeaderRow}>
                        <Text style={styles.marketTitle}>{marketName}</Text>
                        <Text style={styles.marketCount}>{groupedItems[marketName].length} article{groupedItems[marketName].length > 1 ? 's' : ''}</Text>
                      </View>

                      {groupedItems[marketName].map((item) => (
                        <View key={item.id || item.originalIndex} style={styles.cartCard}>
                          <Image source={require('./assets/obbo.png')} style={styles.cardImage} />
                          <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>{item.title || item.name}</Text>
                            <Text style={styles.cardMeta}>{item.category || 'Menu'} • Réservé {new Date(item.reservedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                            <View style={styles.cardRow}>
                              <Text style={styles.cardPrice}>{(item.price ?? item.price) + ' DH'}</Text>
                              <View style={styles.qtyControls}>
                                <TouchableOpacity onPress={() => {
                                  // decrease quantity by removing one instance (simple approach)
                                  let removed = false;
                                  setCartItems(prev => prev.filter((v, i) => {
                                    if (!removed && i === item.originalIndex) { removed = true; return false; }
                                    return true;
                                  }));
                                }} style={styles.qtyBtn}>
                                  <MaterialIcons name="remove" size={18} color="#2d5a27" />
                                </TouchableOpacity>
                                <View style={styles.qtyValue}><Text style={styles.qtyText}>1</Text></View>
                                <TouchableOpacity onPress={() => setCartItems(prev => [...prev, { ...item, id: Date.now(), reservedAt: new Date() }])} style={[styles.qtyBtn, styles.qtyPlusBtn]}>
                                  <MaterialIcons name="add" size={18} color="#fff" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                          <TouchableOpacity style={styles.removeButton} onPress={() => setCartItems(prev => prev.filter((_, i) => i !== item.originalIndex))}>
                            <MaterialIcons name="close" size={18} color="#999" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ));
                })()}
              </ScrollView>

              {/* Sticky summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Sous-total</Text>
                  <Text style={styles.summaryValue}>{cartItems.reduce((s, it) => s + (Number(it.price) || 0), 0).toFixed(2)} DH</Text>
                </View>
                <View style={styles.summaryRowMuted}>
                  <Text style={styles.feeText}>Frais de service</Text>
                  <Text style={styles.feeValue}>0.00 DH</Text>
                </View>
                <TouchableOpacity style={styles.checkoutButton} onPress={() => setCurrentScreen('orderConfirmation')}>
                  <Text style={styles.checkoutButtonText}>Finaliser la commande</Text>
                </TouchableOpacity>
              </View>
            </View>
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
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setCurrentScreen('nearbyOffers')} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => setCurrentScreen('editProfile')}>
            <MaterialIcons name="edit" size={20} color="#2d5a27" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.profileHeader}>
            <View style={styles.cover} />
            <View style={styles.avatarWrap}>
              <View style={styles.profileAvatarLarge}>
                <MaterialIcons name="person" size={56} color="#fff" />
              </View>
              <View style={styles.nameBlock}>
                <Text style={styles.profileNameLarge}>{userProfile?.name || userProfile?.given_name || 'Utilisateur Obbo'}</Text>
                <Text style={styles.profileEmail}>{userProfile?.email || userProfile?.email_address || 'user@obbo.com'}</Text>
              </View>
            </View>

            <View style={styles.connectedRow}>
              <View style={styles.connectedBadge}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connecté</Text>
              </View>
              <TouchableOpacity style={styles.profileAction} onPress={() => setCurrentScreen('notifications')}>
                <MaterialIcons name="notifications" size={20} color="#2d5a27" />
                <Text style={styles.profileActionText}>Notifications</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statCardNumber}>0</Text>
              <Text style={styles.statCardLabel}>Commandes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardNumber}>0</Text>
              <Text style={styles.statCardLabel}>Paniers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardNumber}>0</Text>
              <Text style={styles.statCardLabel}>Points</Text>
            </View>
          </View>

          <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuCard} onPress={() => setCurrentScreen('orders') || smoothNavigate('orders')}>
              <View style={styles.menuLeft}> 
                <MaterialIcons name="history" size={22} color="#2d5a27" />
                <Text style={styles.menuText}>Historique des commandes</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={() => setCurrentScreen('favorites') || smoothNavigate('favorites')}>
              <View style={styles.menuLeft}> 
                <MaterialIcons name="favorite" size={22} color="#2d5a27" />
                <Text style={styles.menuText}>Favoris</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#999" />
            </TouchableOpacity>

            {/* Addresses removed per request */}

            {/* Payment methods removed per request */}

            <TouchableOpacity style={styles.menuCard} onPress={() => setCurrentScreen('faq') || smoothNavigate('faq')}>
              <View style={styles.menuLeft}> 
                <MaterialIcons name="help" size={22} color="#2d5a27" />
                <Text style={styles.menuText}>FAQ</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={() => setCurrentScreen('terms') || smoothNavigate('terms')}>
              <View style={styles.menuLeft}> 
                <MaterialIcons name="description" size={22} color="#2d5a27" />
                <Text style={styles.menuText}>Conditions &amp; Utilisation</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={() => setCurrentScreen('privacy') || smoothNavigate('privacy')}>
              <View style={styles.menuLeft}> 
                <MaterialIcons name="lock" size={22} color="#2d5a27" />
                <Text style={styles.menuText}>Politique de confidentialité</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={async () => {
              const storeUrl = Platform.OS === 'ios' ? 'https://apps.apple.com/app/idYOUR_APP_ID' : 'https://play.google.com/store/apps/details?id=YOUR_APP_ID';
              try {
                const can = await Linking.canOpenURL(storeUrl);
                if (can) {
                  await Linking.openURL(storeUrl);
                  return;
                }
              } catch (e) {
                // ignore
              }
              Alert.alert('Noter l\'application', 'Veuillez noter l\'application sur la boutique correspondante.');
            }}>
              <View style={styles.menuLeft}> 
                <MaterialIcons name="star-rate" size={22} color="#2d5a27" />
                <Text style={styles.menuText}>Noter l'application</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCard} onPress={() => setCurrentScreen('settings') || smoothNavigate('settings')}>
              <View style={styles.menuLeft}> 
                <MaterialIcons name="settings" size={22} color="#2d5a27" />
                <Text style={styles.menuText}>Paramètres</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  'Se déconnecter',
                  'Voulez-vous vous déconnecter ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Oui', onPress: () => { setUserProfile(null); setCartItems([]); setCurrentScreen('userType'); } }
                  ]
                );
              }}
            >
              <MaterialIcons name="exit-to-app" size={20} color="#ff4444" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
      {/* Vercel Analytics - only rendered on web when the module is available */}
      {WebAnalyticsComp ? <WebAnalyticsComp /> : null}
      
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe6e6',
    backgroundColor: '#fff7f7',
  },
  logoutText: {
    color: '#ff4444',
    fontWeight: '700',
    marginLeft: 8,
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
    marginBottom: 50,
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
  smallCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontWeight: '600',
  },
  /* New cart styles */
  cartLayout: {
    flex: 1,
    width: '100%',
  },
  cartList: {
    flex: 1,
    width: '100%',
  },
  marketGroup: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  marketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  marketCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  /* Profile modern styles */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  editButton: {
    marginLeft: 'auto',
  },
  profileHeader: {
    backgroundColor: '#fff',
  },
  cover: {
    height: 90,
    backgroundColor: '#e8f5e8',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  avatarWrap: {
    marginTop: -40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarLarge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#2d5a27',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  nameBlock: {
    marginLeft: 16,
  },
  profileNameLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2d5a27',
    marginRight: 8,
  },
  connectedText: {
    color: '#2d5a27',
    fontWeight: '600',
  },
  profileAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileActionText: {
    color: '#2d5a27',
    marginLeft: 8,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    elevation: 1,
  },
  statCardNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d5a27',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuList: {
    marginTop: 18,
    paddingHorizontal: 10,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d5a27',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  qtyBtn: {
    backgroundColor: '#e8f5e8',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPlusBtn: {
    backgroundColor: '#2d5a27',
    paddingHorizontal: 8,
  },
  qtyValue: {
    minWidth: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
  },
  qtyText: {
    fontWeight: '700',
    color: '#2d5a27',
  },
  summaryCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#666',
    fontWeight: '600',
  },
  summaryValue: {
    fontWeight: '800',
    color: '#2d5a27',
    fontSize: 16,
  },
  summaryRowMuted: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeText: {
    color: '#999',
    fontSize: 12,
  },
  feeValue: {
    color: '#999',
    fontSize: 12,
  },
  emptyCartContainerNew: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
});
