import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { Text, Card, ProgressBar, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { maintenanceCarStateAPI, MaintenanceCarStateData } from '../../../../services/maintenanceCarStateAPI';

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
  error: '#EF4444',
  info: '#3B82F6',
  border: '#E5E7EB',
  inputBorder: '#D1D5DB',
  headerGradient: ['#1E3A8A', '#3B82F6'] as const,
  white: '#FFFFFF',
};

const Theme = {
  colors: Colors,
  typography: {
    fontFamily: 'System',
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

interface FormSection {
  title: string;
  fields: FormField[];
  icon: string;
  color: string;
}

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: string[];
  unit?: string;
  icon?: string;
}

export default function IRepairMaintenanceCarStateForm() {
  const { carId, maintenanceRequestId } = useLocalSearchParams();
  const { language, translations } = useLanguage();
  const t = translations[language];
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MaintenanceCarStateData>({});
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [completedFields, setCompletedFields] = useState(0);
  const [totalFields] = useState(16);
  const animatedValue = useState(new Animated.Value(0))[0];

  // Check if we're editing existing data
  useEffect(() => {
    loadExistingData();
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [carId, maintenanceRequestId]);

  // Calculate completion progress
  useEffect(() => {
    const filled = Object.keys(formData).filter(key => {
      const value = formData[key];
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== null && v !== undefined && v !== '');
      }
      return value !== null && value !== undefined && value !== '';
    }).length;
    setCompletedFields(filled);
  }, [formData]);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      const response = await maintenanceCarStateAPI.getMaintenanceCarState(carId as string, maintenanceRequestId as string);
      if (response.success) {
        setFormData(response.data);
        setIsEditMode(true);
      } else {
        if (response.message?.includes('Access denied')) {
          Alert.alert(
            t.error || 'Error',
            language === 'ar' 
              ? 'لا تملك صلاحية للوصول إلى هذا السجل. تأكد من أنك مخول للعمل على هذه السيارة.'
              : language === 'fr'
              ? 'Vous n\'avez pas l\'autorisation d\'accéder à cet enregistrement. Assurez-vous que vous êtes autorisé à travailler sur ce véhicule.'
              : 'You do not have permission to access this maintenance record. Please ensure you are authorized to work on this vehicle.',
            [
              { text: t.cancel || 'Cancel', onPress: () => router.back() },
              { text: 'Retry', onPress: loadExistingData }
            ]
          );
        } else {
          console.log('No existing data found, creating new state');
          setIsEditMode(false);
        }
      }
    } catch (error) {
      console.log('No existing data found, creating new state');
      setIsEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  const formSections: FormSection[] = [
    {
      title: language === 'ar' ? 'معلومات عامة' : language === 'fr' ? 'Informations générales' : 'General Information',
      icon: 'info',
      color: Theme.colors.info,
      fields: [
        {
          key: 'currentMileage',
          label: language === 'ar' ? 'المسافة الحالية' : language === 'fr' ? 'Kilométrage actuel' : 'Current Mileage',
          type: 'number',
          unit: 'km',
          icon: 'speedometer'
        }
      ]
    },
    {
      title: language === 'ar' ? 'زيت المحرك والمرشحات' : language === 'fr' ? 'Huile moteur et filtres' : 'Engine Oil & Filters',
      icon: 'local-gas-station',
      color: Theme.colors.warning,
      fields: [
        {
          key: 'engineOil.lastChangeKm',
          label: language === 'ar' ? 'آخر تغيير زيت المحرك (كم)' : language === 'fr' ? 'Dernier changement huile (km)' : 'Last Oil Change (km)',
          type: 'number',
          unit: 'km',
          icon: 'speedometer'
        },
        {
          key: 'engineOil.lastChangeDate',
          label: language === 'ar' ? 'تاريخ آخر تغيير زيت' : language === 'fr' ? 'Date dernier changement' : 'Last Oil Change Date',
          type: 'date',
          icon: 'calendar'
        },
        {
          key: 'engineOil.oilType',
          label: language === 'ar' ? 'نوع الزيت' : language === 'fr' ? 'Type d\'huile' : 'Oil Type',
          type: 'select',
          options: ['5W-30 synthetic', '5W-40 synthetic', '10W-40 semi-synthetic', '15W-40 mineral', 'Other'],
          icon: 'water-drop'
        },
        {
          key: 'oilFilter.lastChangeKm',
          label: language === 'ar' ? 'آخر تغيير فلتر زيت (كم)' : language === 'fr' ? 'Dernier changement filtre (km)' : 'Last Oil Filter Change (km)',
          type: 'number',
          unit: 'km',
          icon: 'filter-alt'
        },
        {
          key: 'oilFilter.lastChangeDate',
          label: language === 'ar' ? 'تاريخ آخر تغيير فلتر زيت' : language === 'fr' ? 'Date changement filtre' : 'Last Oil Filter Change Date',
          type: 'date',
          icon: 'calendar'
        }
      ]
    },
    {
      title: language === 'ar' ? 'السوائل' : language === 'fr' ? 'Fluides' : 'Fluids',
      icon: 'opacity',
      color: Theme.colors.accent,
      fields: [
        {
          key: 'coolantAntifreeze.lastReplacementDate',
          label: language === 'ar' ? 'آخر تغيير سائل التبريد' : language === 'fr' ? 'Dernier changement liquide de refroidissement' : 'Last Coolant Change',
          type: 'date',
          icon: 'ac-unit'
        },
        {
          key: 'brakeFluid.lastChangeDate',
          label: language === 'ar' ? 'آخر تغيير سائل الفرامل' : language === 'fr' ? 'Dernier changement liquide de frein' : 'Last Brake Fluid Change',
          type: 'date',
          icon: 'pan-tool'
        },
        {
          key: 'transmissionFluid.lastChangeDate',
          label: language === 'ar' ? 'آخر تغيير زيت القير' : language === 'fr' ? 'Dernier changement huile de transmission' : 'Last Transmission Fluid Change',
          type: 'date',
          icon: 'settings'
        }
      ]
    },
    {
      title: language === 'ar' ? 'الإطارات والفرامل' : language === 'fr' ? 'Pneus et freins' : 'Tires & Brakes',
      icon: 'tire-repair',
      color: Theme.colors.error,
      fields: [
        {
          key: 'tirePressure.frontPSI',
          label: language === 'ar' ? 'ضغط الإطارات الأمامية' : language === 'fr' ? 'Pression pneus avant' : 'Front Tire Pressure',
          type: 'number',
          unit: 'PSI',
          icon: 'speed'
        },
        {
          key: 'tirePressure.rearPSI',
          label: language === 'ar' ? 'ضغط الإطارات الخلفية' : language === 'fr' ? 'Pression pneus arrière' : 'Rear Tire Pressure',
          type: 'number',
          unit: 'PSI',
          icon: 'speed'
        },
        {
          key: 'tirePressure.lastCheckDate',
          label: language === 'ar' ? 'آخر فحص ضغط الإطارات' : language === 'fr' ? 'Dernière vérification pression' : 'Last Pressure Check',
          type: 'date',
          icon: 'calendar'
        },
        {
          key: 'brakePads.front.lastReplacementDate',
          label: language === 'ar' ? 'آخر تغيير فحمات الفرامل الأمامية' : language === 'fr' ? 'Dernier changement plaquettes avant' : 'Last Front Brake Pads Change',
          type: 'date',
          icon: 'stop'
        },
        {
          key: 'brakePads.rear.lastReplacementDate',
          label: language === 'ar' ? 'آخر تغيير فحمات الفرامل الخلفية' : language === 'fr' ? 'Dernier changement plaquettes arrière' : 'Last Rear Brake Pads Change',
          type: 'date',
          icon: 'stop'
        }
      ]
    },
    {
      title: language === 'ar' ? 'البطارية والكهربائيات' : language === 'fr' ? 'Batterie et électricité' : 'Battery & Electrical',
      icon: 'battery-full',
      color: Theme.colors.success,
      fields: [
        {
          key: 'battery12V.installDate',
          label: language === 'ar' ? 'تاريخ تركيب البطارية' : language === 'fr' ? 'Date installation batterie' : 'Battery Install Date',
          type: 'date',
          icon: 'calendar'
        },
        {
          key: 'battery12V.lastVoltage',
          label: language === 'ar' ? 'آخر قراءة جهد' : language === 'fr' ? 'Dernière lecture tension' : 'Last Voltage Reading',
          type: 'number',
          unit: 'V',
          icon: 'flash-on'
        }
      ]
    }
  ];

  const handleInputChange = (key: string, value: any) => {
    const keys = key.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const getFieldValue = (key: string) => {
    const keys = key.split('.');
    let value = formData;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || '';
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    return new Date(dateString);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      let response;
      if (isEditMode) {
        response = await maintenanceCarStateAPI.updateMaintenanceCarState(carId as string, maintenanceRequestId as string, formData);
      } else {
        response = await maintenanceCarStateAPI.createMaintenanceCarState(carId as string, maintenanceRequestId as string, formData);
      }
      
      if (response.success) {
        Alert.alert(
          t.success || 'Success',
          isEditMode 
            ? (language === 'ar' ? 'تم تحديث حالة السيارة بنجاح' : language === 'fr' ? 'État du véhicule mis à jour avec succès' : 'Car state updated successfully')
            : (language === 'ar' ? 'تم حفظ حالة السيارة بنجاح' : language === 'fr' ? 'État du véhicule sauvegardé avec succès' : 'Car state saved successfully'),
          [{ text: t.ok || 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(t.error || 'Error', response.message || 'Failed to save car state');
      }
    } catch (error) {
      console.error('Error saving maintenance car state:', error);
      Alert.alert(t.error || 'Error', 'Failed to save car state');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = getFieldValue(field.key);
    const hasValue = value !== null && value !== undefined && value !== '';
    
    switch (field.type) {
      case 'text':
        return (
          <View style={styles.inputContainer}>
            {field.icon && (
              <View style={styles.inputIcon}>
                <Ionicons name={field.icon as any} size={20} color={hasValue ? Theme.colors.primary : Theme.colors.textSecondary} />
              </View>
            )}
            <TextInput
              style={[styles.input, field.icon && styles.inputWithIcon, hasValue && styles.inputFilled]}
              value={value as string}
              onChangeText={(text) => handleInputChange(field.key, text)}
              placeholder={field.label}
              placeholderTextColor={Theme.colors.textSecondary}
            />
          </View>
        );
        
      case 'number':
        return (
          <View style={styles.inputContainer}>
            {field.icon && (
              <View style={styles.inputIcon}>
                <Ionicons name={field.icon as any} size={20} color={hasValue ? Theme.colors.primary : Theme.colors.textSecondary} />
              </View>
            )}
            <View style={[styles.inputWithUnit, field.icon && { marginLeft: 40 }]}>
              <TextInput
                style={[styles.input, { flex: 1 }, hasValue && styles.inputFilled]}
                value={value?.toString() || ''}
                onChangeText={(text) => handleInputChange(field.key, text ? parseFloat(text) : undefined)}
                placeholder={field.label}
                placeholderTextColor={Theme.colors.textSecondary}
                keyboardType="numeric"
              />
              {field.unit && (
                <View style={styles.unitContainer}>
                  <Text style={styles.unitLabel}>{field.unit}</Text>
                </View>
              )}
            </View>
          </View>
        );
        
      case 'date':
        return (
          <View style={styles.inputContainer}>
            {field.icon && (
              <View style={styles.inputIcon}>
                <Ionicons name={field.icon as any} size={20} color={hasValue ? Theme.colors.primary : Theme.colors.textSecondary} />
              </View>
            )}
            <TouchableOpacity
              style={[styles.dateInput, field.icon && styles.inputWithIcon, hasValue && styles.inputFilled]}
              onPress={() => setShowDatePicker(field.key)}
            >
              <Text style={[styles.dateText, !value && styles.placeholderText]}>
                {value ? new Date(value).toLocaleDateString() : field.label}
              </Text>
              <View style={styles.dateIcon}>
                <Ionicons name="calendar-outline" size={20} color={hasValue ? Theme.colors.primary : Theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
            
            {showDatePicker === field.key && (
              <DateTimePicker
                value={value ? parseDate(value as string) : new Date()}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  setShowDatePicker(null);
                  if (selectedDate) {
                    handleInputChange(field.key, formatDate(selectedDate));
                  }
                }}
                maximumDate={new Date()}
              />
            )}
          </View>
        );
        
      default:
        return null;
    }
  };

  const ModernButton = ({ title, onPress, loading, style }: {
    title: string;
    onPress: () => void;
    loading?: boolean;
    style?: any;
  }) => (
    <TouchableOpacity
      style={[
        {
          backgroundColor: Theme.colors.success,
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: loading ? 0.7 : 1,
        },
        style
      ]}
      onPress={onPress}
      disabled={loading}
    >
      <Text style={{
        color: Theme.colors.white,
        fontSize: 16,
        fontWeight: '600'
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={[Theme.colors.primary, Theme.colors.secondary]}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.header, 
          {
            opacity: animatedValue,
            transform: [{
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            }]
          }
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isEditMode 
              ? (language === 'ar' ? 'تحديث حالة السيارة' : language === 'fr' ? 'Mettre à jour l\'état' : 'Update Car State')
              : (language === 'ar' ? 'حالة السيارة' : language === 'fr' ? 'État du véhicule' : 'Car State')
            }
          </Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {Math.round((completedFields / totalFields) * 100)}% {language === 'ar' ? 'مكتمل' : language === 'fr' ? 'terminé' : 'complete'}
            </Text>
            <ProgressBar 
              progress={completedFields / totalFields} 
              color={Theme.colors.accent}
              style={styles.progressBar}
            />
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {formSections.map((section, sectionIndex) => (
            <Animated.View 
              key={sectionIndex} 
              style={[
                styles.section,
                {
                  opacity: animatedValue,
                  transform: [{
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: section.color + '20' }]}>
                  <MaterialIcons name={section.icon as any} size={24} color={section.color} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionStatus}>
                  <Chip 
                    mode="outlined"
                    textStyle={styles.chipText}
                    style={[styles.chip, { borderColor: section.color }]}
                  >
                    {section.fields.filter(field => getFieldValue(field.key)).length}/{section.fields.length}
                  </Chip>
                </View>
              </View>
              
              {section.fields.map((field, fieldIndex) => (
                <View key={fieldIndex} style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>
                    {field.label}
                    {field.required && <Text style={styles.required}> *</Text>}
                  </Text>
                  {renderField(field)}
                </View>
              ))}
            </Animated.View>
          ))}
          
          <View style={styles.additionalSection}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'ملاحظات إضافية' : language === 'fr' ? 'Notes supplémentaires' : 'Additional Notes'}
            </Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {language === 'ar' ? 'حوادث حديثة' : language === 'fr' ? 'Accidents récents' : 'Recent Accidents'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.additionalDetails?.recentAccidents || ''}
                onChangeText={(text) => handleInputChange('additionalDetails.recentAccidents', text)}
                placeholder={language === 'ar' ? 'اذكر أي حوادث حديثة...' : language === 'fr' ? 'Mentionner les accidents récents...' : 'Mention any recent accidents...'}
                placeholderTextColor={Theme.colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {language === 'ar' ? 'تعديلات مخصصة' : language === 'fr' ? 'Modifications personnalisées' : 'Custom Modifications'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.additionalDetails?.customModifications || ''}
                onChangeText={(text) => handleInputChange('additionalDetails.customModifications', text)}
                placeholder={language === 'ar' ? 'اذكر أي تعديلات...' : language === 'fr' ? 'Mentionner les modifications...' : 'Mention any modifications...'}
                placeholderTextColor={Theme.colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {language === 'ar' ? 'ملاحظات أخرى' : language === 'fr' ? 'Autres notes' : 'Other Notes'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.additionalDetails?.otherNotes || ''}
                onChangeText={(text) => handleInputChange('additionalDetails.otherNotes', text)}
                placeholder={language === 'ar' ? 'أي ملاحظات إضافية...' : language === 'fr' ? 'Notes supplémentaires...' : 'Any additional notes...'}
                placeholderTextColor={Theme.colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <ModernButton
            title={isEditMode 
              ? (t.update || 'Update')
              : (t.save || 'Save')
            }
            onPress={handleSubmit}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
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
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Theme.shadows.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    flex: 1,
  },
  sectionStatus: {
    marginLeft: 8,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 16,
    color: Theme.colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  required: {
    color: Theme.colors.error,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    top: 15,
    zIndex: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: Theme.colors.textLight,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: Theme.colors.text,
    backgroundColor: Theme.colors.surface,
  },
  inputWithIcon: {
    paddingLeft: 50,
  },
  inputFilled: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.white,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitContainer: {
    backgroundColor: Theme.colors.primary + '10',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 10,
  },
  unitLabel: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  dateInput: {
    borderWidth: 2,
    borderColor: Theme.colors.textLight,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  dateIcon: {
    padding: 4,
  },
  dateText: {
    fontSize: 16,
    color: Theme.colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Theme.colors.textSecondary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  additionalSection: {
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 100,
    ...Theme.shadows.lg,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    ...Theme.shadows.lg,
  },
  saveButton: {
    backgroundColor: Theme.colors.success,
    borderRadius: 16,
    paddingVertical: 16,
  },
});