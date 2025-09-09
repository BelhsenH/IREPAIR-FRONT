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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- Add this import
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { ModernButton } from '../../components/modern/ModernButton';
import { serviceAPI } from '../../scripts/service-script';

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

// Interface for service request
interface ServiceRequest {
  _id: string;
  carDetails?: {
    _id: string;
    marque: string;
    modele: string;
    numeroImmatriculation: string;
    vin: string;
    fuelType: string;
  };
  icarDetails?: {
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
  serviceDetails?: {
    _id: string;
    name: string;
    nameAr: string;
    nameFr: string;
    type: string;
    price: number;
    duration: string;
    description: string;
  };
  status: string;
  date: string;
  time: string;
  estimatedCost?: number;
  actualCost?: number;
  description?: string;
  notes?: string;
  paymentMethod: string;
  statusHistory: {
    status: string;
    timestamp: string;
    description?: string;
    updatedBy: string;
  }[];
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: '#F39C12',
  accepted: '#3498DB',
  in_progress: '#9B59B6',
  no_parts: '#E74C3C',
  installing: '#8E44AD',
  ready_to_drop: '#27AE60',
  completed: '#2ECC71',
  cancelled: '#95A5A6',
};

const statusTranslations: Record<string, Record<string, string>> = {
  en: {
    pending: 'Pending Review',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    no_parts: 'Waiting for Parts',
    installing: 'Installing Parts',
    ready_to_drop: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled',
  },
  fr: {
    pending: 'En attente de révision',
    accepted: 'Accepté',
    in_progress: 'En cours',
    no_parts: 'En attente de pièces',
    installing: 'Installation des pièces',
    ready_to_drop: 'Prêt pour récupération',
    completed: 'Terminé',
    cancelled: 'Annulé',
  },
  ar: {
    pending: 'في انتظار المراجعة',
    accepted: 'مقبول',
    in_progress: 'قيد التنفيذ',
    no_parts: 'في انتظار القطع',
    installing: 'تركيب القطع',
    ready_to_drop: 'جاهز للاستلام',
    completed: 'مكتمل',
    cancelled: 'ملغى',
  },
};

const nextStatusOptions: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'no_parts', 'cancelled'],
  in_progress: ['installing', 'no_parts', 'ready_to_drop'],
  no_parts: ['in_progress', 'installing'],
  installing: ['ready_to_drop', 'completed'],
  ready_to_drop: ['completed'],
  completed: [],
  cancelled: [],
};

