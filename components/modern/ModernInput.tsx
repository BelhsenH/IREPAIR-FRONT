import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';

interface ModernInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  leftIcon,
  rightIcon,
  style,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  variant = 'default',
  size = 'medium',
  autoCapitalize = 'none',
  maxLength,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLabelFloating, setIsLabelFloating] = useState(!!value);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    if (!isLabelFloating && label) {
      setIsLabelFloating(true);
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    if (!value && isLabelFloating && label) {
      setIsLabelFloating(false);
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  // Handle text change
  const handleChangeText = (text: string) => {
    onChangeText(text);
    
    if (label) {
      if (text && !isLabelFloating) {
        setIsLabelFloating(true);
        Animated.timing(labelAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }).start();
      } else if (!text && !isFocused && isLabelFloating) {
        setIsLabelFloating(false);
        Animated.timing(labelAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  // Get size configuration
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          height: 44,
          fontSize: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
        };
      case 'large':
        return {
          height: 56,
          fontSize: 18,
          paddingHorizontal: 20,
          paddingVertical: 16,
        };
      default:
        return {
          height: 50,
          fontSize: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  // Container styles
  const containerStyle: ViewStyle = {
    width: '100%',
    marginBottom: 16,
    ...style,
  };

  // Input container styles
  const inputContainerStyle: ViewStyle = {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: error 
      ? '#FF3B30' 
      : isFocused 
        ? '#007AFF' 
        : 'rgba(0, 0, 0, 0.1)',
    minHeight: multiline ? undefined : sizeConfig.height,
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    paddingHorizontal: sizeConfig.paddingHorizontal,
    paddingVertical: label ? (isLabelFloating ? 20 : 12) : sizeConfig.paddingVertical,
    opacity: disabled ? 0.6 : 1,
    shadowColor: isFocused ? '#007AFF' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isFocused ? 0.15 : 0.05,
    shadowRadius: 4,
    elevation: isFocused ? 3 : 1,
  };

  // Label styles
  const labelStyle = {
    position: 'absolute' as const,
    left: leftIcon ? 44 : sizeConfig.paddingHorizontal,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [sizeConfig.height / 2 - 8, 8],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [sizeConfig.fontSize, 12],
    }),
    color: error 
      ? '#FF3B30' 
      : isFocused 
        ? '#007AFF' 
        : isLabelFloating 
          ? '#333' 
          : '#999',
    fontWeight: (isFocused || isLabelFloating) ? '600' as const : '400' as const,
    backgroundColor: 'transparent',
    zIndex: 1,
  };

  // Input text styles
  const inputStyle = {
    flex: 1,
    fontSize: sizeConfig.fontSize,
    color: '#333',
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: label && isLabelFloating ? 8 : 0,
    ...(multiline && { 
      textAlignVertical: 'top' as const,
      minHeight: 80,
    }),
  };

  // Icon styles
  const iconStyle = {
    marginRight: 8,
    opacity: disabled ? 0.5 : 1,
  };

  const rightIconStyle = {
    marginLeft: 8,
    opacity: disabled ? 0.5 : 1,
  };

  // Error text styles
  const errorTextStyle = {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500' as const,
  };

  // Determine placeholder text
  const getPlaceholder = () => {
    if (label) {
      // If there's a label, only show placeholder when label is not floating
      return !isLabelFloating ? '' : placeholder;
    }
    // If no label, show placeholder normally
    return placeholder;
  };

  return (
    <View style={containerStyle}>
      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={iconStyle}>
            {leftIcon}
          </View>
        )}
        
        {label && (
          <Animated.Text style={labelStyle}>
            {label}
          </Animated.Text>
        )}
        
        <TextInput
          style={inputStyle}
          placeholder={getPlaceholder()}
          placeholderTextColor="#999"
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          autoCorrect={false}
          spellCheck={false}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={rightIconStyle}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            disabled={disabled}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={disabled ? '#999' : '#666'}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={rightIconStyle}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={errorTextStyle}>
          {error}
        </Text>
      )}
    </View>
  );
};
