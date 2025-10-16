/**
 * Armenian Translations (Հայերեն)
 * 
 * This file contains all static UI strings in Armenian.
 * Structure mirrors en.ts for consistency.
 */

import { Translations } from './types';

export const hy: Translations = {
  // Common UI elements used across the app
  common: {
    search: "Փնտրել...",
    cancel: "Չեղարկել",
    ok: "Լավ",
    save: "Պահպանել",
    delete: "Ջնջել",
    edit: "Խմբագրել",
    back: "Հետ",
    next: "Հաջորդ",
    done: "Պատրաստ",
    loading: "Բեռնում...",
    error: "Սխալ",
    success: "Հաջողություն",
    confirm: "Հաստատել",
    submit: "Ուղարկել",
    close: "Փակել",
    yes: "Այո",
    no: "Ոչ",
    others: "Այլ",
  },

  // Authentication screens
  auth: {
    login: "Մուտք",
    signup: "Գրանցվել",
    email: "Էլ․ հասցե",
    password: "Գաղտնաբառ",
    forgotPassword: "Մոռացե՞լ եք գաղտնաբառը",
    resetPassword: "Վերականգնել գաղտնաբառը",
    dontHaveAccount: "Չունե՞ք հաշիվ",
    alreadyHaveAccount: "Արդեն ունե՞ք հաշիվ",
    firstName: "Անուն",
    lastName: "Ազգանուն",
    username: "Օգտանուն",
    areaCode: "Կոդ",
    mobileNumber: "Բջջային համար",
    requiredField: "Պարտադիր դաշտ",
    emailRequired: "Էլ․ հասցե*",
    passwordRequired: "Գաղտնաբառ*",
    firstNameRequired: "Անուն*",
    lastNameRequired: "Ազգանուն*",
  },

  // Home screen
  home: {
    yourFavoritePlaces: "Ձեր սիրելի վայրերը",
    attractions: "Տեսարժան վայրեր",
    hiking: "Արշավ",
    food: "Սնունդ",
    lodgings: "Կացարան",
    experiences: "Փորձառություններ",
    events: "Միջոցառումներ",
    welcome: "Բարի գալուստ",
    explore: "Ուսումնասիրել",
    greatOutdoors: "Հիանալի բնություն",
    greatWorkshop: "Հիանալի վարպետության դաս",
    transportation: "Տրանսպորտ",
    foodAndLodging: "Սնունդ և կացարան",
    culinaryDelights: "Խոհարարական հաճույքներ",
    virtualReconstruction: "Վիրտուալ վերակառուցում",
  },

  // AR (Augmented Reality) features
  ar: {
    reconstructionGuide: "Վերականգնման ուղեցույց",
    welcome: "Բարի գալուստ!",
    guideText1: "Երբ դուք այն տեղադրեք ավերակներին հնարավորինս մոտ, պարզապես սեղմեք «տեղադրել» կոճակը՝ մոդելը ամրացնելու համար:",
    guideText2: "Մոդելը տեղադրելուց հետո, ազատ զգացեք այն պտտել և տեղափոխել էկրանի վերահսկիչների միջոցով՝ կատարյալ տեսարան ստանալու համար:",
    guideText3: "Երբ բավարարված եք դիրքավորմամբ, մի մոռացեք սեղմել ֆոտոխցիկի կոճակը՝ հուշանկարային լուսանկար անելու համար: Վայելեք փորձառությունը!",
    gotItLetsTry: "Հասկացա, եկեք փորձենք",
    placeIt: "Տեղադրել!",
    reset: "Վերականգնել",
    screenshot: "Էկրանի նկար",
    controls: "Կառավարում",
    help: "Օգնություն",
  },

  // Explore and comments
  explore: {
    leaveComment: "Թողնել մեկնաբանություն!",
    tapToLeaveComment: "Սեղմեք էկրանին մեկնաբանություն թողնելու համար",
    congratsArrived: "Շնորհավորում ենք! Դուք հասել եք",
    navigatingTo: "Նավարկություն դեպի",
    arrived: "Հասել եք!",
    distance: "Հեռավորություն",
    estimatedTime: "Մոտավոր ժամանակ",
  },

  // Profile and account
  profile: {
    profile: "Պրոֆիլ",
    account: "Հաշիվ",
    changePassword: "Փոխել գաղտնաբառը",
    contact: "Կապ",
    email: "Էլ․ հասցե",
    mobileNumber: "Բջջային համար",
    settings: "Կարգավորումներ",
    logout: "Դուրս գալ",
    editProfile: "Խմբագրել պրոֆիլը",
    signOut: "Դուրս գալ",
    helpAndFeedback: "Օգնություն և կարծիք",
    basicInformation: "Հիմնական տեղեկություններ",
    name: "Անուն",
    birthday: "Ծննդյան օր",
    username: "Օգտանուն",
    phone: "Հեռախոս",
    edit: "Խմբագրել",
    darkMode: "Մութ ռեժիմ",
    notProvided: "Չի տրամադրված",
    password: "Գաղտնաբառ",
    firstName: "Անուն",
    lastName: "Ազգանուն",
    save: "Պահպանել",
    updated: "Պրոֆիլը թարմացված է",
    areaCode: "Կոդ",
  },

  // Language settings
  language: {
    title: "Լեզվի կարգավորումներ",
    subtitle: "Ընտրեք ձեր նախընտրած լեզուն",
    selectLanguage: "Ընտրել լեզու",
    saveChanges: "Պահպանել փոփոխությունները",
    english: "Անգլերեն",
    armenian: "Հայերեն",
    russian: "Ռուսերեն",
  },

  // Map and location
  map: {
    map: "Քարտեզ",
    location: "Տեղանք",
    directions: "Ուղղություններ",
    nearMe: "Իմ մոտ",
    viewOnMap: "Դիտել քարտեզի վրա",
  },

  // Search and filters
  search: {
    searchResults: "Որոնման արդյունքներ",
    noResults: "Արդյունքներ չեն գտնվել",
    tryAgain: "Փորձեք նորից",
    filter: "Զտիչ",
    sortBy: "Դասակարգել ըստ",
    category: "Կատեգորիա",
  },

  // Error messages
  errors: {
    somethingWentWrong: "Ինչ-որ բան սխալ է գնացել",
    pleaseTryAgain: "Խնդրում ենք փորձել նորից",
    networkError: "Ցանցի սխալ",
    invalidCredentials: "Անվավեր տվյալներ",
    requiredField: "Այս դաշտը պարտադիր է",
    invalidEmail: "Անվավեր էլ․ փոստի ձևաչափ",
    passwordTooShort: "Գաղտնաբառը չափազանց կարճ է",
    passwordMismatch: "Գաղտնաբառերը չեն համընկնում",
  },

  // Validation messages
  validation: {
    required: "Պարտադիր դաշտ",
    email: "Խնդրում ենք մուտքագրել վավեր էլ․ փոստ",
    password: "Գաղտնաբառը պետք է լինի առնվազն 8 նիշ",
    phone: "Խնդրում ենք մուտքագրել վավեր հեռախոսահամար",
    birthday: "Խնդրում ենք մուտքագրել վավեր ամսաթիվ (ՕՕ/ԱԱ/ՏՏՏՏ)",
  },
} as const;
