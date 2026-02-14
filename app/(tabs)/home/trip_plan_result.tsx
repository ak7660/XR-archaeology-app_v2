import { AppBar, MainBody, NAVBAR_HEIGHT, LocationCard } from "@/components";
import { useAppTheme } from "@/providers/style_provider";
import { useAppStore } from "@/app/state/app";
import { Routes } from "@/app/composable/routes";
import { router } from "expo-router";
import { ScrollView, View, StyleSheet, Alert } from "react-native";
import { Text, Card, Divider, Chip, Button } from "react-native-paper";
import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFocusEffect } from "@react-navigation/native";

const TripPlanResultPage = observer(() => {
  const { theme } = useAppTheme();
  const appStore = useAppStore();
  const [tripPlan, setTripPlan] = useState(appStore.tripPlan);
  const [conversationId, setConversationId] = useState(appStore.conversationId);
  
  // Update trip plan when screen comes into focus or when appStore changes
  useFocusEffect(
    React.useCallback(() => {
      console.log("=== Screen focused, refreshing trip plan ===");
      console.log("Current appStore.tripPlan length:", appStore.tripPlan.length);
      setTripPlan(appStore.tripPlan);
      setConversationId(appStore.conversationId);
      
      if (appStore.tripPlan.length > 0) {
        console.log("Trip plan preview:", appStore.tripPlan.substring(0, 200));
      }
    }, [appStore.tripPlan, appStore.conversationId])
  );
  
  console.log("Rendering with trip plan length:", tripPlan.length);

  // Parse markdown into structured components
  const parseMarkdown = (markdown: string) => {
    if (!markdown) return [];
    
    const lines = markdown.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        elements.push(<View key={`space-${key++}`} style={{ height: theme.spacing.sm }} />);
        continue;
      }

      // H1 - Main title (# text)
      if (trimmed.startsWith('# ')) {
        elements.push(
          <Text key={`h1-${key++}`} variant="headlineMedium" style={styles.h1}>
            {trimmed.replace('# ', '')}
          </Text>
        );
      }
      // H2 - Day headers (## text)
      else if (trimmed.startsWith('## ')) {
        elements.push(
          <View key={`h2-${key++}`} style={{ marginTop: theme.spacing.lg }}>
            <Divider style={{ marginBottom: theme.spacing.md, backgroundColor: theme.colors.primary }} />
            <Text variant="titleLarge" style={styles.h2}>
              {trimmed.replace('## ', '')}
            </Text>
          </View>
        );
      }
      // Bold time headers (**9:00 AM** or **12:00 PM**)
      else if (trimmed.match(/^\*\*\d{1,2}:\d{2}\s*(AM|PM|am|pm)?\*\*$/)) {
        const timeText = trimmed.replace(/^\*\*|\*\*$/g, '');
        elements.push(
          <Text key={`time-header-${key++}`} variant="labelLarge" style={[styles.timeText, { marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }]}>
            🕐 {timeText}
          </Text>
        );
      }
      // Bold metadata lines (**Key:** value) - must have colon
      else if (trimmed.match(/^\*\*[^*]+:\*\*/)) {
        const parts = trimmed.split('**');
        elements.push(
          <Text key={`meta-${key++}`} variant="bodyLarge" style={styles.metadata}>
            <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              {parts[1]}:
            </Text>
            {' '}
            {formatInlineText(parts.slice(2).join('').trim())}
          </Text>
        );
      }
      // Horizontal rule (---)
      else if (trimmed === '---') {
        elements.push(
          <Divider key={`hr-${key++}`} style={{ marginVertical: theme.spacing.md }} />
        );
      }
      // Activity/schedule lines (time range at start - legacy format)
      else if (trimmed.match(/^\d{2}:\d{2}/)) {
        const activity = parseActivityLine(trimmed);
        
        // Check if the rest of the line after time is just a location link
        const restOfLine = trimmed.substring(activity.time.length).trim();
        const isOnlyLocationLink = /^\[.*?\]\(location:.*?\/.*?\)$/.test(restOfLine);
        
        if (isOnlyLocationLink) {
          // Render time header + location card
          const locationData = extractLocationLink(restOfLine);
          elements.push(
            <View key={`time-section-${key++}`} style={{ marginVertical: theme.spacing.xs }}>
              <Text variant="labelLarge" style={[styles.timeText, { marginBottom: theme.spacing.xs }]}>
                🕐 {activity.time}
              </Text>
              {locationData && (
                <LocationCard
                  label={locationData.label}
                  service={locationData.service}
                  id={locationData.id}
                  onPress={() => {
                    try {
                      const route = getDetailRoute(locationData.service, locationData.id);
                      if (route) {
                        router.push(route);
                      } else {
                        Alert.alert("Navigation Error", `Could not resolve route for ${locationData.service}/${locationData.id}`);
                      }
                    } catch (navError: any) {
                      Alert.alert("Navigation Error", navError?.message || "Unknown error");
                    }
                  }}
                />
              )}
            </View>
          );
        } else {
          // Render as regular activity card with inline formatting
          elements.push(
            <View key={`activity-${key++}`} style={styles.activityCard}>
              <Text variant="labelLarge" style={styles.timeText}>
                🕐 {activity.time}
              </Text>
              {activity.title && (
                <Text variant="titleSmall" style={styles.activityTitle}>
                  {formatInlineText(activity.title)}
                </Text>
              )}
              <Text variant="bodyMedium" style={styles.activityDescription}>
                {formatInlineText(activity.description)}
              </Text>
              {activity.cost && (
                <Chip icon="cash" compact style={styles.costChip}>
                  {activity.cost}
                </Chip>
              )}
            </View>
          );
        }
      }
      // Bullet points (lines starting with •, -, or indented)
      else if (trimmed.match(/^[•\-]/) || line.startsWith('  ')) {
        const content = trimmed.replace(/^[•\-]\s*/, '');
        
        // Check if bullet point contains ONLY a location link
        const isOnlyLocationLink = /^\[.*?\]\(location:.*?\/.*?\)$/.test(content);
        
        if (isOnlyLocationLink) {
          // Render as LocationCard
          const locationData = extractLocationLink(content);
          if (locationData) {
            elements.push(
              <View key={`bullet-location-${key++}`} style={{ marginVertical: theme.spacing.xs }}>
                <LocationCard
                  label={locationData.label}
                  service={locationData.service}
                  id={locationData.id}
                  onPress={() => {
                    try {
                      const route = getDetailRoute(locationData.service, locationData.id);
                      if (route) {
                        router.push(route);
                      } else {
                        Alert.alert("Navigation Error", `Could not resolve route for ${locationData.service}/${locationData.id}`);
                      }
                    } catch (navError: any) {
                      Alert.alert("Navigation Error", navError?.message || "Unknown error");
                    }
                  }}
                />
              </View>
            );
          }
        } else {
          // Render as regular bullet point
          elements.push(
            <View key={`bullet-${key++}`} style={styles.bulletPoint}>
              <Text style={{ color: theme.colors.primary, marginRight: theme.spacing.xs }}>•</Text>
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.text }}>
                {formatInlineText(content)}
              </Text>
            </View>
          );
        }
      }
      // Cost summary lines
      else if (trimmed.match(/\$\d+/) && !trimmed.startsWith('**')) {
        elements.push(
          <Text key={`cost-${key++}`} variant="bodyMedium" style={styles.costLine}>
            {trimmed}
          </Text>
        );
      }
      // Location card lines (standalone location links)
      else if (hasLocationLink(trimmed)) {
        const locationData = extractLocationLink(trimmed);
        if (locationData) {
          elements.push(
            <View key={`location-card-${key++}`} style={{ marginVertical: theme.spacing.xs }}>
              <LocationCard
                label={locationData.label}
                service={locationData.service}
                id={locationData.id}
                onPress={() => {
                  try {
                    const route = getDetailRoute(locationData.service, locationData.id);
                    if (route) {
                      router.push(route);
                    } else {
                      Alert.alert("Navigation Error", `Could not resolve route for ${locationData.service}/${locationData.id}`);
                    }
                  } catch (navError: any) {
                    Alert.alert("Navigation Error", navError?.message || "Unknown error");
                  }
                }}
              />
            </View>
          );
        }
      }
      // Regular paragraph
      else {
        elements.push(
          <Text key={`text-${key++}`} variant="bodyMedium" style={styles.paragraph}>
            {formatInlineText(trimmed)}
          </Text>
        );
      }
    }

    return elements;
  };

  // Parse activity line (e.g., "08:00–09:15  Breakfast: **Bubby's** – details; $22 pp")
  // Map services to their specific detail routes
  // Map services to their specific detail routes
  const getDetailRoute = (service: string, id: string) => {
    try {
      if (!id) return null;
      
      const s = service?.toLowerCase() || 'attractions';

      switch (s) {
        case 'experience':
        case 'workshop':
          return { 
            pathname: Routes.ExperienceDetail || "/home/experience_detail", 
            params: { id } 
          };
        case 'routes':
        case 'hiking':
        case 'trail':
          return { 
            pathname: Routes.Route || "/home/route", 
            params: { id } 
          };
        case 'events':
        case 'event':
          // Safely handle missing slash in enum
          const rawEventPath = Routes.Event || "home/event";
          const eventPath = rawEventPath.startsWith('/') ? rawEventPath : `/${rawEventPath}`;
          return { 
            pathname: eventPath as any, 
            params: { id } 
          };
        case 'artifacts':
        case 'artifact':
        case 'museum':
          return { 
            pathname: '/detail' as any, 
            params: { id } 
          };
        case 'attractions':
        default:
          return { 
            pathname: Routes.Detail || "/home/detail", 
            params: { id, service: s } 
          };
      }
    } catch (e) {
      console.error("Error in getDetailRoute:", e);
      return null;
    }
  };

  const parseActivityLine = (line: string) => {
    const timeMatch = line.match(/^(\d{2}:\d{2}[–-]\d{2}:\d{2}|\d{2}:\d{2})/);
    const time = timeMatch ? timeMatch[1] : '';
    
    let rest = line.substring(time.length).trim();
    
    // Extract title (could be bold **title** or link [title](url))
    const titleRegex = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/;
    const titleMatch = rest.match(titleRegex);
    const title = titleMatch ? titleMatch[0] : ''; // Keep full match to parse in formatInlineText
    
    // Remove title part for description
    rest = rest.replace(titleRegex, '').trim();
    
    // Extract cost
    const costMatch = rest.match(/\$\d+(\.\d{2})?\s*(pp|per person|total)?/i);
    const cost = costMatch ? costMatch[0] : '';
    
    // Clean description (remove cost)
    const description = rest.replace(costMatch ? costMatch[0] : '', '').trim();
    
    return { time, title, description, cost };
  };

  // Check if text contains location links
  const hasLocationLink = (text: string): boolean => {
    return /\[(.*?)\]\(location:.*?\)/.test(text);
  };

  // Extract location link data
  const extractLocationLink = (text: string) => {
    const match = text.match(/\[(.*?)\]\(location:(.*?)\/([^)]*)\)/);
    if (match) {
      return {
        label: match[1],
        service: match[2],
        id: match[3],
      };
    }
    return null;
  };

  // Format inline text (handle **bold** and [links](url))
  const formatInlineText = (text: string) => {
    if (!text) return [];
    
    // Split text by bold markers or links, capturing the delimiters
    // Use non-greedy quantifiers to handle multiple matches in one line
    const combinedRegex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    const parts = text.split(combinedRegex);
    
    let elemKey = 0;
    return parts.map((part, index) => {
      if (!part) return null;

      // Check for bold match: **text**
      const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
      if (boldMatch) {
        return (
          <Text key={`bold-${elemKey++}`} style={{ fontWeight: 'bold', color: theme.colors.primary }}>
            {boldMatch[1]}
          </Text>
        );
      }

      // Check for link match: [label](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const url = linkMatch[2];

        if (url.startsWith('location:')) {
          const parts_url = url.replace('location:', '').split('/');
          const service = parts_url[0];
          const id = parts_url[1];
          
          return (
            <Text 
              key={`link-${elemKey++}`} 
              style={{ 
                fontWeight: 'bold', 
                color: theme.colors.primary,
                textDecorationLine: 'underline'
              }}
              onPress={() => {
                try {
                  const route = getDetailRoute(service, id);
                  if (route) {
                    console.log(`Navigating to: ${JSON.stringify(route)}`);
                    router.push(route);
                  } else {
                    Alert.alert("Navigation Error", `Could not resolve route for ${service}/${id}`);
                  }
                } catch (navError: any) {
                  Alert.alert("Navigation Crash", navError?.message || "Unknown navigation error");
                }
              }}
            >
              {label}
            </Text>
          );
        } else {
          return (
            <Text key={`link-${elemKey++}`} style={{ color: theme.colors.primary }}>
              {label}
            </Text>
          );
        }
      }

      // Return plain text for everything else
      return part;
    }).filter(p => p !== null);
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: NAVBAR_HEIGHT + theme.spacing.xl,
    },
    card: {
      backgroundColor: theme.colors.surface,
      elevation: 2,
      padding: theme.spacing.lg,
    },
    h1: {
      fontSize: 24,
      color: theme.colors.primary,
      fontWeight: 'bold',
      marginBottom: theme.spacing.md,
    },
    h2: {
      color: theme.colors.primary,
      fontWeight: 'bold',
      marginBottom: theme.spacing.sm,
    },
    metadata: {
      marginBottom: theme.spacing.xs,
      color: theme.colors.text,
    },
    activityCard: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: theme.spacing.md,
      borderRadius: theme.spacing.xs,
      marginVertical: theme.spacing.xs,
    },
    timeText: {
      color: theme.colors.primary,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
    },
    activityTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    activityDescription: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    costChip: {
      alignSelf: 'flex-start',
      marginTop: theme.spacing.xs,
    },
    bulletPoint: {
      flexDirection: 'row',
      marginLeft: theme.spacing.md,
      marginVertical: theme.spacing.xs,
    },
    costLine: {
      fontFamily: 'monospace',
      color: theme.colors.text,
      marginVertical: 2,
    },
    paragraph: {
      color: theme.colors.text,
      marginVertical: theme.spacing.xs,
      lineHeight: 22,
    },
    emptyText: {
      color: theme.colors.error,
      fontSize: 16,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
  });

  const handleRefineInChat = () => {
    // Navigate back to trip planner to continue the conversation
    router.back();
  };

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title="Your Trip Plan" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {tripPlan.length > 0 ? (
          <>
            <Card style={styles.card}>
              {parseMarkdown(tripPlan)}
            </Card>
            
            {conversationId && (
              <View style={{ padding: theme.spacing.md }}>
                <Button
                  mode="contained"
                  icon="message-text"
                  onPress={handleRefineInChat}
                  style={{ borderRadius: theme.spacing.sm }}
                  contentStyle={{ paddingVertical: theme.spacing.sm }}
                >
                  <Text variant="labelLarge" style={{ color: theme.colors.textOnPrimary }}>
                    Continue Chat to Refine Plan
                  </Text>
                </Button>
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textAlign: "center",
                    marginTop: theme.spacing.sm,
                  }}
                >
                  Ask questions or request changes to your itinerary
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>
            No trip plan received. Please try generating again.
          </Text>
        )}
      </ScrollView>
    </MainBody>
  );
});

export default TripPlanResultPage;
