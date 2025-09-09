import React, { useState, useRef } from 'react';
import { View, TextInput, Text, ViewStyle, Animated, TouchableOpacity } from 'react-native';
import { AuthColors, AuthTypography, AuthSpacing, AuthBorderRadius, AuthShadows } from '../../constants/AuthTheme';
import { Ionicons } from '@expo/vector-icons';

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
  const focusAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Animations
  const handleFocus = () => {
    setIsFocused(true);
    Animated.parallel([
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  // Size variants
  const getSizeVariant = () => {
    switch (size) {
      case 'small':
        return {
          height: 40,
          fontSize: AuthTypography.fontSize.sm,
          paddingHorizontal: AuthSpacing.sm,
        };
      case 'large':
        return {
          height: 56,
          fontSize: AuthTypography.fontSize.lg,
          paddingHorizontal: AuthSpacing.lg,
        };
      default:
        return {
          height: 48,
          fontSize: AuthTypography.fontSize.base,
          paddingHorizontal: AuthSpacing.md,
        };
    }
  };

  const sizeVariant = getSizeVariant();

  // Variant styles
  const getVariantStyles = () => {
    const baseStyle = {
      borderRadius: AuthBorderRadius.lg,
      ...sizeVariant,
      minHeight: multiline ? undefined : sizeVariant.height,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: error ? '#FEF2F2' : (isFocused ? '#F8FAFC' : AuthColors.surface),
          borderWidth: 0,
          borderBottomWidth: 2,
          borderBottomColor: error ? AuthColors.error : (isFocused ? AuthColors.primary : AuthColors.border),
          borderRadius: AuthBorderRadius.md,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: error ? AuthColors.error : (isFocused ? AuthColors.primary : AuthColors.border),
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: disabled ? AuthColors.surface : AuthColors.inputBackground,
          borderWidth: 1,
          borderColor: error ? AuthColors.error : (isFocused ? AuthColors.primary : AuthColors.border),
          ...(!disabled && isFocused && AuthShadows.sm),
        };
    }
  };

  const containerStyle: ViewStyle = {
    marginBottom: AuthSpacing.md,
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    ...getVariantStyles(),
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: leftIcon ? 40 : sizeVariant.paddingHorizontal,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [sizeVariant.height / 2 - 8, -8],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [sizeVariant.fontSize, AuthTypography.fontSize.sm],
    }),
    color: error ? AuthColors.error : (isFocused ? AuthColors.primary : AuthColors.textSecondary),
    backgroundColor: variant !== 'filled' ? AuthColors.inputBackground : 'transparent',
    paddingHorizontal: 4,
    fontWeight: '500' as const,
    zIndex: 1,
  };

  const inputStyle = {
    flex: 1,
    fontSize: sizeVariant.fontSize,
    color: disabled ? AuthColors.textLight : AuthColors.text,
    paddingVertical: multiline ? AuthSpacing.sm : 0,
    paddingTop: label ? AuthSpacing.sm : 0,
    ...(multiline && { textAlignVertical: 'top' as const }),
  };

  const errorStyle = {
    fontSize: AuthTypography.fontSize.xs,
    color: AuthColors.error,
    marginTop: AuthSpacing.xs,
    marginLeft: AuthSpacing.xs,
    fontWeight: '500' as const,
  };

  const iconStyle = {
    marginHorizontal: AuthSpacing.xs,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <View style={containerStyle}>
      <View style={inputContainerStyle}>
        {leftIcon && <View style={iconStyle}>{leftIcon}</View>}
        
        {label && (
          <Animated.Text style={labelStyle}>
            {label}
          </Animated.Text>
        )}
        
        <TextInput
          style={inputStyle}
          placeholder={!label || (label && !isFocused && !value) ? undefined : placeholder}
          placeholderTextColor={AuthColors.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={iconStyle}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            disabled={disabled}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={disabled ? AuthColors.textLight : AuthColors.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && <View style={iconStyle}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
};
