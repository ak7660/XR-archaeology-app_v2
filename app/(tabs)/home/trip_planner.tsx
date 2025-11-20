import { Routes } from "@/app/composable/routes";
import { useAppStore } from "@/app/state/app";
import { AppBar, MainBody, NAVBAR_HEIGHT } from "@/components";
import { useAppTheme } from "@/providers/style_provider";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View, TouchableOpacity, Modal } from "react-native";
import { Button, Text, TextInput, Chip, ActivityIndicator, IconButton } from "react-native-paper";
import { Calendar } from 'react-native-calendars';

export default function TripPlannerPage() {
  const { theme } = useAppTheme();
  const appStore = useAppStore();
  
  // Form state matching API format
  const [startingLocation, setStartingLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userPreferredLang, setUserPreferredLang] = useState("en");
  const [foodPreferences, setFoodPreferences] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Format date for display (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Handle date selection
  const handleStartDateSelect = (date: { dateString: string }) => {
    setStartDate(date.dateString);
    setShowStartDatePicker(false);
  };
  
  const handleEndDateSelect = (date: { dateString: string }) => {
    setEndDate(date.dateString);
    setShowEndDatePicker(false);
  };
  
  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get minimum end date (start date or today, whichever is later)
  const minEndDate = startDate && startDate > today ? startDate : today;
  
  // Geocode address to coordinates
  async function geocodeAddress(address: string): Promise<string> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return `${lat},${lng}`;
    }
    
    throw new Error(`Location not found: ${address}`);
  }
  
  const handleGeneratePlan = async () => {
    setError("");
    setIsLoading(true);
    
    try {
      // Step 1: Geocode both locations
      console.log("Geocoding starting location...");
      const startingCoords = await geocodeAddress(startingLocation);
      console.log("Starting coordinates:", startingCoords);
      
      console.log("Geocoding destination...");
      const destinationCoords = await geocodeAddress(destination);
      console.log("Destination coordinates:", destinationCoords);
      
      // Step 2: Parse food preferences (comma-separated)
      const foodPrefsArray = foodPreferences
        .split(',')
        .map(pref => pref.trim())
        .filter(pref => pref.length > 0);
      
      // Step 3: Prepare trip date range in ISO format
      const tripDateRange = [
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString()
      ];
      
      // Step 4: Prepare request body
      const requestBody = {
        starting_location: startingCoords,
        destination: destinationCoords,
        number_of_people: parseInt(numberOfPeople) || 1,
        trip_date_range: tripDateRange,
        user_preferred_lang: userPreferredLang,
        food_preferences: foodPrefsArray
      };
      
      console.log("Sending trip plan request:", requestBody);
      
      // Step 5: Call trip plan API
      const response = await fetch(process.env.EXPO_PUBLIC_TRIP_PLAN_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.EXPO_PUBLIC_TRIP_PLAN_API_KEY!
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Trip plan result:", result);
      
      // Store trip plan in app state and navigate to result page
      if (result.trip_plan) {
        appStore.setTripPlan(result.trip_plan);
        console.log("trip plan variable set: ", result.trip_plan);
        router.push(Routes.TripPlanResult);
      } else {
        throw new Error("No trip plan returned from API");
      }
      
    } catch (err) {
      console.error("Error generating trip plan:", err);
      setError(err.message || "Failed to generate trip plan");
      alert("Error: " + (err.message || "Failed to generate trip plan"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title="Plan Your Trip" showBack />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: NAVBAR_HEIGHT + theme.spacing.xl,
        }}
      >
        <View style={{ gap: theme.spacing.md }}>
          {/* Header Text */}
          <Text variant="bodyLarge" style={{ color: theme.colors.text, marginBottom: theme.spacing.sm }}>
            Enter your trip details below and we'll generate a personalized itinerary for you.
          </Text>

          {/* Error Message */}
          {error ? (
            <View style={{ backgroundColor: theme.colors.error + '20', padding: theme.spacing.md, borderRadius: theme.spacing.xs }}>
              <Text style={{ color: theme.colors.error }}>{error}</Text>
            </View>
          ) : null}

          {/* Starting Location */}
          <TextInput
            label="Starting Location *"
            value={startingLocation}
            onChangeText={setStartingLocation}
            mode="outlined"
            placeholder="e.g., Yerevan, Armenia"
            style={{ backgroundColor: theme.colors.background }}
            disabled={isLoading}
          />

          {/* Destination */}
          <TextInput
            label="Destination *"
            value={destination}
            onChangeText={setDestination}
            mode="outlined"
            placeholder="e.g., Vedi, Armenia"
            style={{ backgroundColor: theme.colors.background }}
            disabled={isLoading}
          />

          {/* Number of People */}
          <TextInput
            label="Number of People *"
            value={numberOfPeople}
            onChangeText={setNumberOfPeople}
            mode="outlined"
            placeholder="e.g., 2"
            keyboardType="numeric"
            style={{ backgroundColor: theme.colors.background }}
            disabled={isLoading}
          />

          {/* Start Date */}
          <View>
            <Text variant="labelMedium" style={{ color: theme.colors.text, marginBottom: theme.spacing.xs }}>
              Start Date *
            </Text>
            <TouchableOpacity
              onPress={() => setShowStartDatePicker(true)}
              disabled={isLoading}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.outline,
                borderRadius: theme.spacing.xs,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text variant="bodyLarge" style={{ color: startDate ? theme.colors.text : theme.colors.outline }}>
                {startDate || 'Select start date'}
              </Text>
              <IconButton icon="calendar" size={20} />
            </TouchableOpacity>
          </View>

          {/* End Date */}
          <View>
            <Text variant="labelMedium" style={{ color: theme.colors.text, marginBottom: theme.spacing.xs }}>
              End Date *
            </Text>
            <TouchableOpacity
              onPress={() => setShowEndDatePicker(true)}
              disabled={isLoading}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.outline,
                borderRadius: theme.spacing.xs,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text variant="bodyLarge" style={{ color: endDate ? theme.colors.text : theme.colors.outline }}>
                {endDate || 'Select end date'}
              </Text>
              <IconButton icon="calendar" size={20} />
            </TouchableOpacity>
          </View>

          {/* Language Preference */}
          <View>
            <Text variant="labelLarge" style={{ color: theme.colors.text, marginBottom: theme.spacing.xs }}>
              Preferred Language
            </Text>
            <View style={{ flexDirection: "row", gap: theme.spacing.xs, flexWrap: "wrap" }}>
              <Chip
                selected={userPreferredLang === "en"}
                onPress={() => setUserPreferredLang("en")}
                style={{ backgroundColor: userPreferredLang === "en" ? theme.colors.primary : theme.colors.surface }}
                disabled={isLoading}
              >
                English
              </Chip>
              <Chip
                selected={userPreferredLang === "hy"}
                onPress={() => setUserPreferredLang("hy")}
                style={{ backgroundColor: userPreferredLang === "hy" ? theme.colors.primary : theme.colors.surface }}
                disabled={isLoading}
              >
                Armenian
              </Chip>
              <Chip
                selected={userPreferredLang === "ru"}
                onPress={() => setUserPreferredLang("ru")}
                style={{ backgroundColor: userPreferredLang === "ru" ? theme.colors.primary : theme.colors.surface }}
                disabled={isLoading}
              >
                Russian
              </Chip>
            </View>
          </View>

          {/* Food Preferences */}
          <TextInput
            label="Food Preferences (optional)"
            value={foodPreferences}
            onChangeText={setFoodPreferences}
            mode="outlined"
            placeholder="e.g., vegetarian, italian (comma-separated)"
            multiline
            numberOfLines={3}
            style={{ backgroundColor: theme.colors.background }}
            disabled={isLoading}
          />

          {/* Generate Button */}
          <Button
            mode="contained"
            onPress={handleGeneratePlan}
            disabled={!startingLocation || !destination || !numberOfPeople || !startDate || !endDate || isLoading}
            style={{
              borderRadius: theme.spacing.sm,
              marginTop: theme.spacing.md,
            }}
            contentStyle={{ paddingVertical: theme.spacing.sm }}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <Text variant="labelLarge" style={{ color: theme.colors.textOnPrimary }}>
                Generate Trip Plan
              </Text>
            )}
          </Button>
        </View>
      </ScrollView>

      {/* Start Date Picker Modal */}
      <Modal
        visible={showStartDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStartDatePicker(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowStartDatePicker(false)}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.spacing.md,
              padding: theme.spacing.md,
              width: '90%',
              maxWidth: 400,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <Text variant="titleLarge" style={{ color: theme.colors.text }}>
                Select Start Date
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowStartDatePicker(false)}
              />
            </View>
            <Calendar
              current={startDate || today}
              minDate={today}
              onDayPress={handleStartDateSelect}
              markedDates={{
                [startDate]: { selected: true, selectedColor: theme.colors.primary },
              }}
              theme={{
                backgroundColor: theme.colors.surface,
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.text,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.textOnPrimary,
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.outline,
                monthTextColor: theme.colors.text,
                arrowColor: theme.colors.primary,
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* End Date Picker Modal */}
      <Modal
        visible={showEndDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndDatePicker(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowEndDatePicker(false)}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.spacing.md,
              padding: theme.spacing.md,
              width: '90%',
              maxWidth: 400,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <Text variant="titleLarge" style={{ color: theme.colors.text }}>
                Select End Date
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowEndDatePicker(false)}
              />
            </View>
            <Calendar
              current={endDate || minEndDate}
              minDate={minEndDate}
              onDayPress={handleEndDateSelect}
              markedDates={{
                [startDate]: { marked: true, dotColor: theme.colors.primary },
                [endDate]: { selected: true, selectedColor: theme.colors.primary },
              }}
              theme={{
                backgroundColor: theme.colors.surface,
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.text,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.textOnPrimary,
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.outline,
                monthTextColor: theme.colors.text,
                arrowColor: theme.colors.primary,
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Loading Modal */}
      <Modal
        visible={isLoading}
        transparent
        animationType="fade"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.spacing.lg,
              padding: theme.spacing.xl,
              alignItems: 'center',
              minWidth: 200,
            }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="titleMedium" style={{ color: theme.colors.text, marginTop: theme.spacing.lg }}>
              Generating Your Trip Plan
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.sm, textAlign: 'center' }}>
              This may take a few moments...
            </Text>
          </View>
        </View>
      </Modal>
    </MainBody>
  );
}