export default function ServiceManagementScreen() {
  const { language, translations } = useLanguage();
  const t = translations[language];

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalRequest, setStatusModalRequest] = useState<ServiceRequest | null>(null);

  const loadServiceRequests = useCallback(async () => {
    try {
      setLoading(true);

      // Check authentication first
      const authStatus = await serviceAPI.checkAuthStatus();
      if (!authStatus.hasToken) {
        Alert.alert(
          t.authRequired || (language === 'ar' ? 'مطلوب تسجيل الدخول' : language === 'fr' ? 'Authentification requise' : 'Authentication Required'),
          t.pleaseLogin || (language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى طلبات الخدمة.' : language === 'fr' ? 'Veuillez vous connecter pour accéder aux demandes de service.' : 'Please login to access service requests.'),
          [
            { text: t.ok || (language === 'ar' ? 'حسنًا' : language === 'fr' ? 'OK' : 'OK'), onPress: () => console.log('User needs to login') }
          ]
        );
        setServiceRequests([]);
        return;
      }

      // For irepair, we need to get requests for their garage
      const response = await serviceAPI.getMyServiceRequests();
      if (response.success && response.data) {
        setServiceRequests(response.data);
      } else {
        setServiceRequests([]);
      }
    } catch (error) {
      console.error('Error loading service requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('authentication token')) {
        Alert.alert(
          t.authRequired || (language === 'ar' ? 'مطلوب تسجيل الدخول' : language === 'fr' ? 'Authentification requise' : 'Authentication Required'),
          t.pleaseLogin || (language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى طلبات الخدمة.' : language === 'fr' ? 'Veuillez vous connecter pour accéder aux demandes de service.' : 'Please login to access service requests.'),
          [
            { text: t.ok || (language === 'ar' ? 'حسنًا' : language === 'fr' ? 'OK' : 'OK'), onPress: () => console.log('User needs to login') }
          ]
        );
      } else {
        Alert.alert(
          t.error || (language === 'ar' ? 'خطأ' : language === 'fr' ? 'Erreur' : 'Error'),
          (t.failedToLoadServiceRequests || (language === 'ar' ? 'فشل تحميل طلبات الخدمة: ' : language === 'fr' ? 'Échec du chargement des demandes de service: ' : 'Failed to load service requests: ')) + errorMessage
        );
      }
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  }, [t, language]);

  useEffect(() => {
    loadServiceRequests();
  }, [loadServiceRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServiceRequests();
    setRefreshing(false);
  };

  const updateServiceStatus = async (
    requestId: string,
    newStatus: string,
    description?: string,
    actualCost?: number,
    notes?: string
  ) => {
    try {
      setUpdatingStatus(requestId);

      await serviceAPI.updateServiceRequestStatus(
        requestId,
        newStatus,
        description,
        actualCost,
        notes
      );

      // Update local state
      setServiceRequests(prev =>
        prev.map(request =>
          request._id === requestId
            ? {
                ...request,
                status: newStatus,
                description,
                actualCost,
                notes,
                statusHistory: [
                  ...request.statusHistory,
                  {
                    status: newStatus,
                    timestamp: new Date().toISOString(),
                    description: description || `Status updated to ${newStatus}`,
                    updatedBy: 'irepair'
                  }
                ]
              }
            : request
        )
      );

      Alert.alert(
        t.success || (language === 'ar' ? 'نجاح' : language === 'fr' ? 'Succès' : 'Success'),
        (t.serviceStatusUpdated || (language === 'ar' ? 'تم تحديث حالة الخدمة إلى ' : language === 'fr' ? 'Statut du service mis à jour vers ' : 'Service status updated to ')) + getStatusTranslation(newStatus)
      );
    } catch (error) {
      console.error('Error updating service status:', error);
      Alert.alert(
        t.error || (language === 'ar' ? 'خطأ' : language === 'fr' ? 'Erreur' : 'Error'),
        t.failedToUpdateServiceStatus || (language === 'ar' ? 'فشل في تحديث حالة الخدمة' : language === 'fr' ? 'Échec de la mise à jour du statut du service' : 'Failed to update service status')
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusTranslation = (status: string) => {
    const langKey = language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en';
    return statusTranslations[langKey]?.[status] || status;
  };

  const showStatusUpdateModal = (request: ServiceRequest) => {
    setStatusModalRequest(request);
    setStatusModalVisible(true);
  };

  const handleStatusSelect = (status: string) => {
    if (statusModalRequest) {
      if (status === 'completed' && !statusModalRequest.actualCost) {
        promptForCostAndNotes(statusModalRequest, status);
      } else {
        updateServiceStatus(statusModalRequest._id, status);
      }
    }
    setStatusModalVisible(false);
  };

  const promptForCostAndNotes = (request: ServiceRequest, status: string) => {
    // For now, we'll use a simple alert with default values
    // In a real app, you'd want a proper modal with input fields
    const carInfo = request.carDetails ? 
      `${request.carDetails.marque} ${request.carDetails.modele}` : 
      (t.unknownCar || (language === 'ar' ? 'سيارة غير معروفة' : language === 'fr' ? 'Voiture inconnue' : 'Unknown Car'));

    Alert.alert(
      t.serviceCompletion || (language === 'ar' ? 'إكمال الخدمة' : language === 'fr' ? 'Terminer le service' : 'Service Completion'),
      (t.completeServiceFor || (language === 'ar' ? 'إكمال الخدمة لـ ' : language === 'fr' ? 'Terminer le service pour ' : 'Complete service for ')) + carInfo + '?',
      [
        { text: t.cancel || (language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel') },
        {
          text: t.complete || (language === 'ar' ? 'إكمال' : language === 'fr' ? 'Terminer' : 'Complete'),
          onPress: () => updateServiceStatus(
            request._id,
            status,
            t.serviceCompletedSuccessfully || (language === 'ar' ? 'تم إكمال الخدمة بنجاح' : language === 'fr' ? 'Service terminé avec succès' : 'Service completed successfully'),
            request.estimatedCost,
            t.serviceCompletedAsScheduled || (language === 'ar' ? 'تم إكمال الخدمة حسب الجدول' : language === 'fr' ? 'Service terminé comme prévu' : 'Service completed as scheduled')
          )
        }
      ]
    );
  };

  const handleCallCustomer = async (phoneNumber: string) => {
    try {
      await serviceAPI.callCustomer(phoneNumber);
    } catch (error) {
      console.error('Error calling customer:', error);
      Alert.alert(
        t.error || (language === 'ar' ? 'خطأ' : language === 'fr' ? 'Erreur' : 'Error'),
        t.unableToMakeCall || (language === 'ar' ? 'تعذر إجراء المكالمة. يرجى التحقق من رقم الهاتف.' : language === 'fr' ? 'Impossible de passer l\'appel. Veuillez vérifier le numéro de téléphone.' : 'Unable to make call. Please check the phone number.')
      );
    }
  };

  const renderServiceCard = (request: ServiceRequest) => (
    <View key={request._id} style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>
            {language === 'ar' 
              ? request.serviceDetails?.nameAr 
              : language === 'fr' 
                ? request.serviceDetails?.nameFr 
                : request.serviceDetails?.name || 'Unknown Service'
            }
          </Text>
          <Text style={styles.carInfo}>
            {request.carDetails ? 
              `${request.carDetails.marque} ${request.carDetails.modele} • ${request.carDetails.numeroImmatriculation}` :
              'Unknown Car'
            }
          </Text>
          <Text style={styles.customerInfo}>
            {request.icarDetails ? 
              `${request.icarDetails.firstName} ${request.icarDetails.lastName} • ${request.icarDetails.phoneNumber}` :
              'Unknown Customer'
            }
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[request.status] || statusColors.pending }
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusTranslation(request.status)}
          </Text>
        </View>
      </View>

      <View style={styles.serviceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            {language === 'ar' ? 'التاريخ والوقت:' : language === 'fr' ? 'Date et heure:' : 'Date & Time:'}
          </Text>
          <Text style={styles.detailValue}>
            {new Date(request.date).toLocaleDateString()} • {request.time}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            {language === 'ar' ? 'المدة المتوقعة:' : language === 'fr' ? 'Durée estimée:' : 'Duration:'}
          </Text>
          <Text style={styles.detailValue}>{request.serviceDetails?.duration || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            {language === 'ar' ? 'التكلفة:' : language === 'fr' ? 'Coût:' : 'Cost:'}
          </Text>
          <Text style={styles.detailValue}>
            {request.actualCost || request.estimatedCost || request.serviceDetails?.price || 0} TND
            {request.actualCost && request.actualCost !== request.estimatedCost && (
              <Text style={styles.costNote}> (final)</Text>
            )}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            {language === 'ar' ? 'الدفع:' : language === 'fr' ? 'Paiement:' : 'Payment:'}
          </Text>
          <Text style={styles.detailValue}>
            {request.paymentMethod === 'cash'
              ? (language === 'ar' ? 'نقد' : language === 'fr' ? 'Espèces' : 'Cash')
              : (language === 'ar' ? 'بطاقة' : language === 'fr' ? 'Carte' : 'Card')
            }
          </Text>
        </View>

        {request.description && request.description.trim() !== '' && !request.description.toLowerCase().includes('undefined') && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>
              {language === 'ar' ? 'الوصف:' : language === 'fr' ? 'Description:' : 'Description:'}
            </Text>
            <Text style={styles.descriptionText}>{request.description}</Text>
          </View>
        )}

        {request.notes && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>
              {language === 'ar' ? 'ملاحظات:' : language === 'fr' ? 'Notes:' : 'Notes:'}
            </Text>
            <Text style={styles.descriptionText}>{request.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <ModernButton
          title={
            updatingStatus === request._id
              ? (language === 'ar' ? 'جاري التحديث...' : language === 'fr' ? 'Mise à jour...' : 'Updating...')
              : (language === 'ar' ? 'تحديث الحالة' : language === 'fr' ? 'Mettre à jour' : 'Update Status')
          }
          onPress={() => showStatusUpdateModal(request)}
          disabled={updatingStatus === request._id || request.status === 'completed' || request.status === 'cancelled'}
          style={styles.updateButton}
        />
        
        {/* View/Edit Car State Button */}
        {request.carDetails?._id && (
          <TouchableOpacity
            style={styles.carStateButton}
            onPress={() => router.push(`/(home)/maintenance-car-state/${request.carDetails._id}/${request._id}` as any)}
          >
            <Ionicons name="car" size={20} color={Theme.colors.accent} />
            <Text style={styles.carStateButtonText}>
              {language === 'ar' ? 'حالة السيارة' : language === 'fr' ? 'État véhicule' : 'Car State'}
            </Text>
          </TouchableOpacity>
        )}
        
        {request.icarDetails?.phoneNumber && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleCallCustomer(request.icarDetails!.phoneNumber)}
          >
            <Ionicons name="call" size={20} color={Theme.colors.primary} />
            <Text style={styles.contactButtonText}>
              {language === 'ar' ? 'اتصل' : language === 'fr' ? 'Appeler' : 'Call'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {request.statusHistory.length > 1 && (
        <View style={styles.statusHistory}>
          <Text style={styles.historyTitle}>
            {language === 'ar' ? 'تاريخ الحالة:' : language === 'fr' ? 'Historique:' : 'Status History:'}
          </Text>
          {request.statusHistory.slice(-3).map((history, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyStatus}>{getStatusTranslation(history.status)}</Text>
              <Text style={styles.historyTime}>
                {new Date(history.timestamp).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>
          {language === 'ar' ? 'جاري التحميل...' : language === 'fr' ? 'Chargement...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.secondary]}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'إدارة الخدمات' : language === 'fr' ? 'Gestion des services' : 'Service Management'}
          </Text>
        </View>

        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {serviceRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="construct-outline" size={64} color={Theme.colors.textSecondary} />
                <Text style={styles.emptyTitle}>
                  {language === 'ar' ? 'لا توجد طلبات خدمة' : language === 'fr' ? 'Aucune demande de service' : 'No Service Requests'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {language === 'ar' 
                    ? 'ستظهر طلبات الخدمة الجديدة هنا' 
                    : language === 'fr' 
                      ? 'Les nouvelles demandes de service apparaîtront ici'
                      : 'New service requests will appear here'
                  }
                </Text>
              </View>
            ) : (
              serviceRequests.map(renderServiceCard)
            )}
          </ScrollView>
        </View>

        <Modal
          visible={statusModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              width: '85%',
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                {t.updateServiceStatus || (language === 'ar' ? 'تحديث حالة الخدمة' : language === 'fr' ? 'Mettre à jour le statut du service' : 'Update Service Status')}
              </Text>
              <Text style={{ fontSize: 15, color: '#666', marginBottom: 20, textAlign: 'center' }}>
                {t.selectNewStatus || (language === 'ar' ? 'اختر الحالة الجديدة لهذه الخدمة' : language === 'fr' ? 'Sélectionnez le nouveau statut pour ce service' : 'Select the new status for this service')}
              </Text>
              {statusModalRequest && (nextStatusOptions[statusModalRequest.status] || []).map(status => (
                <TouchableOpacity
                  key={status}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 8,
                    backgroundColor: statusColors[status] || '#eee',
                    marginBottom: 10,
                    alignItems: 'center'
                  }}
                  onPress={() => handleStatusSelect(status)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    {getStatusTranslation(status)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: '#eee',
                  width: '100%',
                  alignItems: 'center'
                }}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={{ color: '#333', fontWeight: 'bold' }}>
                  {t.cancel || (language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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
    color: Theme.colors.textSecondary,
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
    color: Theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    ...Theme.shadows.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  carInfo: {
    fontSize: 16,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  customerInfo: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.white,
  },
  serviceDetails: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
    paddingTop: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  costNote: {
    fontSize: 12,
    color: Theme.colors.success,
  },
  descriptionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  updateButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    minHeight: 48,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Theme.colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    ...Theme.shadows.sm,
    minHeight: 48,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginLeft: 8,
  },
  carStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Theme.colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B', // Theme.colors.accent equivalent
    ...Theme.shadows.sm,
    minHeight: 48,
  },
  carStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F59E0B', // Theme.colors.accent equivalent
    marginLeft: 8,
  },
  statusHistory: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
    paddingTop: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  historyStatus: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  historyTime: {
    fontSize: 12,
    color: Theme.colors.textLight,
  },
});
