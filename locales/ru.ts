/**
 * Russian Translations (Русский)
 *
 * This file contains all static UI strings in Russian.
 * Structure mirrors en.ts for consistency.
 */

import { Translations } from "./types";

export const ru: Translations = {
  // Common UI elements used across the app
  common: {
    search: "Поиск...",
    cancel: "Отмена",
    ok: "ОК",
    save: "Сохранить",
    delete: "Удалить",
    edit: "Редактировать",
    back: "Назад",
    next: "Далее",
    done: "Готово",
    loading: "Загрузка...",
    error: "Ошибка",
    success: "Успешно",
    confirm: "Подтвердить",
    submit: "Отправить",
    close: "Закрыть",
    yes: "Да",
    no: "Нет",
    others: "Другое",
    entranceFee: "Входная плата",
    exploreTheArea: "Исследуйте эту область",
    viewInMap: "Посмотреть на карте",
    startArTour: "Начать AR тур",
  },

  // Authentication screens
  auth: {
    login: "Вход",
    signup: "Регистрация",
    email: "Эл. почта",
    password: "Пароль",
    forgotPassword: "Забыли пароль?",
    resetPassword: "Сбросить",
    dontHaveAccount: "Нет аккаунта?",
    alreadyHaveAccount: "Уже есть аккаунт?",
    firstName: "Имя",
    lastName: "Фамилия",
    username: "Имя пользователя",
    areaCode: "Код",
    mobileNumber: "Мобильный номер",
    requiredField: "Обязательное поле",
    emailRequired: "Эл. почта*",
    passwordRequired: "Пароль*",
    firstNameRequired: "Имя*",
    lastNameRequired: "Фамилия*",
    resetTitle: "Сброс пароля",
    resetIntro: "Введите адрес, с которым вы регистрировались, и мы отправим 6-значный код.",
    sendCode: "Отправить код",
    codeSentTo: "Если для {email} есть аккаунт, 6-значный код уже в пути. Он может прийти через минуту, проверьте также папку «Спам».",
    code: "6-значный код",
    newPassword: "Новый пароль (от 8 символов)",
    setNewPassword: "Сохранить новый пароль",
    verifyTitle: "Подтвердите почту",
    verifyIntro: "Введите 6-значный код, отправленный на {email}. Он может прийти через минуту, проверьте также папку «Спам».",
    confirm: "Подтвердить",
    resendCode: "Отправить новый код",
    resendIn: "Новый код через {seconds} с",
    codeResent: "Новый код отправлен.",
    later: "Позже",
    verified: "Почта подтверждена",
    notVerified: "Почта ещё не подтверждена",
    confirmNow: "Подтвердить",
    privacyNotice: "Регистрируясь, вы соглашаетесь с нашей политикой конфиденциальности.",
    privacyLink: "Политика конфиденциальности",
    lastNameOptional: "Фамилия (необязательно)",
    passwordHint: "Пароль* (от 8 символов)",
    changePassword: "Сменить пароль",
    currentPassword: "Текущий пароль",
    passwordChanged: "Пароль изменён",
    deleteAccount: "Удалить аккаунт",
    deleteTitle: "Удалить аккаунт?",
    deleteMessage: "Аккаунт, избранное и комментарии будут удалены навсегда. Это нельзя отменить.",
    deleteConfirm: "Удалить",
    cancel: "Отмена",
  },

  // Messages for account errors (sign-in, codes, passwords)
  authErrors: {
    invalidLogin: "Неверная почта или пароль.",
    emailTaken: "Аккаунт с этой почтой уже существует. Войдите или сбросьте пароль.",
    tooMany: "Слишком много попыток. Подождите несколько минут и попробуйте снова.",
    codeWrong: "Неверный код. Проверьте письмо и попробуйте снова.",
    codeExpired: "Срок действия кода истёк. Отправьте новый.",
    codeLocked: "Слишком много неверных кодов. Отправьте новый.",
    passwordShort: "Пароль должен содержать не менее 8 символов.",
    currentPasswordWrong: "Текущий пароль неверен.",
    network: "Нет связи с сервером. Проверьте подключение и попробуйте снова.",
    sessionEnded: "Сеанс завершён. Пожалуйста, войдите снова.",
    generic: "Что-то пошло не так. Попробуйте снова.",
  },

  // Home screen
  home: {
    yourFavoritePlaces: "Ваши любимые места",
    attractions: "Достопримечательности",
    hiking: "Походы",
    food: "Еда",
    lodgings: "Жильё",
    experiences: "Впечатления",
    events: "События",
    welcome: "Добро пожаловать",
    explore: "Исследовать",
    greatOutdoors: "Отличный отдых на природе",
    greatWorkshop: "Отличные мастер-классы",
    transportation: "Транспорт",
    foodAndLodging: "Еда и жильё",
    culinaryDelights: "Кулинарные изыски",
    virtualReconstruction: "Виртуальная реконструкция",
    restaurants: "Рестораны",
    accommodations: "Проживание",
    welcomeToVedi: "Добро пожаловать\nв долину реки Веди!",
  },

  // Navigation tabs
  tabs: {
    home: "Главная",
    map: "Карта",
    account: "Аккаунт",
  },

  // AR (Augmented Reality) features
  ar: {
    reconstructionGuide: "Руководство по реконструкции",
    welcome: "Добро пожаловать!",
    guideText1: "Когда вы расположите его как можно ближе к руинам, просто нажмите кнопку «разместить», чтобы зафиксировать модель на месте.",
    guideText2:
      "После размещения модели вы можете свободно вращать и перемещать её с помощью элементов управления на экране, чтобы получить идеальный вид.",
    guideText3:
      "Когда вы будете довольны расположением, не забудьте нажать кнопку камеры в правом нижнем углу, чтобы сделать памятную фотографию. Наслаждайтесь!",
    gotItLetsTry: "Понятно, давайте попробуем",
    placeIt: "Разместить!",
    reset: "Сбросить",
    screenshot: "Скриншот",
    controls: "Управление",
    help: "Помощь",
  },

  // Explore and comments
  explore: {
    leaveComment: "Оставить комментарий!",
    tapToLeaveComment: "Нажмите на экран, чтобы оставить комментарий",
    congratsArrived: "Поздравляем! Вы прибыли",
    navigatingTo: "Навигация к",
    arrived: "Прибыли!",
    distance: "Расстояние",
    estimatedTime: "Примерное время",
  },

  // Profile and account
  profile: {
    profile: "Профиль",
    account: "Аккаунт",
    changePassword: "Изменить пароль",
    contact: "Контакты",
    email: "Эл. почта",
    mobileNumber: "Мобильный номер",
    settings: "Настройки",
    logout: "Выйти",
    editProfile: "Редактировать профиль",
    signOut: "Выйти",
    helpAndFeedback: "Помощь и обратная связь",
    privacyPolicy: "Политика конфиденциальности",
    arcoreNotice:
      "Это приложение работает на базе сервисов Google Play для AR (ARCore), которые предоставляются Google и регулируются Политикой конфиденциальности Google.",
    basicInformation: "Основная информация",
    name: "Имя",
    birthday: "День рождения",
    username: "Имя пользователя",
    phone: "Телефон",
    edit: "Редактировать",
    darkMode: "Темный режим",
    notProvided: "Не указано",
    password: "Пароль",
    firstName: "Имя",
    lastName: "Фамилия",
    save: "Сохранить",
    updated: "Профиль обновлён",
    areaCode: "Код страны",
    helpFeedbackDescription: "Нужна помощь или хотите оставить отзыв? Заполните форму пользовательской оценки.",
    userEvaluation: "Оценка пользователя",
    userEvaluationHint: "Форма встроена ниже.",
  },

  // Language settings
  language: {
    title: "Настройки языка",
    subtitle: "Выберите предпочитаемый язык",
    selectLanguage: "Выбрать язык",
    saveChanges: "Сохранить изменения",
    english: "Английский",
    armenian: "Армянский",
    russian: "Русский",
  },

  // Map and location
  map: {
    map: "Карта",
    location: "Местоположение",
    directions: "Маршруты",
    nearMe: "Рядом со мной",
    viewOnMap: "Посмотреть на карте",
  },

  // Search and filters
  search: {
    searchResults: "Результаты поиска",
    noResults: "Результаты не найдены",
    tryAgain: "Попробуйте снова",
    filter: "Фильтр",
    sortBy: "Сортировать по",
    category: "Категория",
  },

  // Error messages
  errors: {
    somethingWentWrong: "Что-то пошло не так",
    pleaseTryAgain: "Пожалуйста, попробуйте снова",
    networkError: "Ошибка сети",
    invalidCredentials: "Неверные данные",
    requiredField: "Это поле обязательно",
    invalidEmail: "Неверный формат электронной почты",
    passwordTooShort: "Пароль слишком короткий",
    passwordMismatch: "Пароли не совпадают",
  },

  // Validation messages
  validation: {
    required: "Обязательное поле",
    email: "Пожалуйста, введите действительный адрес электронной почты",
    password: "Пароль должен содержать не менее 8 символов",
    phone: "Пожалуйста, введите действительный номер телефона",
    birthday: "Пожалуйста, введите действительную дату (ДД/ММ/ГГГГ)",
  },
} as const;
