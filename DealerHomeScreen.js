import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function DealerHomeScreen({ onNavigateBaskets, onNavigateOrders, onNavigateProfile, reservations = [], createdBaskets = [] }) {
  const totalReservations = reservations.length;
  const totalBaskets = createdBaskets.length;
  const availableBaskets = totalBaskets - totalReservations;

  const stats = [
    {
      title: 'Paniers créés',
      value: totalBaskets,
      icon: 'shopping-basket',
      color: '#2d5a27',
    },
    {
      title: 'Réservations',
      value: totalReservations,
      icon: 'notifications',
      color: '#ff6b35',
    },
    {
      title: 'Disponibles',
      value: availableBaskets,
      icon: 'check-circle',
      color: '#4caf50',
    },
  ];

  const quickActions = [
    {
      title: 'Mes Paniers',
      subtitle: 'Gérer mes paniers',
      icon: 'shopping-basket',
      color: '#2d5a27',
      onPress: onNavigateBaskets,
    },
    {
      title: 'Commandes',
      subtitle: `${totalReservations} nouvelle(s)`,
      icon: 'notifications',
      color: '#ff6b35',
      onPress: onNavigateOrders,
      badge: totalReservations > 0,
    },
    {
      title: 'Profil',
      subtitle: 'Paramètres du compte',
      icon: 'person',
      color: '#2196f3',
      onPress: onNavigateProfile,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour !</Text>
            <Text style={styles.welcomeText}>Bienvenue dans votre espace commerçant</Text>
          </View>
          <View style={styles.profileIcon}>
            <MaterialIcons name="store" size={32} color="#2d5a27" />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
              <View style={styles.statIcon}>
                <MaterialIcons name={stat.icon} size={24} color={stat.color} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <MaterialIcons name={action.icon} size={28} color={action.color} />
                  {action.badge && (
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionBadgeText}>{totalReservations}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          {reservations.length > 0 ? (
            <View style={styles.activityList}>
              {reservations.slice(0, 3).map((reservation, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <MaterialIcons name="person" size={20} color="#2d5a27" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityText}>
                      {reservation.customerName} a réservé un panier
                    </Text>
                    <Text style={styles.activityTime}>
                      {new Date(reservation.reservedAt).toLocaleString('fr-FR')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <MaterialIcons name="shopping-basket" size={48} color="#ccc" />
              <Text style={styles.emptyActivityText}>Aucune activité récente</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom header (pill-style, consistent with Orders) */}
      <View style={styles.bottomHeader}>
        <TouchableOpacity style={[styles.headerItem, styles.activeHeaderItem]}>
          <MaterialIcons name="home" size={22} color="#fff" />
          <Text style={styles.activeHeaderItemText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateBaskets}>
          <MaterialIcons name="shopping-basket" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Mes Paniers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateOrders}>
          <MaterialIcons name="receipt" size={22} color="#2d5a27" />
          <Text style={styles.headerItemText}>Commandes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerItem} onPress={onNavigateProfile}>
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
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d5a27',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#666',
  },
  emptyActivity: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyActivityText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
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
});
