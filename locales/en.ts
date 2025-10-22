/**
 * English Translations
 *
 * This file contains all static UI strings in English.
 * Organized by feature/screen for easy maintenance.
 */

export const en = {
  // Common UI elements used across the app
  common: {
    search: "Search...",
    cancel: "Cancel",
    ok: "OK",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    back: "Back",
    next: "Next",
    done: "Done",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    submit: "Submit",
    close: "Close",
    yes: "Yes",
    no: "No",
    others: "Others",
    entranceFee: "Entrance Fee",
    exploreTheArea: "Explore the area",
    viewInMap: "View in Map",
    startArTour: "Start AR Tour",
  },

  // Authentication screens
  auth: {
    login: "Login",
    signup: "Sign up",
    email: "Email",
    password: "Password",
    forgotPassword: "Forget the password?",
    resetPassword: "Reset the password",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    firstName: "First name",
    lastName: "Last name",
    username: "Username",
    areaCode: "Area code",
    mobileNumber: "Mobile Number",
    requiredField: "Required field",
    emailRequired: "Email*",
    passwordRequired: "Password*",
    firstNameRequired: "First name*",
    lastNameRequired: "Last name*",
  },

  // Home screen
  home: {
    yourFavoritePlaces: "Your Favorite Places",
    attractions: "Attractions",
    hiking: "Hiking",
    food: "Food",
    lodgings: "Lodgings",
    experiences: "Experiences",
    events: "Events",
    welcome: "Welcome",
    explore: "Explore",
    greatOutdoors: "Great Outdoors",
    greatWorkshop: "Great Workshop",
    transportation: "Transportation",
    foodAndLodging: "Food & Lodging",
    culinaryDelights: "Culinary Delights",
    virtualReconstruction: "Virtual reconstruction",
    restaurants: "Restaurants",
    accommodations: "Accommodations",
    welcomeToVedi: "Welcome to\nthe Vedi River Valley!",
  },

  // Navigation tabs
  tabs: {
    home: "Home",
    map: "Map",
    account: "Account",
  },

  // AR (Augmented Reality) features
  ar: {
    reconstructionGuide: "Reconstruction Guide",
    welcome: "Welcome!",
    guideText1: "Once you've positioned it as close to the ruins as possible, simply tap the 'place it' button to lock the model in place.",
    guideText2: "Once the model is placed, feel free to rotate and move it around using the on-screen controls to get the perfect view.",
    guideText3:
      "When you're satisfied with the positioning, don't forget to tap the camera button located at the bottom right to capture a commemorative photo. Enjoy your experience!",
    gotItLetsTry: "Got it, Let's try",
    placeIt: "Place It!",
    reset: "Reset",
    screenshot: "Screenshot",
    controls: "Controls",
    help: "Help",
  },

  // Explore and comments
  explore: {
    leaveComment: "Leave a Comment!",
    tapToLeaveComment: "Tap on screen to leave your comment",
    congratsArrived: "Congrats! You've arrived",
    navigatingTo: "Navigating to",
    arrived: "Arrived!",
    distance: "Distance",
    estimatedTime: "Estimated time",
  },

  // Profile and account
  profile: {
    profile: "Profile",
    account: "Account",
    changePassword: "Change password",
    contact: "Contact",
    email: "Email",
    mobileNumber: "Mobile number",
    settings: "Settings",
    logout: "Logout",
    editProfile: "Edit Profile",
    signOut: "Sign out",
    helpAndFeedback: "Help and feedback",
    basicInformation: "Basic Information",
    name: "Name",
    birthday: "Birthday",
    username: "Username",
    phone: "Phone",
    edit: "Edit",
    darkMode: "Dark mode",
    notProvided: "Not provided",
    password: "Password",
    firstName: "First name",
    lastName: "Last name",
    save: "Save",
    updated: "Profile Updated",
    areaCode: "Area code",
  },

  // Language settings
  language: {
    title: "Language Settings",
    subtitle: "Choose your preferred language",
    selectLanguage: "Select Language",
    saveChanges: "Save Changes",
    english: "English",
    armenian: "Armenian",
    russian: "Russian",
  },

  // Map and location
  map: {
    map: "Map",
    location: "Location",
    directions: "Directions",
    nearMe: "Near me",
    viewOnMap: "View on map",
  },

  // Search and filters
  search: {
    searchResults: "Search Results",
    noResults: "No results found",
    tryAgain: "Try again",
    filter: "Filter",
    sortBy: "Sort by",
    category: "Category",
  },

  // Error messages
  errors: {
    somethingWentWrong: "Something went wrong",
    pleaseTryAgain: "Please try again",
    networkError: "Network error",
    invalidCredentials: "Invalid credentials",
    requiredField: "This field is required",
    invalidEmail: "Invalid email format",
    passwordTooShort: "Password is too short",
    passwordMismatch: "Passwords don't match",
  },

  // Validation messages
  validation: {
    required: "Required field",
    email: "Please enter a valid email",
    password: "Password must be at least 8 characters",
    phone: "Please enter a valid phone number",
    birthday: "Please enter a valid date (DD/MM/YYYY)",
  },
} as const;
