import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { AuthBorderRadius, AuthColors, AuthTypography } from '../../constants/AuthTheme';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getSizeVariant = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: AuthTypography.fontSize.sm,
          iconSize: 16,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          fontSize: AuthTypography.fontSize.lg,
          iconSize: 20,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          fontSize: AuthTypography.fontSize.base,
          iconSize: 18,
        };
    }
  };

  const sizeVariant = getSizeVariant();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: AuthBorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      paddingVertical: sizeVariant.paddingVertical,
      paddingHorizontal: sizeVariant.paddingHorizontal,
      minHeight: 44,
      ...(fullWidth && { width: '100%' }),
    };

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = AuthColors.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = AuthColors.border;
        baseStyle.shadowColor = AuthColors.shadow;
        baseStyle.shadowOffset = { width: 0, height: 2 };
        baseStyle.shadowOpacity = 0.1;
        baseStyle.shadowRadius = 4;
        baseStyle.elevation = 2;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = AuthColors.primary;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      default: // primary
        baseStyle.backgroundColor = AuthColors.primary;
        baseStyle.shadowColor = AuthColors.shadow;
        baseStyle.shadowOffset = { width: 0, height: 4 };
        baseStyle.shadowOpacity = 0.2;
        baseStyle.shadowRadius = 8;
        baseStyle.elevation = 4;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.backgroundColor = AuthColors.buttonDisabled;
      baseStyle.borderColor = AuthColors.buttonDisabled;
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600' as const,
      fontSize: sizeVariant.fontSize,
      letterSpacing: 0.5,
    };

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseTextStyle.color = AuthColors.text;
        break;
      case 'outline':
      case 'ghost':
        baseTextStyle.color = AuthColors.primary;
        break;
      default: // primary
        baseTextStyle.color = AuthColors.white;
    }

    // Disabled state
    if (disabled || loading) {
      baseTextStyle.color = AuthColors.textLight;
    }

    return baseTextStyle;
  };

  const getIconColor = () => {
    if (disabled || loading) return AuthColors.textLight;
    
    switch (variant) {
      case 'secondary':
        return AuthColors.text;
      case 'outline':
      case 'ghost':
        return AuthColors.primary;
      default: // primary
        return AuthColors.white;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator
            size="small"
            color={getIconColor()}
            style={{ marginRight: 8 }}
          />
          <Text style={[getTextStyle(), textStyle]}>Loading...</Text>
        </View>
      ) : (
        <>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={sizeVariant.iconSize}
              color={getIconColor()}
              style={{ marginRight: 8 }}
            />
          )}
          
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={sizeVariant.iconSize}
              color={getIconColor()}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};
