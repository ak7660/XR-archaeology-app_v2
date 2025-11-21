import { Routes } from "@/app/composable/routes";
import { useAppStore } from "@/app/state/app";
import { AppBar, MainBody, NAVBAR_HEIGHT } from "@/components";
import { useAppTheme } from "@/providers/style_provider";
import { router } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { TextInput, Text, ActivityIndicator, IconButton, Chip } from "react-native-paper";
import { observer } from "mobx-react-lite";

// Types matching the API response
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

interface TripData {
  start_date: string | null;
  end_date: string | null;
  number_of_people: number | null;
  food_preferences: string[];
  starting_location: string | null;
  destination: string | null;
  user_preferred_lang: string;
}

interface ChatResponse {
  conversation_id: string;
  message: string;
  stage: string;
  trip_data: TripData;
  trip_plan: string | null;
  available_locations: Location[] | null;
  needs_input: boolean;
}

const TripPlannerPage = observer(() => {
  const { theme } = useAppTheme();
  const appStore = useAppStore();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<string>("greeting");
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [selectedStartLocation, setSelectedStartLocation] = useState<Location | null>(null);
  const [selectedDestLocation, setSelectedDestLocation] = useState<Location | null>(null);
  const [language] = useState("en"); // Could be changed based on app language settings

  // Initialize conversation on mount
  useEffect(() => {
    sendInitialMessage();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendInitialMessage = async () => {
    await sendMessage("Hi, I want to plan a trip", true);
  };

  const sendMessage = async (message: string, isInitial = false) => {
    if (!message.trim() && !isInitial) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    // Add user message to chat (unless it's the initial greeting)
    if (!isInitial) {
      setMessages((prev) => [...prev, userMessage]);
    }
    
    setInputMessage("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_TRIP_PLAN_API_URL!.replace("/trip/plan", "/chat/message");
      const requestBody: any = {
        message,
        language,
      };

      if (conversationId) {
        requestBody.conversation_id = conversationId;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.EXPO_PUBLIC_TRIP_PLAN_API_KEY!,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      // Store conversation ID
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
        appStore.setConversationId(data.conversation_id);
      }

      // Update current stage
      setCurrentStage(data.stage);

      // Handle available locations
      if (data.available_locations && data.available_locations.length > 0) {
        setAvailableLocations(data.available_locations);
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // If trip plan is generated, store it
      if (data.trip_plan) {
        appStore.setTripPlan(data.trip_plan);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim());
    }
  };

  const handleLocationSelect = (location: Location, type: "start" | "destination") => {
    if (type === "start") {
      setSelectedStartLocation(location);
    } else {
      setSelectedDestLocation(location);
    }
  };

  const handleConfirmLocations = () => {
    let message = "";
    
    if (selectedStartLocation && selectedDestLocation) {
      message = `I want to start at ${selectedStartLocation.name} and end at ${selectedDestLocation.name}`;
    } else if (!selectedStartLocation && !selectedDestLocation) {
      message = "I don't know, please suggest";
    } else {
      // User hasn't selected both - remind them
      return;
    }

    // Clear selections and send message
    setSelectedStartLocation(null);
    setSelectedDestLocation(null);
    setAvailableLocations([]);
    sendMessage(message);
  };

  const handleViewPlan = () => {
    if (appStore.tripPlan) {
      router.push(Routes.TripPlanResult);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === "user";
    
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? { backgroundColor: theme.colors.primary }
              : { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text
            variant="bodyMedium"
            style={{
              color: isUser ? theme.colors.textOnPrimary : theme.colors.text,
              lineHeight: 20,
            }}
          >
            {message.content}
          </Text>
          <Text
            variant="labelSmall"
            style={{
              color: isUser ? theme.colors.textOnPrimary + "CC" : theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.xs,
            }}
          >
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  const renderLocationSelector = () => {
    if (availableLocations.length === 0) return null;

    return (
      <View style={[styles.locationSelectorContainer, { backgroundColor: theme.colors.surface }]}>
        <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          Select Locations
        </Text>
        
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.xs }}>
          Starting Location:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
            {availableLocations.map((loc) => (
              <Chip
                key={`start-${loc.id}`}
                selected={selectedStartLocation?.id === loc.id}
                onPress={() => handleLocationSelect(loc, "start")}
                style={{
                  backgroundColor: selectedStartLocation?.id === loc.id
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                }}
              >
                <Text
                  variant="labelSmall"
                  style={{
                    color: selectedStartLocation?.id === loc.id
                      ? theme.colors.textOnPrimary
                      : theme.colors.text,
                  }}
                >
                  {loc.name}
                </Text>
              </Chip>
            ))}
          </View>
        </ScrollView>

        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.xs }}>
          Destination:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
            {availableLocations.map((loc) => (
              <Chip
                key={`dest-${loc.id}`}
                selected={selectedDestLocation?.id === loc.id}
                onPress={() => handleLocationSelect(loc, "destination")}
                style={{
                  backgroundColor: selectedDestLocation?.id === loc.id
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                }}
              >
                <Text
                  variant="labelSmall"
                  style={{
                    color: selectedDestLocation?.id === loc.id
                      ? theme.colors.textOnPrimary
                      : theme.colors.text,
                  }}
                >
                  {loc.name}
                </Text>
              </Chip>
            ))}
          </View>
        </ScrollView>

        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <TouchableOpacity
            style={[
              styles.locationButton,
              {
                backgroundColor: theme.colors.primary,
                flex: 1,
                opacity: (selectedStartLocation && selectedDestLocation) ? 1 : 0.5,
              },
            ]}
            onPress={handleConfirmLocations}
            disabled={!(selectedStartLocation && selectedDestLocation)}
          >
            <Text style={{ color: theme.colors.textOnPrimary, fontWeight: "bold" }}>
              Confirm Selection
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.locationButton,
              { backgroundColor: theme.colors.secondary, flex: 1 },
            ]}
            onPress={() => {
              setSelectedStartLocation(null);
              setSelectedDestLocation(null);
              setAvailableLocations([]);
              sendMessage("I don't know, please suggest");
            }}
          >
            <Text style={{ color: theme.colors.textOnPrimary, fontWeight: "bold" }}>
              Let AI Suggest
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    messagesContainer: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    messageContainer: {
      marginBottom: theme.spacing.md,
      maxWidth: "80%",
    },
    userMessageContainer: {
      alignSelf: "flex-end",
    },
    assistantMessageContainer: {
      alignSelf: "flex-start",
    },
    messageBubble: {
      padding: theme.spacing.md,
      borderRadius: theme.spacing.md,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.md,
      paddingBottom: NAVBAR_HEIGHT + theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    textInput: {
      flex: 1,
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.background,
    },
    locationSelectorContainer: {
      padding: theme.spacing.md,
      paddingBottom: NAVBAR_HEIGHT + theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    locationButton: {
      padding: theme.spacing.md,
      borderRadius: theme.spacing.sm,
      alignItems: "center",
    },
    viewPlanButton: {
      margin: theme.spacing.md,
      borderRadius: theme.spacing.sm,
    },
  });

  return (
    <MainBody padding={{ top: 0, bottom: 0 }}>
      <AppBar title="AI Trip Planner" showBack />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={[
            styles.messagesContainer,
            { paddingBottom: theme.spacing.md },
          ]}
        >
          {messages.map((message, index) => renderMessage(message, index))}
          
          {isLoading && (
            <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
              <View style={[styles.messageBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            </View>
          )}

          {appStore.tripPlan && (currentStage === "refining_plan" || currentStage === "generating_plan") && (
            <TouchableOpacity
              style={[styles.viewPlanButton, { backgroundColor: theme.colors.primary, padding: theme.spacing.md }]}
              onPress={handleViewPlan}
            >
              <Text
                style={{
                  color: theme.colors.textOnPrimary,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                📋 View Complete Trip Plan
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {renderLocationSelector()}

        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type your message..."
            style={styles.textInput}
            onSubmitEditing={handleSendMessage}
            disabled={isLoading || availableLocations.length > 0}
            multiline
            numberOfLines={1}
            maxLength={500}
          />
          <IconButton
            icon="send"
            size={24}
            iconColor={theme.colors.primary}
            onPress={handleSendMessage}
            disabled={isLoading || !inputMessage.trim() || availableLocations.length > 0}
          />
        </View>
      </KeyboardAvoidingView>
    </MainBody>
  );
});

export default TripPlannerPage;
