import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function OrderConfirmationScreen({ onBack, cartItems = [], onConfirmOrder }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Group items by market/shop
  const groupedItems = cartItems.reduce((groups, item, index) => {
    const shopName = item.shopName || 'Autre';
    if (!groups[shopName]) {
      groups[shopName] = [];
    }
    groups[shopName].push({ ...item, originalIndex: index });
    return groups;
  }, {});

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  const handleConfirmOrder = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    if (phoneNumber.length < 10) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setIsConfirming(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Commande confirmée!',
        `Votre commande a été confirmée avec le numéro ${phoneNumber}. Vous recevrez un SMS de confirmation.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onConfirmOrder?.(phoneNumber, cartItems);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la confirmation');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmer ma commande</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Phone Number Input */}
        <View style={styles.phoneSection}>
          <Text style={styles.sectionTitle}>Numéro de téléphone</Text>
          <Text style={styles.sectionSubtitle}>Nous vous enverrons un SMS de confirmation</Text>
          <View style={styles.phoneInputContainer}>
            <MaterialIcons name="phone" size={20} color="#2d5a27" />
            <TextInput
              style={styles.phoneInput}
              placeholder="Votre numéro de téléphone"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.orderSection}>
          <Text style={styles.sectionTitle}>Récapitulatif de votre commande</Text>
          
          {Object.entries(groupedItems).map(([shopName, items]) => (
            <View key={shopName} style={styles.marketSection}>
              <View style={styles.marketHeader}>
                <MaterialIcons name="store" size={16} color="#2d5a27" />
                <Text style={styles.marketName}>{shopName}</Text>
                <Text style={styles.marketItemCount}>({items.length} article{items.length > 1 ? 's' : ''})</Text>
              </View>
              
              {items.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={styles.itemImage}>
                    <MaterialIcons name="shopping-basket" size={20} color="#2d5a27" />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title || item.name}</Text>
                    <Text style={styles.itemCategory}>{item.category || 'Menu'}</Text>
                    <Text style={styles.itemTime}>
                      Réservé à {item.reservedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>{item.price}€</Text>
                </View>
              ))}
            </View>
          ))}

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{calculateTotal().toFixed(2)}€</Text>
            </View>
            <Text style={styles.totalNote}>Frais de service inclus</Text>
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity 
          style={[styles.confirmButton, isConfirming && styles.confirmButtonDisabled]} 
          onPress={handleConfirmOrder}
          disabled={isConfirming}
        >
          {isConfirming ? (
            <Text style={styles.confirmButtonText}>Confirmation en cours...</Text>
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirmer ma commande</Text>
            </>
          )}
        </TouchableOpacity>
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
  phoneSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  phoneInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  orderSection: {
    marginBottom: 24,
  },
  marketSection: {
    marginBottom: 16,
  },
  marketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  marketName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d5a27',
    flex: 1,
  },
  marketItemCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  itemImage: {
    width: 40,
    height: 40,
    backgroundColor: '#e8f5e8',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 11,
    color: '#999',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5a27',
  },
  totalSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d5a27',
  },
  totalNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#2d5a27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

