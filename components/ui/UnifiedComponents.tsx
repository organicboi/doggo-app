/**
 * DogoApp Unified Component System
 * Consistent UI components using the design system
 */

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { ComponentVariants, getColorWithOpacity, Theme } from '../../lib/theme';

// =============================================================================
// BUTTON COMPONENT
// =============================================================================
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  gradient?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  gradient = false,
  style,
  textStyle,
}) => {
  const buttonVariant = ComponentVariants.button[variant];
  
  const sizes = {
    small: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 36 },
    medium: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 48 },
    large: { paddingHorizontal: 32, paddingVertical: 16, minHeight: 56 },
  };

  const textSizes = {
    small: Theme.typography.labelMedium,
    medium: Theme.typography.labelLarge,
    large: Theme.typography.titleSmall,
  };

  const gradients: Record<string, [string, string]> = {
    primary: Theme.gradients.primary as [string, string],
    secondary: Theme.gradients.success as [string, string],
    outline: ['transparent', 'transparent'] as [string, string],
    ghost: ['transparent', 'transparent'] as [string, string],
  };

  const buttonStyles = [
    styles.button,
    buttonVariant,
    sizes[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const renderContent = () => (
    <>
      {icon && iconPosition === 'left' && (
        <MaterialIcons 
          name={icon} 
          size={textSizes[size].fontSize + 2} 
          color={buttonVariant.color} 
          style={{ marginRight: 8 }} 
        />
      )}
      
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={buttonVariant.color} 
        />
      ) : (
        <Text style={[textSizes[size], { color: buttonVariant.color }, textStyle]}>
          {title}
        </Text>
      )}
      
      {icon && iconPosition === 'right' && (
        <MaterialIcons 
          name={icon} 
          size={textSizes[size].fontSize + 2} 
          color={buttonVariant.color} 
          style={{ marginLeft: 8 }} 
        />
      )}
    </>
  );

  if (gradient && (variant === 'primary' || variant === 'secondary')) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradients[variant]}
          style={[buttonStyles, { backgroundColor: 'transparent' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.buttonContent}>
            {renderContent()}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={buttonStyles}
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {renderContent()}
      </View>
    </TouchableOpacity>
  );
};

// =============================================================================
// CARD COMPONENT
// =============================================================================
interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  style,
  onPress,
  padding = Theme.spacing.card.padding,
}) => {
  const cardVariant = ComponentVariants.card[variant];
  
  const cardStyles = [
    styles.card,
    cardVariant,
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

// =============================================================================
// CHIP COMPONENT
// =============================================================================
interface ChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  color?: string;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  onPress,
  selected = false,
  icon,
  color = Theme.colors.primary,
  variant = 'filled',
  size = 'medium',
  style,
}) => {
  const sizes = {
    small: { paddingHorizontal: 12, paddingVertical: 4, height: 24 },
    medium: { paddingHorizontal: 16, paddingVertical: 8, height: 32 },
  };

  const textSizes = {
    small: Theme.typography.labelSmall,
    medium: Theme.typography.labelMedium,
  };

  const backgroundColor = variant === 'filled' 
    ? selected ? color : getColorWithOpacity(color, 0.1)
    : 'transparent';

  const borderColor = variant === 'outlined' ? color : 'transparent';
  const textColor = variant === 'filled' && selected ? '#ffffff' : color;

  const chipStyles = [
    styles.chip,
    sizes[size],
    {
      backgroundColor,
      borderColor,
      borderWidth: variant === 'outlined' ? 1 : 0,
    },
    style,
  ];

  const content = (
    <>
      {icon && (
        <MaterialIcons 
          name={icon} 
          size={textSizes[size].fontSize} 
          color={textColor}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[textSizes[size], { color: textColor }]}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        style={chipStyles}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.chipContent}>
          {content}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={chipStyles}>
      <View style={styles.chipContent}>
        {content}
      </View>
    </View>
  );
};

