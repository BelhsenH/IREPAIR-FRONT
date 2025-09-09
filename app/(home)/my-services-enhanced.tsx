import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { serviceAPI } from '../../scripts/service-script';

// Professional color palette for mechanics
const Colors = {
  primary: '#1E3A8A', // Deep blue
  secondary: '#3B82F6', // Bright blue
  accent: '#F59E0B', // Amber/orange
  background: '#F8FAFC', // Light gray
  surface: '#FFFFFF',
  cardBackground: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5E7EB',
  inputBorder: '#D1D5DB',
  headerGradient: ['#1E3A8A', '#3B82F6'] as const,
  white: '#FFFFFF',
  error: '#EF4444',
};

interface Service {
  _id: string;
  type: string;
  name: string;
  nameAr: string;
  nameFr: string;
  description?: string;
  descriptionAr?: string;
  descriptionFr?: string;
  price: number;
  duration: string;
  includes?: string[];
  includesAr?: string[];
  includesFr?: string[];
  isActive: boolean;
  createdAt: string;
}

const serviceTypes = [
  'Basic Service',
  'Full Service',
  'Manufacturer Service',
  'Engine Diagnostic',
  'Car Detailing',
  'AC Service',
  'Transmission Service',
  'Brake Service',
  'Tire Service',
  'Battery Service',
  'Car Service',
  'Tyres and wheel Care',
  'Denting & Painting',
  'AC Service & Repair',
  'Car Spa & Cleaning',
  'Batteries',
  'Insurance Claims',
  'Windshield & Lights',
  'Clutch & Brakes',
  'Dry Cleaning',
  'Car Wash',
  'Oiling',
  'Other'
];

