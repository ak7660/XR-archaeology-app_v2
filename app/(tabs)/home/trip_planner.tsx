import { Routes } from "@/app/composable/routes";
import { useAppStore } from "@/app/state/app";
import { AppBar, MainBody, NAVBAR_HEIGHT } from "@/components";
import { useAppTheme } from "@/providers/style_provider";
import { router } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, FlatList } from "react-native";
import { TextInput, Text, ActivityIndicator, IconButton, Chip, Button, Card, Searchbar } from "react-native-paper";
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
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
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
      
      console.log("=== API Response ===");
      console.log("Stage:", data.stage);
      console.log("Available locations:", data.available_locations?.length || 0);
      console.log("First location:", data.available_locations?.[0]);

      // Store conversation ID
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
        appStore.setConversationId(data.conversation_id);
      }

      // Update current stage
      setCurrentStage(data.stage);

      // Handle available locations - check if we're in the right stage and have locations
      if (data.stage === "collecting_locations" && data.available_locations && data.available_locations.length > 0) {
        console.log("✓ Stage is collecting_locations and we have", data.available_locations.length, "locations");
        console.log("✓ Setting available locations and showing modal");
        setAvailableLocations(data.available_locations);
        
        // Use setTimeout to ensure state is updated before showing modal
        setTimeout(() => {
          console.log("✓ Opening modal now");
          setShowLocationModal(true);
        }, 100);
      } else {
        console.log("✗ Not showing modal - Stage:", data.stage, "Locations:", data.available_locations?.length || 0);
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
    setShowLocationModal(false);
    setLocationSearchQuery("");
    sendMessage(message);
  };

  const handleSkipLocationSelection = () => {
    setSelectedStartLocation(null);
    setSelectedDestLocation(null);
    setAvailableLocations([]);
    setShowLocationModal(false);
    setLocationSearchQuery("");
    sendMessage("I don't know, please suggest");
  };

  const handleViewPlan = () => {
    if (appStore.tripPlan) {
      router.push(Routes.TripPlanResult);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === "user";
    const isLastMessage = index === messages.length - 1;
    const showLocationButton = !isUser && isLastMessage && availableLocations.length > 0 && currentStage === "collecting_locations";
    
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
        
        {showLocationButton && (
          <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.xs }}>
            <Button
              mode="contained"
              icon="map-marker-multiple"
              onPress={() => setShowLocationModal(true)}
              style={{ borderRadius: theme.spacing.sm }}
            >
              <Text style={{ color: theme.colors.textOnPrimary }}>
                Choose from {availableLocations.length} Locations
              </Text>
            </Button>
            <Button
              mode="outlined"
              icon="auto-fix"
              onPress={handleSkipLocationSelection}
              style={{ borderRadius: theme.spacing.sm }}
            >
              Let AI Suggest Route
            </Button>
          </View>
        )}
      </View>
    );
  };

  const renderLocationItem = ({ item }: { item: Location }) => {
    const isStartSelected = selectedStartLocation?.id === item.id;
    const isDestSelected = selectedDestLocation?.id === item.id;
    const isDisabled = (selectedStartLocation?.id === item.id && selectedDestLocation?.id === item.id);

    return (
      <Card style={[styles.locationCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ color: theme.colors.text, marginBottom: theme.spacing.xs }}>
                {item.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.type} • {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
            <Chip
              icon={isStartSelected ? "check" : "map-marker"}
              selected={isStartSelected}
              onPress={() => handleLocationSelect(item, "start")}
              style={{
                backgroundColor: isStartSelected ? theme.colors.primary : theme.colors.surfaceVariant,
              }}
            >
              <Text style={{ color: isStartSelected ? theme.colors.textOnPrimary : theme.colors.text }}>
                {isStartSelected ? "Starting Point" : "Set as Start"}
              </Text>
            </Chip>
            <Chip
              icon={isDestSelected ? "check" : "flag"}
              selected={isDestSelected}
              onPress={() => handleLocationSelect(item, "destination")}
              style={{
                backgroundColor: isDestSelected ? theme.colors.primary : theme.colors.surfaceVariant,
              }}
            >
              <Text style={{ color: isDestSelected ? theme.colors.textOnPrimary : theme.colors.text }}>
                {isDestSelected ? "Destination" : "Set as Dest"}
              </Text>
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const filteredLocations = availableLocations.filter((loc) =>
    loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
    loc.type.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  const renderLocationModal = () => {
    console.log("Rendering location modal, visible:", showLocationModal, "locations:", availableLocations.length);
    
    return (
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text variant="headlineSmall" style={{ color: theme.colors.text }}>
                Select Locations
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xs }}>
                Choose your starting point and destination
              </Text>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowLocationModal(false)}
            />
          </View>

          <View style={{ padding: theme.spacing.md }}>
            <Searchbar
              placeholder="Search locations..."
              onChangeText={setLocationSearchQuery}
              value={locationSearchQuery}
              style={{ marginBottom: theme.spacing.md }}
            />
            
            {selectedStartLocation && (
              <Card style={[styles.selectionCard, { backgroundColor: theme.colors.primaryContainer }]}>
                <Card.Content>
                  <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                    Starting Location
                  </Text>
                  <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                    {selectedStartLocation.name}
                  </Text>
                </Card.Content>
              </Card>
            )}
            
            {selectedDestLocation && (
              <Card style={[styles.selectionCard, { backgroundColor: theme.colors.secondaryContainer }]}>
                <Card.Content>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer }}>
                    Destination
                  </Text>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                    {selectedDestLocation.name}
                  </Text>
                </Card.Content>
              </Card>
            )}
          </View>

          <FlatList
            data={filteredLocations}
            renderItem={renderLocationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: theme.spacing.md,
              paddingTop: 0,
              paddingBottom: 120,
            }}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl }}>
                No locations found
              </Text>
            }
          />

          <View style={[styles.modalFooter, { backgroundColor: theme.colors.surface }]}>
            <Button
              mode="outlined"
              onPress={handleSkipLocationSelection}
              style={{ flex: 1 }}
            >
              Let AI Suggest
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmLocations}
              disabled={!(selectedStartLocation && selectedDestLocation)}
              style={{ flex: 1 }}
            >
              Confirm ({selectedStartLocation && selectedDestLocation ? "2" : selectedStartLocation || selectedDestLocation ? "1" : "0"} selected)
            </Button>
          </View>
        </View>
      </Modal>
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
    viewPlanButton: {
      margin: theme.spacing.md,
      borderRadius: theme.spacing.sm,
    },
    locationCard: {
      marginBottom: theme.spacing.md,
      elevation: 2,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    modalFooter: {
      flexDirection: "row",
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    selectionCard: {
      marginBottom: theme.spacing.sm,
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

        {renderLocationModal()}

        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type your message..."
            style={styles.textInput}
            onSubmitEditing={handleSendMessage}
            disabled={isLoading}
            multiline
            numberOfLines={1}
            maxLength={500}
          />
          <IconButton
            icon="send"
            size={24}
            iconColor={theme.colors.primary}
            onPress={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </MainBody>
  );
});

export default TripPlannerPage;
