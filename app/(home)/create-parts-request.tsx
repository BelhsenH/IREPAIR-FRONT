import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import PartsService, { Category, SubCategory, Item } from '../../services/partsService';
import ConversationService from '../../services/conversationService';
import { useLanguage } from '../../contexts/LanguageContext';
import config from '../../config';


const CreatePartsRequestScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const { language, translations } = useLanguage();

  // Helper function to get full image URL
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    
    console.log('getImageUrl called with path:', imagePath);
    console.log('config.apiUrl:', config.apiUrl);
    
    // Images are served through the API gateway at /api/parts/images/
    // Handle paths like /images/image-123.jpeg
    if (imagePath.startsWith('/images/')) {
      // Convert /images/filename to /api/parts/images/filename
      const fullUrl = `${config.apiUrl}/api/parts${imagePath}`;
      console.log('Constructed URL:', fullUrl);
      return fullUrl;
    }
    
    // Handle paths like images/filename (without leading slash)
    if (imagePath.startsWith('images/')) {
      const fullUrl = `${config.apiUrl}/api/parts/${imagePath}`;
      console.log('Constructed URL:', fullUrl);
      return fullUrl;
    }
    
    // Fallback for other paths
    const fullUrl = `${config.apiUrl}/api/parts${imagePath}`;
    console.log('Fallback URL:', fullUrl);
    return fullUrl;
  };
  
  const [formData, setFormData] = useState({
    notes: '',
    urgencyLevel: 'medium' as 'low' | 'medium' | 'high',
    quantity: 1,
    vin: '',
  });
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Modal states
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [showSubCategorySelection, setShowSubCategorySelection] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  
  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await PartsService.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadSubCategories = async (categoryId: string) => {
    try {
      setLoadingSubCategories(true);
      const response = await PartsService.getSubCategories(categoryId);
      setSubCategories(response);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      Alert.alert('Error', 'Failed to load subcategories');
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const loadItems = async (subCategoryId: string) => {
    try {
      setLoadingItems(true);
      const response = await PartsService.getItems(subCategoryId);
      setItems(response);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load items');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square crop for consistency
        quality: 0.3, // Lower quality to prevent memory issues
        allowsMultipleSelection: false,
        exif: false, // Don't include EXIF data to reduce size
        base64: false, // Don't include base64 to save memory
        selectionLimit: 1,
      });

      console.log('Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);
        // Set preview image first
        setPreviewImage(imageUri);
      }
    } catch (error) {
      console.error('Error in image picker:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square crop for consistency
        quality: 0.3, // Lower quality to prevent memory issues
        exif: false, // Don't include EXIF data to reduce size
        base64: false, // Don't include base64 to save memory
      });

      console.log('Camera result:', result);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Camera image URI:', imageUri);
        // Set preview image first
        setPreviewImage(imageUri);
      }
    } catch (error) {
      console.error('Error in camera:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      console.log('Starting image upload for URI:', imageUri);
      setUploadingImage(true);
      
      // Check if imageUri is valid
      if (!imageUri || imageUri.length === 0) {
        throw new Error('Invalid image URI');
      }
      
      const response = await PartsService.uploadImage(imageUri);
      console.log('Upload response:', response);
      
      if (response && response.imageUrl) {
        // Convert absolute URL to relative path for consistency with getImageUrl helper
        let imagePath = response.imageUrl;
        if (imagePath.startsWith('http')) {
          // Extract the path part after the domain (e.g., /images/image-123.jpeg)
          const urlParts = imagePath.split('/');
          const pathIndex = urlParts.findIndex(part => part === 'images');
          if (pathIndex !== -1) {
            imagePath = '/' + urlParts.slice(pathIndex).join('/');
          }
        }
        setUploadedImage(imagePath);
        setPreviewImage(null); // Clear preview after successful upload
        setShowImageUpload(false);
        Alert.alert(translations[language].success || 'Success', 'Image uploaded successfully');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    // Validate VIN
    if (!formData.vin.trim()) {
      Alert.alert(translations[language].error || 'Error', 'Please enter the vehicle VIN number');
      return;
    }

    if (!selectedItem) {
      Alert.alert('Error', 'Please select an item');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Session expired, please log in again');
      return;
    }

    try {
      setLoading(true);

      const vehicleInfo = {
        vin: formData.vin.trim(),
      };

      const requestData = {
        itemId: selectedItem._id,
        vehicleInfo,
        quantity: formData.quantity,
        notes: formData.notes.trim() || undefined,
        urgencyLevel: formData.urgencyLevel,
        image: uploadedImage || undefined,
      };

      const createdRequest = await PartsService.createItemRequest(requestData);
      
      // Create conversation for this parts request
      try {
        const conversation = await ConversationService.createConversation(createdRequest._id, token!);
        
        Alert.alert(
          translations[language].requestCreated,
          'Votre demande a été créée avec succès. Une conversation a été initiée avec les fournisseurs.',
          [
            { text: 'Voir la conversation', onPress: () => router.replace(`/conversation-detail?conversationId=${conversation._id}`) },
            { text: 'Retour', style: 'cancel', onPress: () => router.back() }
          ]
        );
      } catch (conversationError) {
        console.error('Error creating conversation:', conversationError);
        // Still show success message for the parts request
        Alert.alert(
          translations[language].requestCreated,
          translations[language].requestCreatedMessage,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      console.error('Error creating request:', error);
      
      // Handle specific error cases
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        Alert.alert(translations[language].sessionExpired, translations[language].sessionExpiredMessage);
      } else if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
        Alert.alert(translations[language].invalidRequest, translations[language].invalidRequestMessage);
      } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        Alert.alert(translations[language].partNotFound, translations[language].partNotFoundMessage);
      } else {
        Alert.alert(translations[language].error, error.message || translations[language].unableToCreateRequestMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'low': return translations[language].low;
      case 'medium': return translations[language].medium;
      case 'high': return translations[language].high;
      default: return urgency;
    }
  };

  const CategorySelectionModal = () => {
    if (!showCategorySelection) return null;

    return (
      <Modal visible={showCategorySelection} animationType="slide" transparent>
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-center`}>
          <View style={tw`bg-white mx-4 rounded-2xl max-h-5/6`}>
            <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>
                {translations[language].selectCategory}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowCategorySelection(false)}
                style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center`}
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={tw`max-h-96 p-4`}>
              {loadingCategories ? (
                <View style={tw`items-center py-8`}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={tw`text-gray-500 mt-2`}>{translations[language].loadingCategories}</Text>
                </View>
              ) : categories.length === 0 ? (
                <View style={tw`items-center py-8`}>
                  <Ionicons name="grid-outline" size={48} color="#9CA3AF" />
                  <Text style={tw`text-gray-500 mt-2`}>{translations[language].noCategoriesFound}</Text>
                </View>
              ) : (
                categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={tw`bg-gray-50 rounded-xl p-4 mb-3 flex-row items-center border border-gray-200`}
                    onPress={() => {
                      setSelectedCategory(category);
                      setSelectedSubCategory(null);
                      setSelectedItem(null);
                      loadSubCategories(category._id);
                      setShowCategorySelection(false);
                    }}
                  >
                    <View style={tw`w-16 h-16 rounded-lg bg-blue-100 items-center justify-center mr-3`}>
                      {category.imagePath && getImageUrl(category.imagePath) ? (
                        <Image
                          source={{ uri: getImageUrl(category.imagePath) || '' }}
                          style={tw`w-full h-full rounded-lg`}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="grid" size={24} color="#2563EB" />
                      )}
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-lg font-semibold text-gray-900`}>
                        {category.name}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const SubCategorySelectionModal = () => {
    if (!showSubCategorySelection) return null;

    return (
      <Modal visible={showSubCategorySelection} animationType="slide" transparent>
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-center`}>
          <View style={tw`bg-white mx-4 rounded-2xl max-h-5/6`}>
            <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>
                {translations[language].selectSubCategory}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowSubCategorySelection(false)}
                style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center`}
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={tw`max-h-96 p-4`}>
              {loadingSubCategories ? (
                <View style={tw`items-center py-8`}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={tw`text-gray-500 mt-2`}>{translations[language].loadingSubcategories}</Text>
                </View>
              ) : subCategories.length === 0 ? (
                <View style={tw`items-center py-8`}>
                  <Ionicons name="list-outline" size={48} color="#9CA3AF" />
                  <Text style={tw`text-gray-500 mt-2`}>{translations[language].noSubcategoriesFound}</Text>
                </View>
              ) : (
                subCategories.map((subCategory) => (
                  <TouchableOpacity
                    key={subCategory._id}
                    style={tw`bg-gray-50 rounded-xl p-4 mb-3 flex-row items-center border border-gray-200`}
                    onPress={() => {
                      setSelectedSubCategory(subCategory);
                      setSelectedItem(null);
                      loadItems(subCategory._id);
                      setShowSubCategorySelection(false);
                    }}
                  >
                    <View style={tw`w-12 h-12 rounded-lg bg-blue-100 items-center justify-center mr-3`}>
                      <Ionicons name="list" size={24} color="#2563EB" />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-lg font-semibold text-gray-900`}>
                        {subCategory.name}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const ItemSelectionModal = () => {
    if (!showItemSelection) return null;

    return (
      <Modal visible={showItemSelection} animationType="slide" transparent>
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-center`}>
          <View style={tw`bg-white mx-4 rounded-2xl max-h-5/6`}>
            <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>
                {translations[language].selectItem}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowItemSelection(false)}
                style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center`}
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={tw`max-h-96 p-4`}>
              {loadingItems ? (
                <View style={tw`items-center py-8`}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={tw`text-gray-500 mt-2`}>{translations[language].loadingItems}</Text>
                </View>
              ) : items.length === 0 ? (
                <View style={tw`items-center py-8`}>
                  <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                  <Text style={tw`text-gray-500 mt-2`}>No items found</Text>
                </View>
              ) : (
                items.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={tw`bg-gray-50 rounded-xl p-4 mb-3 flex-row items-center border border-gray-200`}
                    onPress={() => {
                      setSelectedItem(item);
                      setShowItemSelection(false);
                      setShowImageUpload(true);
                    }}
                  >
                    <View style={tw`w-16 h-16 rounded-lg bg-blue-100 items-center justify-center mr-3`}>
                      {item.imagePath && getImageUrl(item.imagePath) ? (
                        <Image
                          source={{ uri: getImageUrl(item.imagePath) || '' }}
                          style={tw`w-full h-full rounded-lg`}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="cube" size={24} color="#2563EB" />
                      )}
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-lg font-semibold text-gray-900`}>
                        {item.name}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const ImageUploadModal = () => {
    if (!showImageUpload) return null;

    return (
      <Modal visible={showImageUpload} animationType="slide" transparent>
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-center`}>
          <View style={tw`bg-white mx-4 rounded-2xl p-6`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>
                {translations[language].addPhotoOptional}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowImageUpload(false)}
                style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center`}
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={tw`text-gray-600 mb-6`}>
              {translations[language].requestHelpText}
            </Text>

            {(previewImage || uploadedImage) && (
              <View style={tw`mb-4`}>
                <Image 
                  source={{ uri: previewImage || (uploadedImage ? getImageUrl(uploadedImage) : '') || '' }} 
                  style={tw`w-full h-48 rounded-xl`}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={tw`absolute top-2 right-2 bg-red-500 rounded-full w-8 h-8 items-center justify-center`}
                  onPress={() => {
                    setPreviewImage(null);
                    setUploadedImage(null);
                  }}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
                {previewImage && !uploadedImage && (
                  <View style={tw`absolute bottom-2 left-2 bg-blue-500 rounded-lg px-2 py-1`}>
                    <Text style={tw`text-white text-xs font-medium`}>{translations[language].preview}</Text>
                  </View>
                )}
                {uploadedImage && (
                  <View style={tw`absolute bottom-2 left-2 bg-green-500 rounded-lg px-2 py-1`}>
                    <Text style={tw`text-white text-xs font-medium`}>{translations[language].uploaded}</Text>
                  </View>
                )}
              </View>
            )}

            {uploadingImage ? (
              <View style={tw`items-center py-8`}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={tw`text-gray-500 mt-2`}>{translations[language].uploadingImage}</Text>
                {previewImage && (
                  <Image 
                    source={{ uri: previewImage }}
                    style={tw`w-20 h-20 rounded-lg mt-4 opacity-50`}
                    resizeMode="cover"
                  />
                )}
              </View>
            ) : (
              <View style={tw`flex-row gap-3 mb-4`}>
                {previewImage && !uploadedImage ? (
                  <>
                    <TouchableOpacity
                      style={tw`flex-1 bg-green-600 rounded-xl p-4 flex-row items-center justify-center`}
                      onPress={() => uploadImage(previewImage)}
                    >
                      <Ionicons name="cloud-upload" size={20} color="white" />
                      <Text style={tw`text-white font-semibold ml-2`}>{translations[language].uploadImage}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={tw`flex-1 bg-gray-600 rounded-xl p-4 flex-row items-center justify-center`}
                      onPress={() => setPreviewImage(null)}
                    >
                      <Ionicons name="refresh" size={20} color="white" />
                      <Text style={tw`text-white font-semibold ml-2`}>{translations[language].retake}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={tw`flex-1 bg-blue-600 rounded-xl p-4 flex-row items-center justify-center`}
                      onPress={handleCamera}
                    >
                      <Ionicons name="camera" size={20} color="white" />
                      <Text style={tw`text-white font-semibold ml-2`}>{translations[language].camera}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={tw`flex-1 bg-gray-600 rounded-xl p-4 flex-row items-center justify-center`}
                      onPress={handleImagePicker}
                    >
                      <Ionicons name="images" size={20} color="white" />
                      <Text style={tw`text-white font-semibold ml-2`}>{translations[language].gallery}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            <TouchableOpacity
              style={tw`bg-green-600 rounded-xl p-4 flex-row items-center justify-center`}
              onPress={() => setShowImageUpload(false)}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={tw`text-white font-semibold ml-2`}>
                {uploadedImage ? translations[language].done : translations[language].skipPhoto}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-blue-900 p-4 flex-row items-center shadow-lg`}>
        <TouchableOpacity
          style={tw`mr-3`}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={tw`text-xl font-bold text-white flex-1`}>
          {translations[language].requestPart}
        </Text>
      </View>

      <ScrollView style={tw`flex-1 p-6`} showsVerticalScrollIndicator={false}>
        {/* VIN Input */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-lg font-semibold text-gray-900 mb-3`}>
            {translations[language].vehicleVinNumber} *
          </Text>
          <TextInput
            style={tw`bg-white rounded-xl p-4 border border-gray-200 text-gray-900`}
            placeholder={translations[language].enterVinPlaceholder}
            value={formData.vin}
            onChangeText={(text) => setFormData({ ...formData, vin: text.toUpperCase() })}
            maxLength={17}
            autoCapitalize="characters"
          />
        </View>

        {/* Category Selection */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-lg font-semibold text-gray-900 mb-3`}>
            {translations[language].category} *
          </Text>
          <TouchableOpacity
            style={tw`bg-white rounded-xl p-4 border border-gray-200 flex-row items-center justify-between`}
            onPress={() => setShowCategorySelection(true)}
          >
            {selectedCategory ? (
              <View style={tw`flex-row items-center flex-1`}>
                <View style={tw`w-12 h-12 rounded-lg bg-blue-100 items-center justify-center mr-3`}>
                  {selectedCategory.imagePath && getImageUrl(selectedCategory.imagePath) ? (
                    <Image
                      source={{ uri: getImageUrl(selectedCategory.imagePath) || '' }}
                      style={tw`w-full h-full rounded-lg`}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="grid" size={24} color="#2563EB" />
                  )}
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-lg font-semibold text-gray-900`}>
                    {selectedCategory.name}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={tw`flex-row items-center flex-1`}>
                <View style={tw`w-12 h-12 rounded-lg bg-gray-100 items-center justify-center mr-3`}>
                  <Ionicons name="grid-outline" size={24} color="#6B7280" />
                </View>
                <Text style={tw`text-gray-500 text-lg`}>
                  {translations[language].chooseCategory}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Sub-Category Selection */}
        {selectedCategory && (
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold text-gray-900 mb-3`}>
              {translations[language].subCategory} *
            </Text>
            <TouchableOpacity
              style={tw`bg-white rounded-xl p-4 border border-gray-200 flex-row items-center justify-between`}
              onPress={() => setShowSubCategorySelection(true)}
            >
              {selectedSubCategory ? (
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={tw`w-12 h-12 rounded-lg bg-blue-100 items-center justify-center mr-3`}>
                    <Ionicons name="list" size={24} color="#2563EB" />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-lg font-semibold text-gray-900`}>
                      {selectedSubCategory.name}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={tw`w-12 h-12 rounded-lg bg-gray-100 items-center justify-center mr-3`}>
                    <Ionicons name="list-outline" size={24} color="#6B7280" />
                  </View>
                  <Text style={tw`text-gray-500 text-lg`}>
                    {translations[language].chooseSubCategory}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Item Selection */}
        {selectedSubCategory && (
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold text-gray-900 mb-3`}>
              {translations[language].item} *
            </Text>
            <TouchableOpacity
              style={tw`bg-white rounded-xl p-4 border border-gray-200 flex-row items-center justify-between`}
              onPress={() => setShowItemSelection(true)}
            >
              {selectedItem ? (
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={tw`w-12 h-12 rounded-lg bg-blue-100 items-center justify-center mr-3`}>
                    {selectedItem.imagePath && getImageUrl(selectedItem.imagePath) ? (
                      <Image
                        source={{ uri: getImageUrl(selectedItem.imagePath) || '' }}
                        style={tw`w-full h-full rounded-lg`}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="cube" size={24} color="#2563EB" />
                    )}
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-lg font-semibold text-gray-900`}>
                      {selectedItem.name}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={tw`w-12 h-12 rounded-lg bg-gray-100 items-center justify-center mr-3`}>
                    <Ionicons name="cube-outline" size={24} color="#6B7280" />
                  </View>
                  <Text style={tw`text-gray-500 text-lg`}>
                    {translations[language].chooseItem}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Photo Section */}
        {selectedItem && (
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold text-gray-900 mb-3`}>
              {translations[language].addPhotoOptional}
            </Text>
            <TouchableOpacity
              style={tw`bg-white rounded-xl p-4 border border-gray-200`}
              onPress={() => setShowImageUpload(true)}
            >
              {uploadedImage ? (
                <View style={tw`items-center`}>
                  <View style={tw`relative w-full`}>
                    <Image 
                      source={{ uri: getImageUrl(uploadedImage) || '' }} 
                      style={tw`w-full h-48 rounded-xl mb-3`}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={tw`absolute top-2 right-2 bg-red-500 rounded-full w-8 h-8 items-center justify-center shadow-lg`}
                      onPress={() => setUploadedImage(null)}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text style={tw`text-green-600 font-medium`}>{translations[language].photoAdded}</Text>
                  <Text style={tw`text-gray-500 text-sm mt-1`}>{translations[language].tapToChangePhoto}</Text>
                </View>
              ) : (
                <View style={tw`items-center py-6`}>
                  <Ionicons name="camera-outline" size={48} color="#6B7280" />
                  <Text style={tw`text-gray-500 mt-2`}>{translations[language].tapToAddPhoto}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Quantity */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-lg font-semibold text-gray-900 mb-3`}>
            {translations[language].quantity}
          </Text>
          <View style={tw`bg-white rounded-xl p-4 border border-gray-200 flex-row items-center justify-center`}>
            <TouchableOpacity
              style={tw`w-10 h-10 rounded-lg bg-gray-100 items-center justify-center`}
              onPress={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
            >
              <Ionicons name="remove" size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={tw`text-xl font-semibold text-gray-900 mx-6`}>
              {formData.quantity}
            </Text>
            <TouchableOpacity
              style={tw`w-10 h-10 rounded-lg bg-gray-100 items-center justify-center`}
              onPress={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
            >
              <Ionicons name="add" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Urgency */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-lg font-semibold text-gray-900 mb-3`}>
            {translations[language].urgency}
          </Text>
          <View style={tw`flex-row gap-2`}>
            {['low', 'medium', 'high'].map((urgency) => (
              <TouchableOpacity
                key={urgency}
                style={[
                  tw`flex-1 rounded-xl p-3 border`,
                  formData.urgencyLevel === urgency
                    ? tw`border-transparent ${getUrgencyColor(urgency)}`
                    : tw`bg-white border-gray-200`
                ]}
                onPress={() => setFormData({ ...formData, urgencyLevel: urgency as 'low' | 'medium' | 'high' })}
              >
                <Text style={[
                  tw`text-center font-semibold`,
                  formData.urgencyLevel === urgency
                    ? tw`${getUrgencyColor(urgency).split(' ')[0]}`
                    : tw`text-gray-600`
                ]}>
                  {getUrgencyText(urgency)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={tw`mb-8`}>
          <Text style={tw`text-lg font-semibold text-gray-900 mb-3`}>
            {translations[language].additionalNotes}
          </Text>
          <TextInput
            style={tw`bg-white rounded-xl p-4 border border-gray-200 text-gray-900 min-h-24`}
            placeholder={translations[language].additionalInfo}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            tw`bg-blue-600 rounded-xl p-4 flex-row items-center justify-center`,
            loading && tw`opacity-50`
          ]}
          onPress={handleSubmit}
          disabled={loading || !formData.vin || !selectedItem}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="white" />
              <Text style={tw`text-white text-lg font-semibold ml-2`}>
                {translations[language].createRequest}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View style={tw`mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200`}>
          <View style={tw`flex-row items-start`}>
            <Ionicons name="information-circle" size={20} color="#2563EB" />
            <Text style={tw`text-blue-700 text-sm ml-2 flex-1`}>
              {translations[language].requestHelpText || 
                "After submitting your request, ipiece users with matching vehicles will be notified and can contact you through the messaging system or phone."}
            </Text>
          </View>
        </View>
      </ScrollView>

      <CategorySelectionModal />
      <SubCategorySelectionModal />
      <ItemSelectionModal />
      <ImageUploadModal />
    </SafeAreaView>
  );
};


export default CreatePartsRequestScreen;
