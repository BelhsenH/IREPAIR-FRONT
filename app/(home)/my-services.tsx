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
  text: '#1F2937', // Added for compatibility
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
  'Service de base',
  'Service complet',
  'Service constructeur',
  'Diagnostic moteur',
  'Nettoyage et entretien automobile',
  'Service de climatisation',
  'Service de transmission',
  'Service de freins',
  'Service de pneus',
  'Service de batterie',
  'Service automobile',
  'Entretien des pneus et des roues',
  'Carrosserie et peinture',
  'Service et réparation de climatisation',
  'Spa et nettoyage automobile',
  'Batteries',
  'Réclamations d’assurance',
  'Pare-brise et éclairage',
  'Embrayage et freins',
  'Nettoyage à sec',
  'Lavage de voiture',
  'Huilage',
  'Autre'
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
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    type: serviceTypes[0],
    nameFr: '',
    descriptionFr: '',
    price: '',
    duration: '',
  });
  const [durationValue, setDurationValue] = useState('1');
  const [durationUnit, setDurationUnit] = useState<'heures' | 'jours'>('heures');

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      
      // First check authentication status
      const authStatus = await serviceAPI.checkAuthStatus();
      console.log('Auth status:', authStatus);
      
      if (!authStatus.hasToken) {
        setConnectionStatus('❌ Not logged in. Please login first.');
        Alert.alert(
          'Authentication Required',
          'Please login to access your services.',
          [
            { text: 'OK', onPress: () => console.log('User needs to login') }
          ]
        );
        setServices([]);
        return;
      }
      
      if (authStatus.fixed) {
        setConnectionStatus('✅ Authentication token fixed. Retrying...');
      }
      
      const response = await serviceAPI.getMyServices();
      if (response.success && response.data) {
        setServices(response.data);
        setConnectionStatus(`✅ Loaded ${response.data.length} services successfully`);
      } else {
        setServices([]);
        setConnectionStatus('⚠️ Connected but no services found');
      }
    } catch (error) {
      console.error('Error loading services:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionStatus(`❌ Error: ${errorMessage}`);
      
      if (errorMessage.includes('authentication token')) {
        Alert.alert(
          'Authentication Required',
          'Please login to access your services.',
          [
            { text: 'Login', onPress: () => console.log('Navigate to login') },
            { text: 'Cancel' }
          ]
        );
      } else {
        Alert.alert(
          t.error || 'Error', 
          `Failed to load services: ${errorMessage}`
        );
      }
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing connection...');
      
      // First check authentication
      const authStatus = await serviceAPI.checkAuthStatus();
      if (!authStatus.hasToken) {
        setConnectionStatus('❌ No authentication token found. Please login first.');
        return;
      }
      
      // Test basic connectivity
      const testUrl = 'http://192.168.43.6:8888/api/maintenance/';
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setConnectionStatus(`✅ Server reachable at ${testUrl} & Auth token present`);
      } else {
        setConnectionStatus(`⚠️ Server responded with status: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionStatus(`❌ Connection test failed: ${errorMessage}`);
    }
  };

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
      nameFr: '',
      descriptionFr: '',
      price: '',
      duration: '',
    });
    setDurationValue('1');
    setDurationUnit('heures');
    setEditingService(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (service: Service) => {
    // Parse duration string (e.g., "2 heures" or "1 jour")
    const match = service.duration.match(/^(\d+)\s*(heure|heures|jour|jours)$/);
    let value = '1', unit: 'heures' | 'jours' = 'heures';
    if (match) {
      value = match[1];
      unit = match[2].includes('jour') ? 'jours' : 'heures';
    }
    setFormData({
      type: service.type,
      nameFr: service.nameFr,
      descriptionFr: service.descriptionFr || '',
      price: service.price.toString(),
      duration: service.duration,
    });
    setDurationValue(value);
    setDurationUnit(unit);
    setEditingService(service);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const validateForm = () => {
    if (!formData.nameFr.trim()) {
      Alert.alert(t.error || 'Erreur', 'Le nom du service est requis');
      return false;
    }
    if (!formData.price.trim() || isNaN(Number(formData.price))) {
      Alert.alert(t.error || 'Erreur', 'Le prix est requis');
      return false;
    }
    if (!durationValue.trim() || isNaN(Number(durationValue)) || Number(durationValue) <= 0) {
      Alert.alert(t.error || 'Erreur', 'La durée est requise');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Combine duration value and unit
      const durationString = `${durationValue} ${durationUnit === 'heures'
        ? (parseInt(durationValue) > 1 ? 'heures' : 'heure')
        : (parseInt(durationValue) > 1 ? 'jours' : 'jour')}`;

      const serviceData = {
        type: formData.type,
        nameFr: formData.nameFr,
        descriptionFr: formData.descriptionFr,
        price: Number(formData.price),
        duration: durationString,
      };

      let response;
      if (editingService) {
        response = await serviceAPI.updateService(editingService._id, serviceData);
      } else {
        response = await serviceAPI.createService(serviceData);
      }

      if (response.success) {
        Alert.alert(
          t.success || 'Succès',
          editingService 
            ? 'Service mis à jour avec succès'
            : 'Service créé avec succès'
        );
        closeModal();
        loadServices();
      } else {
        throw new Error(response.message || 'Échec de l\'enregistrement du service');
      }
    } catch (error) {
      console.error('Error submitting service:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert(
        t.error || 'Erreur', 
        errorMessage || 'Échec de l\'enregistrement du service'
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
                  t.success || 'Success', 
                  language === 'ar' ? 'تم حذف الخدمة بنجاح' : language === 'fr' ? 'Service supprimé avec succès' : 'Service deleted successfully'
                );
                loadServices();
              } else {
                throw new Error(response.message || 'Failed to delete service');
              }
            } catch (error) {
              console.error('Error deleting service:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert(
                t.error || 'Error', 
                errorMessage || (language === 'ar' ? 'فشل في حذف الخدمة' : language === 'fr' ? 'Échec de la suppression du service' : 'Failed to delete service')
              );
            }
          }
        }
      ]
    );
  };

  const renderServiceCard = (service: Service) => (
    <View key={service._id} style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>
            {service.nameFr}
          </Text>
          <Text style={styles.serviceType}>{service.type}</Text>
          <Text style={styles.serviceDuration}>{service.duration}</Text>
        </View>
        <View style={styles.servicePriceContainer}>
          <Text style={styles.servicePrice}>{service.price} TND</Text>
          <View style={[styles.statusBadge, { backgroundColor: service.isActive ? Colors.success : Colors.error }]}>
            <Text style={styles.statusText}>
              {service.isActive ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>
      </View>

      {service.descriptionFr && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {service.descriptionFr}
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(service)}
        >
          <Ionicons name="pencil" size={16} color={Colors.primary} />
          <Text style={styles.editButtonText}>
            {translations[language].edit}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteService(service)}
        >
          <Ionicons name="trash" size={16} color={Colors.error} />
          <Text style={styles.deleteButtonText}>
            {translations[language].delete}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddEditModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeModal}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingService 
              ? translations[language].editService
              : translations[language].addNewService
            }
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{translations[language].serviceType}</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowServiceTypePicker(true)}
              >
                <Text style={styles.pickerText}>{formData.type}</Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{translations[language].serviceName} *</Text>
            <TextInput
              style={styles.input}
              value={formData.nameFr}
              onChangeText={(text) => setFormData(prev => ({ ...prev, nameFr: text }))}
              placeholder="Entrez le nom du service en français"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{translations[language].price} (TND) *</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{translations[language].duration} *</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                value={durationValue}
                onChangeText={text => {
                  // Only allow numbers
                  if (/^\d*$/.test(text)) setDurationValue(text);
                }}
                placeholder="1"
                keyboardType="numeric"
                maxLength={3}
              />
              <TouchableOpacity
                style={[
                  styles.pickerContainer,
                  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48 }
                ]}
                onPress={() => setDurationUnit(durationUnit === 'heures' ? 'jours' : 'heures')}
              >
                <Text style={styles.pickerText}>
                  {durationUnit === 'heures' ? (parseInt(durationValue) > 1 ? 'heures' : 'heure') : (parseInt(durationValue) > 1 ? 'jours' : 'jour')}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{translations[language].serviceDescription}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descriptionFr}
              onChangeText={(text) => setFormData(prev => ({ ...prev, descriptionFr: text }))}
              placeholder="Entrez la description du service"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting
                  ? translations[language].saving
                  : editingService
                    ? translations[language].update
                    : translations[language].add
                }
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderServiceTypePicker = () => (
    <Modal
      visible={showServiceTypePicker}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowServiceTypePicker(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowServiceTypePicker(false)}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {translations[language].selectServiceType}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {serviceTypes.map((type, index) => (
            <TouchableOpacity
              key={index}
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
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {translations[language].loadingServices}
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {translations[language].myServicesTitle}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                {translations[language].noServices}
              </Text>
              <Text style={styles.emptySubtitle}>
                {translations[language].tapToAddNewService}
              </Text>
              
              {/* Debug Connection Status */}
              {connectionStatus && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugText}>{connectionStatus}</Text>
                  <TouchableOpacity style={styles.testButton} onPress={testConnection}>
                    <Text style={styles.testButtonText}>Test Connection</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            services.map(renderServiceCard)
          )}
        </ScrollView>
      </View>

      {renderAddEditModal()}
      {renderServiceTypePicker()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
    color: Colors.primary,
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
    backgroundColor: Colors.surface,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.textLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.textLight,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.surface,
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.textLight,
  },
  debugText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  testButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
