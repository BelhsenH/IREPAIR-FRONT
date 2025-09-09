import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import PartsService, { PartsRequest } from '../../services/partsService';

const PartsRequestsScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const { language, translations } = useLanguage();

  const [requests, setRequests] = useState<PartsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadRequests();
  }, [selectedStatus]);

  const loadRequests = async () => {
    if (!token) return;
    
    try {
      if (!refreshing) setLoading(true);
      const params = selectedStatus !== 'all' ? { status: selectedStatus } : {};
      const response = await PartsService.getUserPartsRequests(params);
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load parts requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'accepted': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      case 'completed': return 'checkmark-done-circle';
      default: return 'help-circle-outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return translations[language].pending;
      case 'accepted': return translations[language].accepted;
      case 'rejected': return translations[language].rejected;
      case 'completed': return translations[language].completed;
      default: return status;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'ar' ? 'ar-EG' : language === 'fr' ? 'fr-FR' : 'en-US'
    );
  };

  const statusFilters = [
    { key: 'all', label: translations[language].all, icon: 'list-outline' },
    { key: 'pending', label: translations[language].pending, icon: 'time-outline' },
    { key: 'accepted', label: translations[language].accepted, icon: 'checkmark-circle' },
    { key: 'completed', label: translations[language].completed, icon: 'checkmark-done-circle' },
    { key: 'rejected', label: translations[language].rejected, icon: 'close-circle' },
  ];

  const RequestCard = ({ request }: { request: PartsRequest }) => {
    const part = typeof request.partId === 'object' ? request.partId : null;
    const item = typeof request.item === 'object' ? request.item : null;
    
    // Get part name from multiple possible sources
    const getPartName = () => {
      if (part?.name) return part.name;
      if (item?.name) return item.name;
      if (request.partName) return request.partName;
      return translations[language].unknownPart || 'Unknown Part';
    };
    
    // Get part image from multiple possible sources
    const getPartImage = () => {
      if (part?.image) return part.image;
      if (item?.imagePath) return item.imagePath;
      return null;
    };
    
    return (
      <TouchableOpacity
        style={tw`bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm`}
        onPress={() => {
          if (request.conversationId) {
            router.push(`/messages` as any);
          }
        }}
      >
        {/* Header */}
        <View style={tw`flex-row justify-between items-start mb-3`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-bold text-gray-900 mb-1`}>
              {getPartName()}
            </Text>
            <View style={tw`flex-row items-center flex-wrap gap-2`}>
              <View style={[tw`flex-row items-center px-3 py-1 rounded-full border`, tw`${getStatusColor(request.status)}`]}>
                <Ionicons name={getStatusIcon(request.status)} size={14} color="currentColor" />
                <Text style={tw`text-sm font-medium ml-1`}>
                  {getStatusText(request.status)}
                </Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="flash" size={14} color={getUrgencyColor(request.urgencyLevel).replace('text-', '#')} />
                <Text style={[tw`text-sm font-medium ml-1`, tw`${getUrgencyColor(request.urgencyLevel)}`]}>
                  {request.urgencyLevel.charAt(0).toUpperCase() + request.urgencyLevel.slice(1)}
                </Text>
              </View>
              <Text style={tw`text-xs text-gray-500`}>
                {translations[language].quantity}: {request.quantity || 1}
              </Text>
            </View>
          </View>
          {getPartImage() && (
            <Image 
              source={{ uri: getPartImage() }} 
              style={tw`w-16 h-16 rounded-lg`}
            />
          )}
        </View>

        {/* Vehicle Information Section */}
        {request.vehicleInfo && (
          <View style={tw`bg-gray-50 rounded-lg p-3 mb-3`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons name="car" size={16} color="#6B7280" style={tw`mr-2`} />
              <Text style={tw`text-sm font-medium text-gray-700`}>{translations[language].vehicle}:</Text>
            </View>
            
            <View style={tw`ml-6`}>
              <Text style={tw`text-sm font-semibold text-gray-800 mb-1`}>
                {request.vehicleInfo.brand} {request.vehicleInfo.model}
              </Text>
              
              <View style={tw`flex-row flex-wrap gap-2 mb-2`}>
                <View style={tw`bg-blue-100 rounded-full px-2 py-1`}>
                  <Text style={tw`text-xs text-blue-700`}>{translations[language].year}: {request.vehicleInfo.year}</Text>
                </View>
                
                {request.vehicleInfo.fuelType && (
                  <View style={tw`bg-green-100 rounded-full px-2 py-1`}>
                    <Text style={tw`text-xs text-green-700`}>{translations[language].fuel}: {request.vehicleInfo.fuelType}</Text>
                  </View>
                )}
                
                {request.vehicleInfo.engineType && (
                  <View style={tw`bg-purple-100 rounded-full px-2 py-1`}>
                    <Text style={tw`text-xs text-purple-700`}>{translations[language].engine}: {request.vehicleInfo.engineType}</Text>
                  </View>
                )}
              </View>
              
              {request.vehicleInfo.licensePlate && (
                <View style={tw`flex-row items-center mb-1`}>
                  <Ionicons name="card-outline" size={14} color="#6B7280" style={tw`mr-1`} />
                  <Text style={tw`text-xs text-gray-600`}>
                    {translations[language].licensePlate}: {request.vehicleInfo.licensePlate}
                  </Text>
                </View>
              )}
              
              {request.vehicleInfo.vin && (
                <View style={tw`flex-row items-center mb-1`}>
                  <Ionicons name="barcode-outline" size={14} color="#6B7280" style={tw`mr-1`} />
                  <Text style={tw`text-xs text-gray-600`}>
                    {translations[language].vin}: {request.vehicleInfo.vin}
                  </Text>
                </View>
              )}
              
              {request.vehicleInfo.color && (
                <View style={tw`flex-row items-center mb-1`}>
                  <Ionicons name="color-palette-outline" size={14} color="#6B7280" style={tw`mr-1`} />
                  <Text style={tw`text-xs text-gray-600`}>
                    {translations[language].color}: {request.vehicleInfo.color}
                  </Text>
                </View>
              )}
              
              {request.vehicleInfo.kilometrage && (
                <View style={tw`flex-row items-center`}>
                  <Ionicons name="speedometer-outline" size={14} color="#6B7280" style={tw`mr-1`} />
                  <Text style={tw`text-xs text-gray-600`}>
                    {translations[language].mileage}: {request.vehicleInfo.kilometrage.toLocaleString()} km
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Engagement Metrics */}
        {request.engagementMetrics && (
          <View style={tw`bg-blue-50 rounded-lg p-3 mb-3 border border-blue-200`}>
            <Text style={tw`text-sm font-semibold text-blue-900 mb-2`}>{translations[language].requestVisibility}</Text>
            <View style={tw`flex-row flex-wrap gap-4`}>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="eye-outline" size={16} color="#2563EB" />
                <Text style={tw`text-sm text-blue-700 ml-1`}>
                  {request.engagementMetrics.totalViews} {translations[language].views}
                </Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="people-outline" size={16} color="#2563EB" />
                <Text style={tw`text-sm text-blue-700 ml-1`}>
                  {request.engagementMetrics.uniqueViewers} {translations[language].suppliersViewed}
                </Text>
              </View>
              {request.engagementMetrics.interestedUsers > 0 && (
                <View style={tw`flex-row items-center`}>
                  <Ionicons name="heart-outline" size={16} color="#F59E0B" />
                  <Text style={tw`text-sm text-yellow-700 ml-1`}>
                    {request.engagementMetrics.interestedUsers} {translations[language].interested}
                  </Text>
                </View>
              )}
              {request.engagementMetrics.contactAttempts > 0 && (
                <View style={tw`flex-row items-center`}>
                  <Ionicons name="chatbubble-outline" size={16} color="#10B981" />
                  <Text style={tw`text-sm text-green-700 ml-1`}>
                    {request.engagementMetrics.contactAttempts} {translations[language].contactAttempts}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Provider Info */}
        {request.providerId && typeof request.providerId === 'object' && (
          <View style={tw`bg-green-50 rounded-lg p-3 mb-3 border border-green-200`}>
            <View style={tw`flex-row items-center mb-2`}>
              <View style={tw`w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3`}>
                <Ionicons name="storefront" size={18} color="#16A34A" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-sm font-semibold text-green-900 mb-1`}>
                  {translations[language].acceptedBySupplier}
                </Text>
                <Text style={tw`text-sm font-medium text-gray-900`}>
                  {(request.providerId as any).name || translations[language].unknownSupplier}
                </Text>
                {(request.providerId as any).email && (
                  <Text style={tw`text-xs text-gray-600`}>
                    {(request.providerId as any).email}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={tw`bg-green-600 px-3 py-2 rounded-lg`}
                onPress={() => router.push(`/messages` as any)}
              >
                <Text style={tw`text-white text-xs font-medium`}>{translations[language].chat}</Text>
              </TouchableOpacity>
            </View>
            {request.estimatedDeliveryDate && (
              <View style={tw`flex-row items-center pt-2 border-t border-green-200`}>
                <Ionicons name="calendar-outline" size={14} color="#16A34A" />
                <Text style={tw`text-xs text-gray-700 ml-2`}>
                  {translations[language].estimatedDelivery}: {formatDate(request.estimatedDeliveryDate)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {request.notes && (
          <View style={tw`bg-gray-50 rounded-lg p-3 mb-3`}>
            <Text style={tw`text-sm text-gray-700`}>
              &quot;{request.notes}&quot;
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={tw`flex-row justify-between items-center pt-3 border-t border-gray-100`}>
          <Text style={tw`text-xs text-gray-500`}>
            {formatDate(request.createdAt || '')}
          </Text>
          <View style={tw`flex-row items-center`}>
            {request.conversationId && (
              <TouchableOpacity
                style={tw`bg-blue-600 px-3 py-2 rounded-lg mr-2`}
                onPress={() => router.push(`/messages` as any)}
              >
                <Text style={tw`text-white text-xs font-medium`}>{translations[language].message}</Text>
              </TouchableOpacity>
            )}
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`bg-blue-900 p-4 flex-row items-center shadow-sm`}>
        <TouchableOpacity
          style={tw`mr-3`}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={tw`text-xl font-bold text-white flex-1`}>
          {translations[language].partsRequests}
        </Text>
        <TouchableOpacity
          style={tw`bg-white bg-opacity-20 px-3 py-2 rounded-lg`}
          onPress={() => router.push('/create-parts-request' as any)}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`p-4 max-h-16`}>
        <View style={tw`flex-row gap-2`}>
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                tw`flex-row items-center px-4 py-2 rounded-full border`,
                selectedStatus === filter.key
                  ? tw`bg-blue-900 border-blue-900`
                  : tw`bg-white border-gray-300`
              ]}
              onPress={() => setSelectedStatus(filter.key)}
            >
              <Ionicons 
                name={filter.icon} 
                size={16} 
                color={selectedStatus === filter.key ? 'white' : '#374151'} 
              />
              <Text
                style={[
                  tw`font-medium ml-2`,
                  selectedStatus === filter.key ? tw`text-white` : tw`text-gray-700`
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={tw`text-gray-600 mt-4`}>{translations[language].loadingRequests}</Text>
        </View>
      ) : (
        <ScrollView
          style={tw`flex-1 px-4`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {requests.length === 0 ? (
            <View style={tw`flex-1 items-center justify-center py-20`}>
              <View style={tw`w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4`}>
                <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
              </View>
              <Text style={tw`text-lg font-semibold text-gray-900 mb-2`}>
                {translations[language].noRequests}
              </Text>
              <Text style={tw`text-gray-600 text-center mb-6 max-w-xs`}>
                {translations[language].noRequestsDescription}
              </Text>
              <TouchableOpacity
                style={tw`bg-blue-900 px-6 py-3 rounded-lg`}
                onPress={() => router.push('/create-parts-request')}
              >
                <Text style={tw`text-white font-semibold`}>
                  {translations[language].createRequest}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            requests.map((request) => (
              <RequestCard key={request._id} request={request} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default PartsRequestsScreen;