// =============================================================================
// FLOATING ACTION BUTTON
// =============================================================================
interface FABProps {
  onPress: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  size?: 'normal' | 'large';
  extended?: boolean;
  label?: string;
  color?: string;
  position?: 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';
  style?: ViewStyle;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  icon,
  size = 'normal',
  extended = false,
  label,
  color = Theme.colors.primary,
  position = 'bottomRight',
  style,
}) => {
  const sizes = {
    normal: { width: 56, height: 56, borderRadius: 28 },
    large: { width: 64, height: 64, borderRadius: 32 },
  };

  const positions = {
    bottomRight: { position: 'absolute' as const, bottom: 16, right: 16 },
    bottomLeft: { position: 'absolute' as const, bottom: 16, left: 16 },
    topRight: { position: 'absolute' as const, top: 16, right: 16 },
    topLeft: { position: 'absolute' as const, top: 16, left: 16 },
  };

  const fabStyles: ViewStyle = StyleSheet.flatten([
    styles.fab,
    sizes[size],
    positions[position],
    { backgroundColor: color },
    extended && { paddingHorizontal: 20 },
    style,
  ]);

  return (
    <TouchableOpacity 
      style={fabStyles}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[color, `${color}dd`] as [string, string]}
        style={[StyleSheet.absoluteFillObject, { borderRadius: sizes[size].borderRadius }]}
      />
      <View style={styles.fabContent}>
        <MaterialIcons name={icon} size={24} color="white" />
        {extended && label && (
          <Text style={[Theme.typography.labelLarge, { color: 'white', marginLeft: 8 }]}>
            {label}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// =============================================================================
// SECTION HEADER
// =============================================================================
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
  icon,
  style,
}) => {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionHeaderContent}>
        <View style={styles.sectionHeaderLeft}>
          {icon && (
            <MaterialIcons 
              name={icon} 
              size={24} 
              color={Theme.colors.onSurface}
              style={{ marginRight: 8 }}
            />
          )}
          <View>
            <Text style={[Theme.typography.titleLarge, { color: Theme.colors.onSurface }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[Theme.typography.bodyMedium, { color: Theme.colors.onSurfaceVariant }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        
        {actionText && onActionPress && (
          <TouchableOpacity onPress={onActionPress}>
            <Text style={[Theme.typography.labelLarge, { color: Theme.colors.primary }]}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// =============================================================================
// STATS CARD
// =============================================================================
interface StatsCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string | number;
  label: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  color?: string;
  style?: ViewStyle;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  value,
  label,
  trend,
  color = Theme.colors.primary,
  style,
}) => {
  return (
    <Card variant="elevated" style={[styles.statsCard, style]}>
      <View style={styles.statsCardContent}>
        <View style={[styles.statsIconContainer, { backgroundColor: getColorWithOpacity(color, 0.1) }]}>
          <MaterialIcons name={icon} size={24} color={color} />
        </View>
        
        <Text style={[Theme.typography.headlineSmall, { color: Theme.colors.onSurface }]}>
          {value}
        </Text>
        
        <Text style={[Theme.typography.bodyMedium, { color: Theme.colors.onSurfaceVariant }]}>
          {label}
        </Text>
        
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={trend.direction === 'up' ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={trend.direction === 'up' ? Theme.colors.secondary : Theme.colors.error}
            />
            <Text style={[
              Theme.typography.labelSmall, 
              { 
                color: trend.direction === 'up' ? Theme.colors.secondary : Theme.colors.error,
                marginLeft: 4,
              }
            ]}>
              {trend.value}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  // Button styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.button,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },

  // Card styles
  card: {
    borderRadius: Theme.borderRadius.card,
  },

  // Chip styles
  chip: {
    borderRadius: Theme.borderRadius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FAB styles
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.lg,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section header styles
  sectionHeader: {
    marginBottom: Theme.spacing.md,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // Stats card styles
  statsCard: {
    alignItems: 'center',
    minWidth: 120,
  },
  statsCardContent: {
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getColorWithOpacity(Theme.colors.secondary, 0.1),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

// =============================================================================
// EXPORTS
// =============================================================================
export * from '../../lib/theme';
export {
    Button as DogoButton,
    Card as DogoCard,
    Chip as DogoChip,
    FAB as DogoFAB,
    SectionHeader as DogoSectionHeader,
    StatsCard as DogoStatsCard
};

