import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    InteractionManager,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ConversationService, { Conversation } from '../../services/conversationService';
import WebSocketService, { WebSocketMessage } from '../../services/websocketService';

// Professional color palette
const Colors = {
  primary: '#2563EB',
  secondary: '#3B82F6',
  accent: '#F59E0B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#E5E7EB',
  unread: '#EF4444',
  online: '#10B981',
  gradient: ['#2563EB', '#3B82F6'] as const,
};

const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};

const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
};

interface ConversationItemProps {
  item: Conversation;
  onPress: (conversation: Conversation) => void;
  currentUserId?: string;
}

// Memoized conversation item component for better performance
const ConversationItem = React.memo<ConversationItemProps>(({ item, onPress, currentUserId }) => {
  const otherUser = useMemo(() => 
    item.participants.find(p => p.user && p.user._id !== currentUserId)?.user,
    [item.participants, currentUserId]
  );

  const unreadCount = useMemo(() => {
    const currentUserParticipant = item.participants.find(
      p => p.user && p.user._id === currentUserId
    );
    return currentUserParticipant?.unreadCount || 0;
  }, [item.participants, currentUserId]);

  const lastMessageTime = useMemo(() => {
    if (!item.lastMessage) return '';
    
    const date = new Date(item.lastMessage.timestamp || item.lastMessage.createdAt || new Date());
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }, [item.lastMessage]);

  const userTypeColor = useMemo(() => {
    switch (otherUser?.userType) {
      case 'icar': return Colors.primary;
      case 'ipiece': return Colors.success;
      default: return Colors.accent;
    }
  }, [otherUser?.userType]);

  const userTypeIcon = useMemo(() => {
    switch (otherUser?.userType) {
      case 'icar': return 'directions-car';
      case 'ipiece': return 'build';
      default: return 'person';
    }
  }, [otherUser?.userType]);

  if (!otherUser) return null;

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={[userTypeColor, `${userTypeColor}CC`]}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {otherUser.firstName?.[0]?.toUpperCase() || 'U'}
          </Text>
        </LinearGradient>
        
        <View style={[styles.userTypeBadge, { backgroundColor: userTypeColor }]}>
          <MaterialIcons name={userTypeIcon as any} size={10} color="white" />
        </View>
        
        {/* Online indicator */}
        <View style={[styles.onlineIndicator, { backgroundColor: Colors.online }]} />
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName} numberOfLines={1}>
            {otherUser.firstName} {otherUser.lastName}
          </Text>
          
          <View style={styles.timeContainer}>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
            {lastMessageTime && (
              <Text style={styles.timestamp}>{lastMessageTime}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.messagePreview}>
          <Text 
            style={[
              styles.lastMessage,
              unreadCount > 0 && styles.unreadMessage
            ]} 
            numberOfLines={2}
          >
            {item.lastMessage?.content || 
             (item.lastMessage?.images?.length ? '📷 Image' : 'New conversation')}
          </Text>
          
          {item.lastMessage && (
            <View style={styles.messageStatus}>
              <Ionicons 
                name="checkmark-done" 
                size={14} 
                color={unreadCount > 0 ? Colors.textSecondary : Colors.success} 
              />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ConversationItem.displayName = 'ConversationItem';

const OptimizedConversationsScreen = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  const { language, translations } = useLanguage();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const loadingRef = useRef(false);

  // Optimized load conversations with error handling and caching
  const loadConversations = useCallback(async (showLoader = true) => {
    if (loadingRef.current || !token) return;
    
    loadingRef.current = true;
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const data = await ConversationService.getConversations();
      
      // Sort conversations by last message time
      const sortedConversations = data.sort((a, b) => {
        const aTime = new Date(a.lastMessage?.timestamp || a.updatedAt || 0).getTime();
        const bTime = new Date(b.lastMessage?.timestamp || b.updatedAt || 0).getTime();
        return bTime - aTime;
      });
      
      setConversations(sortedConversations);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      setError(error.message || 'Unable to load conversations');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [token]);

  // Optimized refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations(false);
    setRefreshing(false);
  }, [loadConversations]);

  // Optimized WebSocket setup with cleanup
  useEffect(() => {
    let mounted = true;
    let cleanupFunctions: (() => void)[] = [];

    const setupWebSocket = () => {
      // Connect WebSocket after interactions are complete
      InteractionManager.runAfterInteractions(() => {
        if (!mounted) return;
        
        WebSocketService.connect();

        const unsubscribeConnection = WebSocketService.onConnectionChange((connected: boolean) => {
          if (mounted) {
            setWsConnected(connected);
            if (connected) {
              // Refresh data when connection is restored
              loadConversations(false);
            }
          }
        });

        // Optimized message handlers with debouncing
        const unsubscribeNewMessage = WebSocketService.subscribe('new_message', (message: WebSocketMessage) => {
          if (!mounted) return;
          
          setConversations(prev => {
            const updated = prev.map(conv => {
              if (conv._id === message.conversationId) {
                return {
                  ...conv,
                  lastMessage: message.data,
                  updatedAt: new Date(),
                  messages: [...(conv.messages || []), message.data],
                };
              }
              return conv;
            });
            
            // Re-sort after update
            return updated.sort((a, b) => {
              const aTime = new Date(a.lastMessage?.timestamp || a.updatedAt || 0).getTime();
              const bTime = new Date(b.lastMessage?.timestamp || b.updatedAt || 0).getTime();
              return bTime - aTime;
            });
          });
        });

        const unsubscribeMessageRead = WebSocketService.subscribe('message_read', (message: WebSocketMessage) => {
          if (!mounted) return;
          
          setConversations(prev => 
            prev.map(conv => {
              if (conv._id === message.conversationId) {
                return {
                  ...conv,
                  participants: conv.participants.map(p => {
                    if (p.user && p.user._id === user?._id) {
                      return { ...p, unreadCount: 0 };
                    }
                    return p;
                  })
                };
              }
              return conv;
            })
          );
        });

        const unsubscribeConversationCreated = WebSocketService.subscribe('conversation_created', (message: WebSocketMessage) => {
          if (!mounted) return;
          
          setConversations(prev => [message.data, ...prev]);
        });

        cleanupFunctions = [
          unsubscribeConnection,
          unsubscribeNewMessage,
          unsubscribeMessageRead,
          unsubscribeConversationCreated,
        ];
      });
    };

    loadConversations();
    setupWebSocket();

    return () => {
      mounted = false;
      cleanupFunctions.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
    };
  }, [loadConversations, user?._id]);

  // Optimized conversation press handler
  const handleConversationPress = useCallback((conversation: Conversation) => {
    // Optimistically update unread count
    setConversations(prev => 
      prev.map(conv => {
        if (conv._id === conversation._id) {
          return {
            ...conv,
            participants: conv.participants.map(p => {
              if (p.user && p.user._id === user?._id) {
                return { ...p, unreadCount: 0 };
              }
              return p;
            })
          };
        }
        return conv;
      })
    );

    // Navigate to conversation detail
    router.push(`/(home)/conversation-detail-optimized/${conversation._id}`);
  }, [router, user?._id]);

  // Optimized render function
  const renderConversation = useCallback(({ item }: { item: Conversation }) => (
    <ConversationItem
      item={item}
      onPress={handleConversationPress}
      currentUserId={user?._id}
    />
  ), [handleConversationPress, user?._id]);

  const keyExtractor = useCallback((item: Conversation) => item._id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 80,
    offset: 80 * index,
    index,
  }), []);

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Colors.gradient} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {translations[language]?.messages || 'Messages'}
          </Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {translations[language]?.loadingConversations || 'Loading conversations...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Colors.gradient} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {translations[language]?.messages || 'Messages'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {wsConnected && (
            <View style={styles.connectionIndicator}>
              <Ionicons name="wifi" size={16} color="white" />
            </View>
          )}
        </View>
      </LinearGradient>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadConversations()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.conversationsList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient
                colors={[`${Colors.primary}20`, `${Colors.secondary}20`]}
                style={styles.emptyIconContainer}
              >
                <Ionicons name="chatbubbles-outline" size={64} color={Colors.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {translations[language]?.noConversations || 'No Conversations'}
              </Text>
              <Text style={styles.emptyText}>
                {translations[language]?.noConversationsDescription || 
                  'Your conversations with suppliers will appear here'}
              </Text>
              <TouchableOpacity 
                style={styles.createRequestButton}
                onPress={() => router.push('/(home)/create-parts-request')}
              >
                <LinearGradient colors={[Colors.accent, `${Colors.accent}CC`]} style={styles.createRequestGradient}>
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.createRequestText}>New Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? Spacing.lg : Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.lg,
  },
  headerTitle: {
    color: 'white',
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  connectionIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.lg,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  conversationsList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  userTypeBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginLeft: Spacing.xs,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadMessage: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  messageStatus: {
    marginLeft: Spacing.xs,
  },
  unreadBadge: {
    backgroundColor: Colors.unread,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  createRequestButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  createRequestGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  createRequestText: {
    color: 'white',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    marginLeft: Spacing.sm,
  },
});

export default OptimizedConversationsScreen;