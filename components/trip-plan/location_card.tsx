import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { useAppTheme } from '@/providers/style_provider';
import { useFeathers } from '@/providers/feathers_provider';
import { Attraction, GeoPoint } from '@/models';
import { useLocalizedText } from '@/hooks/useLocalizedText';
import { getThumb } from '@/plugins/utils';
import { LocationIcon } from '@/components/icons';

export interface LocationCardProps {
  label: string;
  service: string;
  id: string;
  onPress: () => void;
}

export default function LocationCard({ label, service, id, onPress }: LocationCardProps) {
  const { theme } = useAppTheme();
  const feathers = useFeathers();
  const localize = useLocalizedText();
  const [locationData, setLocationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Resolve any image-like value to a valid Image source or undefined
  const resolveImageSource = (value: any): any => {
    if (!value) return undefined;
    if (typeof value === 'number') return value; // require() result
    if (Array.isArray(value)) return resolveImageSource(value[0]);

    // String cases: URL or attachment id
    if (typeof value === 'string') {
      const isUrl = /^https?:\/\//i.test(value) || value.startsWith('data:');
      return { uri: isUrl ? value : getThumb(value) };
    }

    // Object cases
    if (typeof value === 'object') {
      // Feathers attachment object
      if (value._id) return { uri: getThumb(value) };
      // Localized { en, hy, ru }
      const localizedVal = value.en || value.hy || value.ru;
      if (typeof localizedVal === 'string') {
        const isUrl = /^https?:\/\//i.test(localizedVal) || localizedVal.startsWith('data:');
        return { uri: isUrl ? localizedVal : getThumb(localizedVal) };
      }
      // Generic url fields
      const url = value.url || value.uri || value.secure_url || value.imageUrl || value.path;
      if (typeof url === 'string') {
        const isUrl = /^https?:\/\//i.test(url) || url.startsWith('data:');
        return { uri: isUrl ? url : getThumb(url) };
      }
    }
    return undefined;
  };

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Determine the service name for feathers
        const serviceName = service?.toLowerCase() || 'attractions';
        
        // Fetch the location data
        const result = await feathers.service(serviceName).get(id);
        setLocationData(result);
      } catch (err) {
        console.warn(`Failed to fetch location data for ${service}/${id}:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLocationData();
    }
  }, [id, service, feathers]);

  const styles = StyleSheet.create({
    card: {
      marginVertical: theme.spacing.xs,
      borderRadius: theme.spacing.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      elevation: 1,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      columnGap: theme.spacing.sm,
    },
    imageContainer: {
      width: 72,
      height: 72,
      borderRadius: theme.spacing.sm,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    textContainer: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    title: {
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
    },
    badge: {
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.xs,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      color: theme.colors.primary,
    },
    footerText: {
      color: theme.colors.primary,
      fontSize: 12,
    },
    placeholderContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
  });

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.imageContainer}>
          <ActivityIndicator animating={true} color={theme.colors.primary} />
        </View>
      </Card>
    );
  }

  // Get image from location data
  const imageValue = locationData?.thumbnails?.[0] || locationData?.image;
  const imageSource = resolveImageSource(imageValue);
  
  // Localize text fields safely
  const titleText = localize(locationData?.name || label || '');
  const descRaw = locationData?.desc || locationData?.briefDesc || locationData?.description || '';
  const descText = localize(descRaw || '');
  const truncatedDesc = descText && descText.length > 80 ? descText.substring(0, 80) + '...' : descText;

  // Format service type display
  const serviceDisplay = service?.toLowerCase() === 'attractions' ? 'Attraction' 
    : service?.toLowerCase() === 'restaurants' ? 'Restaurant'
    : service?.toLowerCase() === 'accommodations' ? 'Accommodation'
    : service?.toLowerCase() === 'experience' ? 'Experience'
    : service?.toLowerCase() === 'workshop' ? 'Workshop'
    : service?.toLowerCase() === 'routes' ? 'Route'
    : service;

  const locationLine = [
    localize(locationData?.city || locationData?.location || locationData?.address || locationData?.region || ''),
  ].filter(Boolean).join(', ');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          {/* Image Section */}
          <View style={styles.imageContainer}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={styles.image}
              />
            ) : (
              <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                <LocationIcon fill={theme.colors.primary} size={40} />
              </View>
            )}
          </View>

          {/* Content Section */}
          <View style={styles.textContainer}>
            <Text variant="titleSmall" style={styles.title}>
              {titleText}
            </Text>

            <Text variant="bodySmall" style={styles.subtitle}>
              {serviceDisplay}
              {locationLine ? ` | ${locationLine}` : ''}
            </Text>

            {truncatedDesc ? (
              <Text variant="bodySmall" style={styles.description}>
                {truncatedDesc}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
