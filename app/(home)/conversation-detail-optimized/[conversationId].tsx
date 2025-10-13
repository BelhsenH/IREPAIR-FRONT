import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../../contexts/AuthContext';
import ConversationService, { Conversation, Message } from '../../../services/conversationService';
import WebSocketService, { WebSocketMessage } from '../../../services/websocketService';

const { width: screenWidth } = Dimensions.get('window');

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
  
  // Message colors
  sentMessage: '#2563EB',
  receivedMessage: '#FFFFFF',
  sentText: '#FFFFFF',
  receivedText: '#1F2937',
  messageTime: '#9CA3AF',
  
  gradient: ['#2563EB', '#3B82F6'] as const,
  sentGradient: ['#2563EB', '#3B82F6'] as const,
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

interface MessageItemProps {
  item: Message;
  isFromCurrentUser: boolean;
  showSender: boolean;
}

// Optimized message component with distinct UI for sent/received
const MessageItem = React.memo<MessageItemProps>(({ item, isFromCurrentUser, showSender }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [animatedValue]);

  const formatTime = useCallback((timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const messageContent = useMemo(() => (
    <View style={[
      styles.messageBubble,
      isFromCurrentUser ? styles.sentBubble : styles.receivedBubble
    ]}>
      {!isFromCurrentUser && showSender && item.sender && (
        <Text style={styles.senderName}>
          {item.sender.firstName} {item.sender.lastName}
        </Text>
      )}
      
      {item.content && (
        <Text style={[
          styles.messageText,
          isFromCurrentUser ? styles.sentText : styles.receivedText
        ]}>
          {item.content}
        </Text>
      )}



      <View style={[
        styles.messageFooter,
        isFromCurrentUser ? styles.sentFooter : styles.receivedFooter
      ]}>
        <Text style={[
          styles.timestamp,
          isFromCurrentUser ? styles.sentTimestamp : styles.receivedTimestamp
        ]}>
          {formatTime(item.timestamp || item.createdAt || new Date())}
        </Text>
        
        {isFromCurrentUser && (
          <View style={styles.messageStatus}>
            <Ionicons 
              name="checkmark-done" 
              size={14} 
              color="rgba(255, 255, 255, 0.7)" 
            />
          </View>
        )}
      </View>
    </View>
  ), [item, isFromCurrentUser, showSender, formatTime]);

  return (
    <Animated.View 
      style={[
        styles.messageContainer,
        isFromCurrentUser ? styles.sentMessageContainer : styles.receivedMessageContainer,
        {
          opacity: animatedValue,
          transform: [{
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }
      ]}
    >
      {isFromCurrentUser ? (
        <LinearGradient
          colors={Colors.sentGradient}
          style={[styles.messageBubble, styles.sentBubble]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {messageContent.props.children}
        </LinearGradient>
      ) : (
        messageContent
      )}
    </Animated.View>
  );
});

MessageItem.displayName = 'MessageItem';

// Typing indicator component
const TypingIndicator = React.memo(() => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      const createAnimation = (value: Animated.Value, delay: number) =>
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]);

      Animated.loop(
        Animated.parallel([
          createAnimation(dot1, 0),
          createAnimation(dot2, 200),
          createAnimation(dot3, 400),
        ])
      ).start();
    };

    animate();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Text style={styles.typingText}>Typing</Text>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

const OptimizedConversationDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, token } = useAuth();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Optimized conversation loading
  const loadConversation = useCallback(async () => {
    if (!conversationId || !token) {
      setError('Missing conversation ID or authentication');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const conversationData = await ConversationService.getConversation(conversationId);
      setConversation(conversationData);
      setMessages(conversationData.messages || []);
      
      // Mark as read
      await ConversationService.markAsRead(conversationId);
      
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      setError(error.message || 'Unable to load conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  // WebSocket setup for real-time messaging
  useEffect(() => {
    if (!conversationId) return;

    let mounted = true;
    const cleanupFunctions: (() => void)[] = [];

    const setupRealTime = () => {
      InteractionManager.runAfterInteractions(() => {
        if (!mounted) return;

        WebSocketService.connect();

        // Subscribe to new messages
        const unsubscribeNewMessage = WebSocketService.subscribe('new_message', (message: WebSocketMessage) => {
          if (!mounted || message.conversationId !== conversationId) return;
          
          setMessages(prev => {
            const messageExists = prev.some(msg => msg._id === message.data._id);
            if (messageExists) return prev;
            return [...prev, message.data];
          });

          // Auto-scroll to bottom for new messages
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        // Subscribe to typing indicators
        const unsubscribeTyping = WebSocketService.subscribe('typing', (message: WebSocketMessage) => {
          if (!mounted || message.conversationId !== conversationId || message.userId === user?._id) return;
          
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (message.data.isTyping) {
              newSet.add(message.userId!);
            } else {
              newSet.delete(message.userId!);
            }
            return newSet;
          });
        });

        cleanupFunctions.push(unsubscribeNewMessage, unsubscribeTyping);
      });
    };

    loadConversation();
    setupRealTime();

    return () => {
      mounted = false;
      cleanupFunctions.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
    };
  }, [conversationId, loadConversation, user?._id]);

  // Optimized typing handler
  const handleTyping = useCallback((text: string) => {
    setNewMessage(text);
    
    if (text.trim() && !isTyping) {
      setIsTyping(true);
      WebSocketService.send({
        type: 'typing',
        data: { isTyping: true, userId: user?._id },
        conversationId,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      WebSocketService.send({
        type: 'typing',
        data: { isTyping: false, userId: user?._id },
        conversationId,
      });
    }, 3000);
  }, [isTyping, conversationId, user?._id]);

  // Optimized send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;
    if (!conversationId || !token || sending) return;

    const messageText = newMessage.trim();

    // Clear inputs immediately for better UX
    setNewMessage('');
    setIsTyping(false);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setSending(true);
    
    try {
      const sentMessage = await ConversationService.sendMessage(
        conversationId,
        messageText,
        []
      );

      // Add message to local state
      setMessages(prev => [...prev, sentMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Unable to send message');
      
      // Restore inputs on error
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  }, [newMessage, conversationId, token, sending]);



  // Optimized render functions
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isFromCurrentUser = (item.sender?._id || item.senderId) === user?._id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showSender = !isFromCurrentUser && (!prevMessage || (prevMessage.sender?._id || prevMessage.senderId) !== (item.sender?._id || item.senderId));

    return (
      <MessageItem
        item={item}
        isFromCurrentUser={isFromCurrentUser}
        showSender={showSender}
      />
    );
  }, [messages, user?._id]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 100, // Approximate message height
    offset: 100 * index,
    index,
  }), []);

  const otherUser = useMemo(() => 
    conversation?.participants.find(p => p.user && p.user._id !== user?._id)?.user,
    [conversation?.participants, user?._id]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Colors.gradient} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !conversation) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Colors.gradient} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error || 'Conversation not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadConversation}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <LinearGradient colors={Colors.gradient} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Conversation'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {otherUser?.userType && (
                <>
                  <MaterialIcons 
                    name={otherUser.userType === 'icar' ? 'directions-car' : 'build'} 
                    size={12} 
                    color="rgba(255, 255, 255, 0.8)" 
                  />
                  {` ${otherUser.userType.toUpperCase()}`}
                </>
              )}
            </Text>
          </View>

         {/* <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="videocam" size={20} color="white" />
            </TouchableOpacity>
          </View>*/}
        </LinearGradient>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={[...messages, ...(typingUsers.size > 0 ? [{ _id: 'typing-indicator', isTyping: true } as any] : [])]}
          renderItem={({ item, index }) => {
            if ((item as any).isTyping) {
              return <TypingIndicator />;
            }
            return renderMessage({ item: item as Message, index });
          }}
          keyExtractor={(item) => item._id}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          updateCellsBatchingPeriod={50}
          initialNumToRender={20}
          windowSize={10}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />





        {/* Input Container */}
        <View style={styles.inputContainer}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              value={newMessage}
              onChangeText={handleTyping}
              multiline
              maxLength={1000}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              !newMessage.trim() && styles.sendButtonDisabled
            ]} 
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size={20} color="white" />
            ) : (
              <LinearGradient colors={Colors.sentGradient} style={styles.sendButtonGradient}>
                <Ionicons name="send" size={20} color="white" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
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
    fontSize: Typography.fontSize.lg,
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
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: Spacing.lg,
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
  messagesList: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  messageContainer: {
    marginBottom: Spacing.md,
  },
  sentMessageContainer: {
    alignItems: 'flex-end',
  },
  receivedMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: screenWidth * 0.75,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentBubble: {
    backgroundColor: Colors.sentMessage,
    borderBottomRightRadius: 8,
  },
  receivedBubble: {
    backgroundColor: Colors.receivedMessage,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  senderName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  messageText: {
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
  },
  sentText: {
    color: Colors.sentText,
  },
  receivedText: {
    color: Colors.receivedText,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sentFooter: {
    justifyContent: 'flex-end',
  },
  receivedFooter: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontSize: Typography.fontSize.xs,
  },
  sentTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedTimestamp: {
    color: Colors.messageTime,
  },
  messageStatus: {
    marginLeft: Spacing.xs,
  },

  typingContainer: {
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  typingBubble: {
    backgroundColor: Colors.receivedMessage,
    borderRadius: 20,
    borderBottomLeftRadius: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  typingDots: {
    flexDirection: 'row',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary,
    marginHorizontal: 1,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  textInputContainer: {
    flex: 1,
    maxHeight: 100,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: Spacing.sm,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default OptimizedConversationDetailScreen;