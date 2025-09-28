import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

export default function MapScreen({ onBack, items = [], userLocation }) {
  const [region, setRegion] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  // Function to calculate distance between two coordinates
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

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La localisation est nécessaire pour utiliser la carte');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      
      const { latitude, longitude } = location.coords;
      setRegion({ 
        latitude, 
        longitude, 
        latitudeDelta: 0.01, 
        longitudeDelta: 0.01 
      });

      // Calculate distances and sort nearby places
      const placesWithDistance = items
        .filter(item => item.coords)
        .map(item => ({
          ...item,
          distance: calculateDistance(
            latitude, 
            longitude, 
            item.coords.latitude, 
            item.coords.longitude
          )
        }))
        .sort((a, b) => a.distance - b.distance);

      setNearbyPlaces(placesWithDistance);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre localisation');
    }
  };

  // Center map on user location
  const centerOnUserLocation = () => {
    if (currentLocation?.coords) {
      const { latitude, longitude } = currentLocation.coords;
      setRegion({ 
        latitude, 
        longitude, 
        latitudeDelta: 0.01, 
        longitudeDelta: 0.01 
      });
    } else {
      getCurrentLocation();
    }
  };

  // Filter places based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlaces(nearbyPlaces);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = nearbyPlaces.filter(place => 
        place.name.toLowerCase().includes(query) || 
        place.category.toLowerCase().includes(query)
      );
      setFilteredPlaces(filtered);
    }
  }, [searchQuery, nearbyPlaces]);

  useEffect(() => {
    if (userLocation?.coords) {
      setCurrentLocation(userLocation);
      const { latitude, longitude } = userLocation.coords;
      setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      
      // Calculate distances for nearby places
      const placesWithDistance = items
        .filter(item => item.coords)
        .map(item => ({
          ...item,
          distance: calculateDistance(
            latitude, 
            longitude, 
            item.coords.latitude, 
            item.coords.longitude
          )
        }))
        .sort((a, b) => a.distance - b.distance);

      setNearbyPlaces(placesWithDistance);
    } else if (items.length > 0 && items[0].coords) {
      const { latitude, longitude } = items[0].coords;
      setRegion({ latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      setNearbyPlaces(items);
    } else {
      // Try to get current location if no userLocation provided
      getCurrentLocation();
    }
  }, [userLocation, items]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Carte des magasins</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.searchButton}>
            <MaterialIcons name="search" size={20} color="#2d5a27" />
          </TouchableOpacity>
          <TouchableOpacity onPress={centerOnUserLocation} style={styles.locationButton}>
            <MaterialIcons name="my-location" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un magasin..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => setShowSearch(false)} style={styles.closeSearchButton}>
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Store List */}
      {showSearch && filteredPlaces.length > 0 && (
        <View style={styles.storeListContainer}>
          <ScrollView style={styles.storeList} showsVerticalScrollIndicator={false}>
            {filteredPlaces.map((place, index) => (
              <TouchableOpacity 
                key={place.name} 
                style={styles.storeItem}
                onPress={() => {
                  if (place.coords) {
                    setRegion({
                      latitude: place.coords.latitude,
                      longitude: place.coords.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01
                    });
                    setShowSearch(false);
                  }
                }}
              >
                <View style={styles.storeItemInfo}>
                  <Text style={styles.storeItemName}>{place.name}</Text>
                  <Text style={styles.storeItemCategory}>{place.category}</Text>
                  <Text style={styles.storeItemDistance}>
                    {place.distance ? `${place.distance.toFixed(1)} km` : 'Distance inconnue'}
                  </Text>
                </View>
                <MaterialIcons name="location-on" size={20} color="#2d5a27" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={styles.mapContainer}>
        {region && (
          <MapView style={styles.map} initialRegion={region}>
            {/* User location marker */}
            {(userLocation?.coords || currentLocation?.coords) && (
              <Marker
                coordinate={{
                  latitude: (userLocation?.coords || currentLocation?.coords).latitude,
                  longitude: (userLocation?.coords || currentLocation?.coords).longitude,
                }}
                title="Vous êtes ici"
                pinColor="#2d5a27"
              />
            )}
            
            {/* Store markers */}
            {nearbyPlaces.map((place, index) => {
              if (!place.coords) return null;
              
              // Different colors for created baskets vs regular places
              const isCreatedBasket = place.isCreatedBasket;
              const markerColor = isCreatedBasket ? "#ff6b35" : (index < 3 ? "#ff6b35" : "#4a90e2");
              
              return (
                <Marker
                  key={place.name}
                  coordinate={{ 
                    latitude: place.coords.latitude, 
                    longitude: place.coords.longitude 
                  }}
                  pinColor={markerColor}
                >
                  <Callout style={styles.callout}>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{place.name}</Text>
                      <Text style={styles.calloutCategory}>{place.category}</Text>
                      <Text style={styles.calloutInfo}>
                        {place.packs} packs disponibles
                      </Text>
                      <Text style={styles.calloutDistance}>
                        {place.distance ? `${place.distance.toFixed(1)} km` : 'Distance inconnue'}
                      </Text>
                      {isCreatedBasket && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>Nouveau!</Text>
                        </View>
                      )}
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>
        )}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backText: {
    color: '#2d5a27',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  locationButton: {
    padding: 8,
    backgroundColor: '#2d5a27',
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  closeSearchButton: {
    padding: 8,
    marginLeft: 8,
  },
  storeListContainer: {
    position: 'absolute',
    top: 120,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 300,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  storeList: {
    maxHeight: 300,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storeItemInfo: {
    flex: 1,
  },
  storeItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  storeItemCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  storeItemDistance: {
    fontSize: 12,
    color: '#2d5a27',
    marginTop: 2,
  },
  callout: {
    width: 200,
  },
  calloutContainer: {
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  calloutCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  calloutInfo: {
    fontSize: 12,
    color: '#2d5a27',
    marginBottom: 2,
  },
  calloutDistance: {
    fontSize: 12,
    color: '#666',
  },
  newBadge: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});