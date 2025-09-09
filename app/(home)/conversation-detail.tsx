import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ConversationService, { Conversation, Message } from '../../services/conversationService';
import RealtimeService from '../../services/realtimeService';

const ConversationDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, token } = useAuth();
  const { language, translations } = useLanguage();
  const conversationId = params.conversationId as string;
  const scrollViewRef = useRef<FlatList>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);

  const loadConversation = useCallback(async () => {
    if (!conversationId || !token) return;

    try {
      const conv = await ConversationService.getConversation(conversationId);
      setConversation(conv);
      
      // Mark as read
      await ConversationService.markAsRead(conversationId);
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
      Alert.alert('Erreur', 'Impossible de charger la conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversation?.messages && conversation.messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation?.messages]);

  // Real-time messaging setup
  useEffect(() => {
    if (!conversationId) return;

    const setupRealtime = async () => {
      try {
        await RealtimeService.connect();
        RealtimeService.joinConversation(conversationId);
      } catch (error) {
        console.error('Failed to connect to realtime service:', error);
      }
    };

    setupRealtime();

    // Listen for new messages
    const unsubscribeNewMessage = RealtimeService.onNewMessage((message) => {
      if (message.sender?._id !== user?._id) {
        setConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, message]
          };
        });
        // Auto-scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    // Listen for typing indicators
    const unsubscribeTyping = RealtimeService.onUserTyping((data) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    });

    // Listen for read receipts
    const unsubscribeRead = RealtimeService.onMessageRead((data) => {
      if (data.conversationId === conversationId) {
        // Handle read receipt (e.g., show read indicators)
        console.log('Message read by:', data.userId);
      }
    });

    return () => {
      RealtimeService.leaveConversation(conversationId);
      unsubscribeNewMessage();
      unsubscribeTyping();
      unsubscribeRead();
    };
  }, [conversationId, user?._id]);

  // Handle typing indicator
  useEffect(() => {
    let typingTimeout: ReturnType<typeof setTimeout>;
    
    if (isTyping && conversationId) {
      RealtimeService.sendTyping(conversationId, true);
      
      typingTimeout = setTimeout(() => {
        RealtimeService.sendTyping(conversationId, false);
        setIsTyping(false);
      }, 3000);
    }
    
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [isTyping, conversationId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversation();
    setRefreshing(false);
  }, [loadConversation]);

  const pickImages = async () => {
    if (selectedImages.length >= 2) {
      Alert.alert('Limite atteinte', 'Vous pouvez télécharger au maximum 2 images par message.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Permission d\'accès à la galerie nécessaire.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: Math.min(2 - selectedImages.length, 2),
    });

    if (!result.canceled) {
      const newImages = result.assets.filter((asset, index) => selectedImages.length + index < 2);
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    const updated = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updated);
  };

  const sendMessage = async () => {
    if (!conversationId || !token || (!newMessage.trim() && selectedImages.length === 0)) {
      return;
    }

    setSending(true);
    try {
      let imageUrls: string[] = [];
      
      if (selectedImages.length > 0) {
        setUploading(true);
        imageUrls = await ConversationService.uploadImages(selectedImages);
        setUploading(false);
      }

      const sentMessage = await ConversationService.sendMessage(
        conversationId,
        newMessage.trim() || '📷 Image(s)',
        imageUrls
      );

      // Add the sent message to the conversation
      setConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, sentMessage]
        };
      });

      setNewMessage('');
      setSelectedImages([]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Handle case where sender might be undefined - check both senderId and sender._id
    const senderId = item.sender?._id;
    const isFromCurrentUser = senderId === user?._id;
    
    return (
      <View style={[
        styles.messageContainer,
        isFromCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isFromCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          {!isFromCurrentUser && item.sender && (
            <Text style={styles.senderName}>
              {item.sender.firstName} {item.sender.lastName}
            </Text>
          )}
          
          {item.content && (
            <Text style={[
              styles.messageText,
              isFromCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>
              {item.content}
            </Text>
          )}

          {item.images && item.images.length > 0 && (
            <View style={styles.imagesContainer}>
              {item.images.map((imageUri: string, index: number) => (
                <Image key={index} source={{ uri: imageUri }} style={styles.messageImage} />
              ))}
            </View>
          )}

          <Text style={[
            styles.timestamp,
            isFromCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversation introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FF9800" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {conversation ? 'Conversation' : 'Chargement...'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {conversation ? 
                (() => {
                  const otherUser = conversation.participants.find(p => p.user?._id !== user?._id)?.user;
                  return otherUser ? `${otherUser.firstName} ${otherUser.lastName} (${otherUser.userType})` : 'Utilisateur';
                })() : 
                ''
              }
            </Text>
          </View>
        </View>

        <FlatList
          ref={scrollViewRef}
          data={[...conversation?.messages || [], ...(typingUsers.size > 0 ? [{ _id: 'typing', isTyping: true }] : [])]}
          renderItem={({ item }) => {
            if ((item as any).isTyping) {
              return (
                <View style={[styles.messageContainer, styles.otherUserMessage]}>
                  <View style={[styles.messageBubble, styles.otherUserBubble]}>
                    <Text style={styles.senderName}>Écrit un message...</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 6, height: 6, backgroundColor: '#94A3B8', borderRadius: 3, marginRight: 4 }} />
                      <View style={{ width: 6, height: 6, backgroundColor: '#94A3B8', borderRadius: 3, marginRight: 4 }} />
                      <View style={{ width: 6, height: 6, backgroundColor: '#94A3B8', borderRadius: 3 }} />
                    </View>
                  </View>
                </View>
              );
            }
            return renderMessage({ item: item as Message });
          }}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />

        {/* Image Preview */}
        {selectedImages.length > 0 && (
          <View style={styles.selectedImagesContainer}>
            <Text style={styles.selectedImagesTitle}>
              Images sélectionnées ({selectedImages.length}/2)
            </Text>
            <FlatList
              data={selectedImages}
              horizontal
              renderItem={({ item, index }) => (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: item.uri }} style={styles.selectedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.selectedImagesList}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          
          <TextInput
            style={styles.textInput}
            placeholder="Tapez votre message..."
            value={newMessage}
            onChangeText={(text) => {
              setNewMessage(text);
              if (text.trim() && !isTyping) {
                setIsTyping(true);
              }
            }}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              (!newMessage.trim() && selectedImages.length === 0) && styles.sendButtonDisabled,
              sending && styles.sendButtonDisabled
            ]} 
            onPress={sendMessage}
            disabled={!newMessage.trim() && selectedImages.length === 0}
          >
            {sending ? (
              <ActivityIndicator size={16} color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        
        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#FF9800" />
            <Text style={styles.uploadingText}>
              Téléchargement des images...
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  messagesList: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginBottom: 15,
    width: '100%',
  },
  currentUserMessage: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  otherUserMessage: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start', 
    marginRight: '20%',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserBubble: {
    backgroundColor: '#FF9800',
  },
  otherUserBubble: {
    backgroundColor: 'white',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  currentUserText: {
    color: 'white',
  },
  otherUserText: {
    color: '#334155',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  currentUserTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherUserTimestamp: {
    color: '#94A3B8',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  messageImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  selectedImagesContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 10,
  },
  selectedImagesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    marginHorizontal: 15,
  },
  selectedImagesList: {
    paddingHorizontal: 15,
  },
  selectedImageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  imageButton: {
    marginRight: 10,
    marginBottom: 8,
    padding: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    backgroundColor: '#FF9800',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFF7ED',
  },
  uploadingText: {
    color: '#FF9800',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ConversationDetailScreen;
