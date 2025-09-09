import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { AuthColors, AuthTypography, AuthSpacing, AuthBorderRadius, AuthShadows } from '../../constants/AuthTheme';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: AuthBorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...AuthShadows.sm,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = AuthSpacing.sm;
        baseStyle.paddingHorizontal = AuthSpacing.md;
        break;
      case 'large':
        baseStyle.paddingVertical = AuthSpacing.lg;
        baseStyle.paddingHorizontal = AuthSpacing.xl;
        break;
      default:
        baseStyle.paddingVertical = AuthSpacing.md;
        baseStyle.paddingHorizontal = AuthSpacing.lg;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = AuthColors.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = AuthColors.border;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = AuthColors.primary;
        break;
      default:
        baseStyle.backgroundColor = AuthColors.primary;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.backgroundColor = AuthColors.buttonDisabled;
      baseStyle.borderColor = AuthColors.buttonDisabled;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseTextStyle.fontSize = AuthTypography.fontSize.sm;
        break;
      case 'large':
        baseTextStyle.fontSize = AuthTypography.fontSize.lg;
        break;
      default:
        baseTextStyle.fontSize = AuthTypography.fontSize.base;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseTextStyle.color = AuthColors.text;
        break;
      case 'outline':
        baseTextStyle.color = AuthColors.primary;
        break;
      default:
        baseTextStyle.color = AuthColors.white;
    }

    // Disabled state
    if (disabled || loading) {
      baseTextStyle.color = AuthColors.textLight;
    }

    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? AuthColors.white : AuthColors.primary}
          style={{ marginRight: AuthSpacing.sm }}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};
