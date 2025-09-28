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

export default function BasketListScreen({ onBack, createdBaskets = [], onRefresh, onCreateBasket, onDeleteBasket, onEditBasket }) {
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
              return (
                <View key={basket.id || index} style={styles.basketCard}>
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
                    <Text style={styles.basketName}>{basketData.name}</Text>
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
                    </View>
                    <Text style={styles.createdDate}>
                      Créé le {formatDate(basketData.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.basketActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEditBasket(basket)}
                    >
                      <MaterialIcons name="edit" size={20} color="#2d5a27" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteBasket(basket.id)}
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
        <MaterialIcons name="add" size={24} color="#fff" />
        <Text style={styles.createButtonText}>Créer un nouveau panier</Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#ffe6e6',
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#2d5a27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
