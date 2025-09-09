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
  Linking,
} from 'react-native';
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

// Interface for service request (same as in service-management.tsx)
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

export default function AppointmentsCalendarScreen() {
  const { language, translations } = useLanguage();
  const t = translations[language];

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAppointments, setSelectedAppointments] = useState<ServiceRequest[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ServiceRequest | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const loadServiceRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check authentication first
      const authStatus = await serviceAPI.checkAuthStatus();
      if (!authStatus.hasToken) {
        Alert.alert(
          'Authentication Required',
          'Please login to access service requests.',
          [
            { text: 'OK', onPress: () => console.log('User needs to login') }
          ]
        );
        setServiceRequests([]);
        return;
      }
      
      // For irepair, we need to get requests for their garage
      const response = await serviceAPI.getMyServiceRequests();
      if (response.success && response.data) {
        console.log('Service requests loaded:', response.data.length);
        // Log first few dates for debugging
        if (response.data.length > 0) {
          console.log('Sample dates from API:', response.data.slice(0, 3).map((req: ServiceRequest) => ({
            id: req._id,
            originalDate: req.date,
            formattedDate: new Date(req.date).toISOString().split('T')[0]
          })));
        }
        setServiceRequests(response.data);
      } else {
        setServiceRequests([]);
      }
    } catch (error) {
      console.error('Error loading service requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('authentication token')) {
        Alert.alert(
          'Authentication Required',
          'Please login to access service requests.',
          [
            { text: 'OK', onPress: () => console.log('User needs to login') }
          ]
        );
      } else {
        Alert.alert(t.error || 'Error', `Failed to load service requests: ${errorMessage}`);
      }
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    loadServiceRequests();
  }, [loadServiceRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServiceRequests();
    setRefreshing(false);
  };

  const getStatusTranslation = (status: string) => {
    const langKey = language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en';
    return statusTranslations[langKey]?.[status] || status;
  };

  // Helper function to convert Date object to YYYY-MM-DD string
  const formatDateToString = (date: Date | string) => {
    const dateObj = new Date(date);
    // Use toISOString().split('T')[0] to get consistent YYYY-MM-DD format
    // This avoids timezone issues
    return dateObj.toISOString().split('T')[0];
  };

  const onDayPress = (dateString: string) => {
    const appointments = serviceRequests.filter(request => {
      const requestDateString = formatDateToString(request.date);
      const match = requestDateString === dateString;
      console.log('Comparing:', requestDateString, 'vs', dateString, '=', match);
      return match;
    });
    setSelectedDate(dateString);
    setSelectedAppointments(appointments);
    console.log('Selected date:', dateString, 'Found appointments:', appointments.length);
    console.log('All service requests dates:', serviceRequests.map(req => formatDateToString(req.date)));
  };

  // Simple calendar component using native components
  const renderSimpleCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get dates for current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const dates = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      dates.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayAppointments = serviceRequests.filter(req => {
        return formatDateToString(req.date) === dateString;
      });
      const pendingAppointments = dayAppointments.filter(req => req.status === 'pending');
      dates.push({
        day,
        dateString,
        hasAppointments: dayAppointments.length > 0,
        appointmentCount: dayAppointments.length,
        pendingCount: pendingAppointments.length,
        hasPendingServices: pendingAppointments.length > 0,
        isToday: day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
      });
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthNamesAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const monthNamesFr = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const getMonthName = () => {
      if (language === 'ar') return monthNamesAr[currentMonth];
      if (language === 'fr') return monthNamesFr[currentMonth];
      return monthNames[currentMonth];
    };

    return (
      <View style={styles.simpleCalendar}>
        <Text style={styles.monthHeader}>
          {getMonthName()} {currentYear}
        </Text>
        
        <View style={styles.weekDays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={index} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.datesContainer}>
          {dates.map((dateInfo, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCell,
                !dateInfo && styles.emptyDateCell,
                dateInfo?.isToday && styles.todayCell,
                dateInfo?.dateString === selectedDate && styles.selectedDateCell,
                dateInfo?.hasPendingServices && styles.pendingDateCell,
              ]}
              onPress={() => dateInfo && onDayPress(dateInfo.dateString)}
              disabled={!dateInfo}
            >
              {dateInfo && (
                <>
                  <Text style={[
                    styles.dateText,
                    dateInfo.isToday && styles.todayText,
                    dateInfo.dateString === selectedDate && styles.selectedDateText,
                    dateInfo.hasPendingServices && styles.pendingDateText,
                  ]}>
                    {dateInfo.day}
                  </Text>
                  {dateInfo.hasAppointments && (
                    <View style={[
                      styles.appointmentIndicator,
                      dateInfo.hasPendingServices && styles.pendingIndicator
                    ]}>
                      <Text style={styles.appointmentCount}>
                        {dateInfo.appointmentCount}
                      </Text>
                    </View>
                  )}
                  {dateInfo.hasPendingServices && (
                    <View style={styles.pendingDot} />
                  )}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const openAppointmentModal = (appointment: ServiceRequest) => {
    setSelectedAppointment(appointment);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAppointment(null);
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

      // Update selected appointment if it's the one being updated
      if (selectedAppointment?._id === requestId) {
        setSelectedAppointment(prev => prev ? {
          ...prev,
          status: newStatus,
          description,
          actualCost,
          notes,
          statusHistory: [
            ...prev.statusHistory,
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              description: description || `Status updated to ${newStatus}`,
              updatedBy: 'irepair'
            }
          ]
        } : null);
      }

      // Update selected appointments
      setSelectedAppointments(prev =>
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
        t.success || 'Success',
        `Service status updated to ${getStatusTranslation(newStatus)}`
      );
    } catch (error) {
      console.error('Error updating service status:', error);
      Alert.alert(t.error || 'Error', 'Failed to update service status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const showStatusUpdateModal = (request: ServiceRequest) => {
    const availableStatuses = nextStatusOptions[request.status] || [];
    
    if (availableStatuses.length === 0) {
      Alert.alert(
        t.info || 'Info',
        'No status updates available for this service'
      );
      return;
    }

    const buttons = availableStatuses.map(status => ({
      text: getStatusTranslation(status),
      onPress: () => {
        if (status === 'completed' && !request.actualCost) {
          // Prompt for actual cost
          promptForCostAndNotes(request, status);
        } else {
          updateServiceStatus(request._id, status);
        }
      }
    }));

    buttons.push({
      text: t.cancel || 'Cancel',
      onPress: () => {}
    });

    Alert.alert(
      'Update Service Status',
      'Select the new status for this service',
      buttons
    );
  };

  const promptForCostAndNotes = (request: ServiceRequest, status: string) => {
    // For now, we'll use a simple alert with default values
    const carInfo = request.carDetails ? 
      `${request.carDetails.marque} ${request.carDetails.modele}` : 
      'Unknown Car';
    
    Alert.alert(
      'Service Completion',
      `Complete service for ${carInfo}?`,
      [
        { text: t.cancel || 'Cancel' },
        {
          text: t.complete || 'Complete',
          onPress: () => updateServiceStatus(
            request._id,
            status,
            'Service completed successfully',
            request.estimatedCost,
            'Service completed as scheduled'
          )
        }
      ]
    );
  };

  const handleCallCustomer = async (phoneNumber: string) => {
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      console.error('Error calling customer:', error);
      Alert.alert(
        t.error || 'Error',
        'Unable to make call. Please check the phone number.'
      );
    }
  };

  const renderAppointmentCard = (request: ServiceRequest, showDate: boolean = false) => (
    <TouchableOpacity 
      key={request._id} 
      style={styles.appointmentCard}
      onPress={() => openAppointmentModal(request)}
    >
      <View style={styles.cardHeader}>
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
              `${request.icarDetails.firstName} ${request.icarDetails.lastName}` :
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
      
      <View style={styles.appointmentDetails}>
        {showDate && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={Theme.colors.primary} />
            <Text style={styles.detailText}>
              {new Date(request.date).toLocaleDateString()}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color={Theme.colors.primary} />
          <Text style={styles.detailText}>{request.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color={Theme.colors.primary} />
          <Text style={styles.detailText}>
            {request.actualCost || request.estimatedCost || request.serviceDetails?.price || 0} TND
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAppointmentModal = () => {
    if (!selectedAppointment) return null;

    const request = selectedAppointment;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {language === 'ar' ? 'تفاصيل الموعد' : language === 'fr' ? 'Détails du rendez-vous' : 'Appointment Details'}
            </Text>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.serviceCard}>
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

                {request.description && (
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
                
                {request.icarDetails?.phoneNumber && (
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleCallCustomer(request.icarDetails!.phoneNumber)}
                  >
                    <Ionicons name="call" size={20} color={Theme.colors.primary} />
                    <Text style={styles.contactButtonText}>
                      {language === 'ar' ? 'اتصال' : language === 'fr' ? 'Appeler' : 'Call'}
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
          </ScrollView>
        </View>
      </Modal>
    );
  };

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
          {language === 'ar' ? 'تقويم المواعيد' : language === 'fr' ? 'Calendrier des rendez-vous' : 'Appointments Calendar'}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.calendarContainer}>
          {renderSimpleCalendar()}
          
          {/* Calendar Legend */}
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={styles.legendIndicator}>
                <View style={[styles.appointmentIndicator, { position: 'relative', top: 0, right: 0 }]}>
                  <Text style={styles.appointmentCount}>1</Text>
                </View>
              </View>
              <Text style={styles.legendText}>
                {language === 'ar' ? 'مواعيد' : language === 'fr' ? 'Rendez-vous' : 'Appointments'}
              </Text>
            </View>
            
            <View style={styles.legendItem}>
              <View style={styles.legendIndicator}>
                <View style={[styles.appointmentIndicator, styles.pendingIndicator, { position: 'relative', top: 0, right: 0 }]}>
                  <Text style={styles.appointmentCount}>1</Text>
                </View>
              </View>
              <Text style={styles.legendText}>
                {language === 'ar' ? 'في الانتظار' : language === 'fr' ? 'En attente' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.appointmentsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Pending Services Summary */}
          {serviceRequests.filter(req => req.status === 'pending').length > 0 && (
            <View style={styles.pendingSummary}>
              <View style={styles.pendingSummaryHeader}>
                <Ionicons name="warning" size={20} color={statusColors.pending} />
                <Text style={styles.pendingSummaryTitle}>
                  {language === 'ar' 
                    ? `${serviceRequests.filter(req => req.status === 'pending').length} خدمة في انتظار المراجعة` 
                    : language === 'fr' 
                      ? `${serviceRequests.filter(req => req.status === 'pending').length} service(s) en attente de révision`
                      : `${serviceRequests.filter(req => req.status === 'pending').length} service(s) pending review`
                  }
                </Text>
              </View>
              <Text style={styles.pendingSummarySubtitle}>
                {language === 'ar' 
                  ? 'تحتاج إلى مراجعة ومعالجة فورية' 
                  : language === 'fr' 
                    ? 'Nécessitent une révision et un traitement immédiats'
                    : 'Require immediate review and processing'
                }
              </Text>
            </View>
          )}

          {selectedDate ? (
            <>
              <View style={styles.appointmentsHeader}>
                <Text style={styles.appointmentsTitle}>
                  {language === 'ar' ? 'مواعيد' : language === 'fr' ? 'Rendez-vous pour' : 'Appointments for'} {new Date(selectedDate).toLocaleDateString()}
                </Text>
                {selectedAppointments.filter(req => req.status === 'pending').length > 0 && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>
                      {selectedAppointments.filter(req => req.status === 'pending').length} 
                      {language === 'ar' ? ' في الانتظار' : language === 'fr' ? ' en attente' : ' pending'}
                    </Text>
                  </View>
                )}
              </View>
              {selectedAppointments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={64} color={Theme.colors.textSecondary} />
                  <Text style={styles.emptyTitle}>
                    {language === 'ar' ? 'لا توجد مواعيد' : language === 'fr' ? 'Aucun rendez-vous' : 'No appointments'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {language === 'ar' ? 'لا توجد مواعيد في هذا التاريخ' : language === 'fr' ? 'Aucun rendez-vous pour cette date' : 'No appointments scheduled for this date'}
                  </Text>
                </View>
              ) : (
                selectedAppointments.map(appointment => renderAppointmentCard(appointment))
              )}
            </>
          ) : (
            <>
              <Text style={styles.appointmentsTitle}>
                {language === 'ar' ? 'جميع المواعيد القادمة' : language === 'fr' ? 'Tous les rendez-vous à venir' : 'All upcoming appointments'}
              </Text>
              {serviceRequests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={64} color={Theme.colors.textSecondary} />
                  <Text style={styles.emptyTitle}>
                    {language === 'ar' ? 'لا توجد مواعيد' : language === 'fr' ? 'Aucun rendez-vous' : 'No appointments'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {language === 'ar' ? 'ستظهر المواعيد هنا' : language === 'fr' ? 'Les rendez-vous apparaîtront ici' : 'Appointments will appear here'}
                  </Text>
                </View>
              ) : (
                // Show upcoming appointments sorted by date and time
                serviceRequests
                  .filter(req => {
                    const requestDateString = formatDateToString(req.date);
                    const todayString = formatDateToString(new Date());
                    return requestDateString >= todayString;
                  })
                  .sort((a, b) => {
                    const dateA = new Date(`${formatDateToString(a.date)} ${a.time}`);
                    const dateB = new Date(`${formatDateToString(b.date)} ${b.time}`);
                    return dateA.getTime() - dateB.getTime();
                  })
                  .slice(0, 5) // Show next 5 appointments
                  .map(appointment => renderAppointmentCard(appointment, true))
              )}
            </>
          )}
        </ScrollView>
      </View>

      {renderAppointmentModal()}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 16,
  },
  calendarContainer: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    margin: 20,
    marginBottom: 10,
    padding: 16,
    ...Theme.shadows.md,
  },
  simpleCalendar: {
    backgroundColor: Theme.colors.white,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    width: 40,
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dateCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 20,
    position: 'relative',
  },
  emptyDateCell: {
    opacity: 0,
  },
  todayCell: {
    backgroundColor: Theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  selectedDateCell: {
    backgroundColor: Theme.colors.primary,
  },
  pendingDateCell: {
    borderWidth: 2,
    borderColor: statusColors.pending,
    backgroundColor: statusColors.pending + '10',
  },
  dateText: {
    fontSize: 16,
    color: Theme.colors.text,
    fontWeight: '500',
  },
  todayText: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  selectedDateText: {
    color: Theme.colors.white,
    fontWeight: '700',
  },
  pendingDateText: {
    color: statusColors.pending,
    fontWeight: '600',
  },
  appointmentIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Theme.colors.warning,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingIndicator: {
    backgroundColor: statusColors.pending,
  },
  appointmentCount: {
    fontSize: 10,
    color: Theme.colors.white,
    fontWeight: '600',
  },
  pendingDot: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: statusColors.pending,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendIndicator: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  pendingSummary: {
    backgroundColor: statusColors.pending + '15',
    borderLeftWidth: 4,
    borderLeftColor: statusColors.pending,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginTop: 10,
  },
  pendingSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  pendingSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: statusColors.pending,
    flex: 1,
  },
  pendingSummarySubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  appointmentsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  appointmentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: statusColors.pending,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.white,
  },
  appointmentCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    ...Theme.shadows.sm,
  },
  cardHeader: {
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
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  carInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  customerInfo: {
    fontSize: 13,
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
  appointmentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginLeft: 6,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  serviceCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    ...Theme.shadows.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceDetails: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
    paddingTop: 16,
    marginBottom: 16,
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
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  updateButton: {
    flex: 1,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.primary,
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