export default function MyServicesScreen() {
  const { language, translations } = useLanguage();
  const t = translations[language];

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showServiceTypePicker, setShowServiceTypePicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: serviceTypes[0],
    name: '',
    nameAr: '',
    nameFr: '',
    description: '',
    descriptionAr: '',
    descriptionFr: '',
    price: '',
    duration: '',
  });

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      
      // First check authentication status
      const authStatus = await serviceAPI.checkAuthStatus();
      console.log('Auth status:', authStatus);
      
      if (!authStatus.hasToken) {
        Alert.alert(t.error || 'Error', 'Authentication required. Please login again.');
        router.replace('/(auth)/Login');
        return;
      }
      
      if (authStatus.fixed) {
        console.log('Token was refreshed');
      }
      
      const response = await serviceAPI.getMyServices();
      if (response.success && response.data) {
        setServices(response.data);
      } else {
        console.error('Failed to load services:', response.error);
        Alert.alert(t.error || 'Error', response.error || 'Failed to load services');
        setServices([]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('authentication token')) {
        Alert.alert(t.error || 'Error', 'Session expired. Please login again.');
        router.replace('/(auth)/Login');
      } else {
        Alert.alert(t.error || 'Error', errorMessage || 'Failed to load services');
      }
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      type: serviceTypes[0],
      name: '',
      nameAr: '',
      nameFr: '',
      description: '',
      descriptionAr: '',
      descriptionFr: '',
      price: '',
      duration: '',
    });
    setEditingService(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (service: Service) => {
    setFormData({
      type: service.type,
      name: service.name,
      nameAr: service.nameAr,
      nameFr: service.nameFr,
      description: service.description || '',
      descriptionAr: service.descriptionAr || '',
      descriptionFr: service.descriptionFr || '',
      price: service.price.toString(),
      duration: service.duration,
    });
    setEditingService(service);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert(t.error || 'Error', 'Service name is required');
      return false;
    }
    if (!formData.nameAr.trim()) {
      Alert.alert(t.error || 'Error', 'Arabic service name is required');
      return false;
    }
    if (!formData.nameFr.trim()) {
      Alert.alert(t.error || 'Error', 'French service name is required');
      return false;
    }
    if (!formData.price.trim() || isNaN(Number(formData.price))) {
      Alert.alert(t.error || 'Error', 'Valid price is required');
      return false;
    }
    if (!formData.duration.trim()) {
      Alert.alert(t.error || 'Error', 'Duration is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      const serviceData = {
        type: formData.type,
        name: formData.name,
        nameAr: formData.nameAr,
        nameFr: formData.nameFr,
        description: formData.description,
        descriptionAr: formData.descriptionAr,
        descriptionFr: formData.descriptionFr,
        price: Number(formData.price),
        duration: formData.duration,
      };

      let response;
      if (editingService) {
        response = await serviceAPI.updateService(editingService._id, serviceData);
      } else {
        response = await serviceAPI.createService(serviceData);
      }

      if (response.success) {
        Alert.alert(
          language === 'ar' ? 'نجح' : language === 'fr' ? 'Succès' : 'Success',
          editingService 
            ? (language === 'ar' ? 'تم تحديث الخدمة بنجاح' : language === 'fr' ? 'Service mis à jour avec succès' : 'Service updated successfully')
            : (language === 'ar' ? 'تم إنشاء الخدمة بنجاح' : language === 'fr' ? 'Service créé avec succès' : 'Service created successfully')
        );
        closeModal();
        loadServices();
      } else {
        Alert.alert(t.error || 'Error', response.error || 'Failed to save service');
      }
    } catch (error) {
      console.error('Error submitting service:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        t.error || 'Error', 
        errorMessage || (language === 'ar' ? 'فشل في حفظ الخدمة' : language === 'fr' ? 'Échec de l\'enregistrement du service' : 'Failed to save service')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      language === 'ar' ? 'حذف الخدمة' : language === 'fr' ? 'Supprimer le service' : 'Delete Service',
      language === 'ar' 
        ? `هل أنت متأكد من حذف "${service.nameAr || service.name}"؟`
        : language === 'fr'
          ? `Êtes-vous sûr de vouloir supprimer "${service.nameFr || service.name}" ?`
          : `Are you sure you want to delete "${service.name}"?`,
      [
        { text: t.cancel || 'Cancel' },
        {
          text: language === 'ar' ? 'حذف' : language === 'fr' ? 'Supprimer' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await serviceAPI.deleteService(service._id);
              if (response.success) {
                Alert.alert(
                  language === 'ar' ? 'تم الحذف' : language === 'fr' ? 'Supprimé' : 'Deleted',
                  language === 'ar' ? 'تم حذف الخدمة بنجاح' : language === 'fr' ? 'Service supprimé avec succès' : 'Service deleted successfully'
                );
                loadServices();
              } else {
                Alert.alert(t.error || 'Error', response.error || 'Failed to delete service');
              }
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert(t.error || 'Error', 'Failed to delete service');
            }
          }
        }
      ]
    );
  };

  const renderServiceCard = (service: Service) => (
    <View key={service._id} style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceIconContainer}>
          <Ionicons name="construct" size={24} color={Colors.secondary} />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>
            {language === 'ar' ? service.nameAr : language === 'fr' ? service.nameFr : service.name}
          </Text>
          <Text style={styles.serviceType}>{service.type}</Text>
          <Text style={styles.serviceDuration}>{service.duration}</Text>
        </View>
        <View style={styles.servicePriceContainer}>
          <Text style={styles.servicePrice}>${service.price}</Text>
          <View style={[styles.statusBadge, { backgroundColor: service.isActive ? Colors.success : Colors.textLight }]}>
            <Text style={styles.statusText}>
              {service.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {service.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {language === 'ar' ? service.descriptionAr : language === 'fr' ? service.descriptionFr : service.description}
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(service)}
        >
          <Ionicons name="create" size={16} color={Colors.secondary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteService(service)}
        >
          <Ionicons name="trash" size={16} color={Colors.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <LinearGradient colors={Colors.headerGradient} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Services</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Enhanced Header */}
      <LinearGradient colors={Colors.headerGradient} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'خدماتي' : language === 'fr' ? 'Mes Services' : 'My Services'}
        </Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.content}>
        {services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Services Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start by adding your first service to attract customers
            </Text>
            <TouchableOpacity style={styles.addFirstServiceButton} onPress={openAddModal}>
              <LinearGradient colors={Colors.headerGradient} style={styles.addFirstServiceGradient}>
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={styles.addFirstServiceText}>Add Your First Service</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.servicesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
            showsVerticalScrollIndicator={false}
          >
            {services.map(renderServiceCard)}
          </ScrollView>
        )}
      </View>

      {/* Add/Edit Service Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
          
          <LinearGradient colors={Colors.headerGradient} style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </Text>
            <View style={styles.headerSpacer} />
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Service Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Type</Text>
              <TouchableOpacity
                style={styles.pickerContainer}
                onPress={() => setShowServiceTypePicker(true)}
              >
                <View style={styles.picker}>
                  <Text style={styles.pickerText}>{formData.type}</Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Service Names */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Name (English)</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter service name in English"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Name (Arabic)</Text>
              <TextInput
                style={styles.input}
                value={formData.nameAr}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nameAr: text }))}
                placeholder="أدخل اسم الخدمة بالعربية"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Name (French)</Text>
              <TextInput
                style={styles.input}
                value={formData.nameFr}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nameFr: text }))}
                placeholder="Entrez le nom du service en français"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            {/* Price and Duration */}
            <View style={styles.row}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Price ($)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Duration</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duration}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                  placeholder="e.g., 2 hours"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>

            {/* Descriptions */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (English)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter service description"
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textLight}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <LinearGradient colors={Colors.headerGradient} style={styles.saveButtonGradient}>
                  {submitting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color={Colors.white} />
                      <Text style={styles.saveButtonText}>
                        {editingService ? 'Update Service' : 'Create Service'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Service Type Picker Modal */}
      <Modal
        visible={showServiceTypePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowServiceTypePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.pickerModalHeader}>
            <TouchableOpacity onPress={() => setShowServiceTypePicker(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.pickerModalTitle}>Select Service Type</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.pickerModalContent}>
            {serviceTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  formData.type === type && styles.pickerOptionSelected
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, type }));
                  setShowServiceTypePicker(false);
                }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  formData.type === type && styles.pickerOptionTextSelected
                ]}>
                  {type}
                </Text>
                {formData.type === type && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  addFirstServiceButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addFirstServiceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  addFirstServiceText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  servicesList: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  descriptionContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary,
    marginLeft: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.error,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  modalButtonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  pickerModalContent: {
    flex: 1,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.background,
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  pickerOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
