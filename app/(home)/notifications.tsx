import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'parts_request' | 'message';
  read: boolean;
  createdAt: string;
  data?: any;
}

const NotificationsScreen = () => {
  const router = useRouter();
  const { language, translations } = useLanguage();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const loadNotifications = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      
      // Mock notifications for now - replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Parts Request Update',
          message: 'Your parts request for brake pads has been accepted by AutoParts Pro.',
          type: 'parts_request',
          read: false,
          createdAt: new Date().toISOString(),
          data: { requestId: 'req_123' }
        },
        {
          id: '2',
          title: 'New Message',
          message: 'You have a new message about your brake pads request.',
          type: 'message',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          data: { conversationId: 'conv_456' }
        },
        {
          id: '3',
          title: 'Service Reminder',
          message: 'Your repair service is due for maintenance check.',
          type: 'info',
          read: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          data: { serviceId: 'service_789' }
        },
      ];

      // Filter notifications if needed
      const filteredNotifications = filter === 'all' 
        ? mockNotifications
        : filter === 'unread'
        ? mockNotifications.filter(n => !n.read)
        : mockNotifications.filter(n => n.type === filter);

      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, refreshing]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
    // TODO: Call API to mark as read
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // TODO: Call API to mark all as read
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'parts_request':
        router.push('/(tabs)');
        break;
      case 'message':
        router.push('/(tabs)');
        break;
      default:
        // Show notification details or navigate to relevant screen
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'parts_request': return 'cube-outline';
      case 'message': return 'chatbubble-outline';
      case 'success': return 'checkmark-circle-outline';
      case 'warning': return 'warning-outline';
      case 'error': return 'alert-circle-outline';
      default: return 'information-circle-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'parts_request': return { bg: '#EBF4FF', text: '#2563EB' };
      case 'message': return { bg: '#F0FDF4', text: '#16A34A' };
      case 'success': return { bg: '#F0FDF4', text: '#16A34A' };
      case 'warning': return { bg: '#FFFBEB', text: '#D97706' };
      case 'error': return { bg: '#FEF2F2', text: '#DC2626' };
      default: return { bg: '#F9FAFB', text: '#6B7280' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filterOptions = [
    { key: 'all', label: translations[language].all || 'All' },
    { key: 'unread', label: translations[language].unread || 'Unread' },
    { key: 'parts_request', label: 'Parts' },
    { key: 'message', label: 'Messages' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.read && styles.unreadCard
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.cardContent}>
        {/* Icon */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(notification.type).bg }
        ]}>
          <Ionicons 
            name={getNotificationIcon(notification.type) as any} 
            size={20} 
            color={getNotificationColor(notification.type).text}
          />
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title,
              !notification.read && styles.unreadTitle
            ]}>
              {notification.title}
            </Text>
            <Text style={styles.timestamp}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>
          
          <Text style={[
            styles.message,
            !notification.read && styles.unreadMessage
          ]}>
            {notification.message}
          </Text>

          {/* Notification type badge */}
          <View style={styles.badgeRow}>
            <View style={[
              styles.typeBadge,
              { backgroundColor: getNotificationColor(notification.type).bg }
            ]}>
              <Text style={[
                styles.typeBadgeText,
                { color: getNotificationColor(notification.type).text }
              ]}>
                {notification.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            
            {!notification.read && (
              <View style={styles.unreadDot} />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {translations[language].notifications || 'Notifications'}
          </Text>
        </View>
        
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllButtonText}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterTab,
                filter === option.key ? styles.activeFilterTab : styles.inactiveFilterTab
              ]}
              onPress={() => setFilter(option.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === option.key ? styles.activeFilterText : styles.inactiveFilterText
                ]}
              >
                {option.label}
                {option.key === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-outline" size={32} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>
                {translations[language].noNotifications || 'No Notifications'}
              </Text>
              <Text style={styles.emptyDescription}>
                {translations[language].noNotificationsDescription || 
                  'You\'ll see notifications about your parts requests and messages here.'}
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  markAllButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  filterContainer: {
    padding: 16,
    maxHeight: 64,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeFilterTab: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  inactiveFilterTab: {
    backgroundColor: 'white',
    borderColor: '#D1D5DB',
  },
  filterText: {
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  inactiveFilterText: {
    color: '#374151',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 300,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  unreadMessage: {
    color: '#111827',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  bottomSpacing: {
    paddingBottom: 24,
  },
});

export default NotificationsScreen;
