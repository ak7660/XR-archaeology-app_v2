import { AppBar, MainBody, NAVBAR_HEIGHT } from "@/components";
import { useAppTheme } from "@/providers/style_provider";
import { useAppStore } from "@/app/state/app";
import { Routes } from "@/app/composable/routes";
import { router } from "expo-router";
import { ScrollView, View, StyleSheet } from "react-native";
import { Text, Card, Divider, Chip, Button } from "react-native-paper";
import React from "react";
import { observer } from "mobx-react-lite";

const TripPlanResultPage = observer(() => {
  const { theme } = useAppTheme();
  const appStore = useAppStore();
  
  // Get trip plan from app state
  const tripPlan = appStore.tripPlan;
  const conversationId = appStore.conversationId;
  
  console.log("Trip plan from state length:", tripPlan.length);
  if (tripPlan.length > 0) {
    console.log("Trip plan preview:", tripPlan.substring(0, 200));
  }

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
      // Bold metadata lines (**Key:** value)
      else if (trimmed.match(/^\*\*[^*]+:\*\*/)) {
        const parts = trimmed.split('**');
        elements.push(
          <Text key={`meta-${key++}`} variant="bodyLarge" style={styles.metadata}>
            <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              {parts[1]}:
            </Text>
            {' ' + parts.slice(2).join('').trim()}
          </Text>
        );
      }
      // Horizontal rule (---)
      else if (trimmed === '---') {
        elements.push(
          <Divider key={`hr-${key++}`} style={{ marginVertical: theme.spacing.md }} />
        );
      }
      // Activity/schedule lines (time range at start)
      else if (trimmed.match(/^\d{2}:\d{2}/)) {
        const activity = parseActivityLine(trimmed);
        elements.push(
          <View key={`activity-${key++}`} style={styles.activityCard}>
            <Text variant="labelLarge" style={styles.timeText}>
              🕐 {activity.time}
            </Text>
            {activity.title && (
              <Text variant="titleSmall" style={styles.activityTitle}>
                {activity.title}
              </Text>
            )}
            <Text variant="bodyMedium" style={styles.activityDescription}>
              {activity.description}
            </Text>
            {activity.cost && (
              <Chip icon="cash" compact style={styles.costChip}>
                {activity.cost}
              </Chip>
            )}
          </View>
        );
      }
      // Bullet points (lines starting with •, -, or indented)
      else if (trimmed.match(/^[•\-]/) || line.startsWith('  ')) {
        const content = trimmed.replace(/^[•\-]\s*/, '');
        elements.push(
          <View key={`bullet-${key++}`} style={styles.bulletPoint}>
            <Text style={{ color: theme.colors.primary, marginRight: theme.spacing.xs }}>•</Text>
            <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.text }}>
              {formatInlineText(content)}
            </Text>
          </View>
        );
      }
      // Cost summary lines
      else if (trimmed.match(/\$\d+/) && !trimmed.startsWith('**')) {
        elements.push(
          <Text key={`cost-${key++}`} variant="bodyMedium" style={styles.costLine}>
            {trimmed}
          </Text>
        );
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
  const parseActivityLine = (line: string) => {
    const timeMatch = line.match(/^(\d{2}:\d{2}[–-]\d{2}:\d{2}|\d{2}:\d{2})/);
    const time = timeMatch ? timeMatch[1] : '';
    
    let rest = line.substring(time.length).trim();
    
    // Extract bold title (if exists)
    const titleMatch = rest.match(/\*\*([^*]+)\*\*/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Remove bold markers for description
    rest = rest.replace(/\*\*[^*]+\*\*/, '').trim();
    
    // Extract cost
    const costMatch = rest.match(/\$\d+(\.\d{2})?\s*(pp|per person|total)?/i);
    const cost = costMatch ? costMatch[0] : '';
    
    // Clean description (remove cost)
    const description = rest.replace(costMatch ? costMatch[0] : '', '').trim();
    
    return { time, title, description, cost };
  };

  // Format inline text (handle **bold**)
  const formatInlineText = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    let elemKey = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <Text key={`bold-${elemKey++}`} style={{ fontWeight: 'bold', color: theme.colors.primary }}>
          {match[1]}
        </Text>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
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
