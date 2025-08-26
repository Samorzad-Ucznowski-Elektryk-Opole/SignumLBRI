/**
 * 🌐 Enhanced Language Controller - Advanced Multi-language Support
 * 
 * Features:
 * - Real-time language switching
 * - Enhanced translation system
 * - User preference management
 * - Dynamic content localization
 */

import { Request, Response, NextFunction } from "express";

// Enhanced language definitions
const enhancedLanguages = {
  pl: {
    code: 'pl',
    name: 'Polski',
    flag: '🇵🇱',
    rtl: false,
    enhanced: {
      website: {
        title: 'SignumLBRI - Zaawansowany',
        subtitle: 'Platforma Zarządzania Książkami',
        description: 'Nowoczesna platforma do zarządzania książkami szkolnymi z zaawansowanymi funkcjami',
        features: {
          dashboard: 'Panel Kontrolny',
          books: 'Książki',
          users: 'Użytkownicy',
          analytics: 'Analityka',
          admin: 'Administracja',
          library: 'Biblioteka'
        },
        navigation: {
          home: 'Główna',
          dashboard: 'Panel',
          books: 'Książki',
          users: 'Użytkownicy',
          analytics: 'Analityka',
          profile: 'Profil',
          settings: 'Ustawienia',
          admin: 'Admin',
          logout: 'Wyloguj'
        },
        buttons: {
          add: 'Dodaj',
          edit: 'Edytuj',
          delete: 'Usuń',
          save: 'Zapisz',
          cancel: 'Anuluj',
          search: 'Szukaj',
          filter: 'Filtruj',
          export: 'Eksportuj',
          import: 'Importuj',
          refresh: 'Odśwież',
          view: 'Zobacz',
          manage: 'Zarządzaj'
        },
        forms: {
          title: 'Tytuł',
          author: 'Autor',
          publisher: 'Wydawnictwo',
          price: 'Cena',
          category: 'Kategoria',
          description: 'Opis',
          isbn: 'ISBN',
          year: 'Rok',
          pages: 'Strony',
          language: 'Język',
          condition: 'Stan'
        },
        messages: {
          success: 'Operacja zakończona pomyślnie',
          error: 'Wystąpił błąd',
          warning: 'Ostrzeżenie',
          info: 'Informacja',
          loading: 'Ładowanie...',
          noData: 'Brak danych',
          confirm: 'Czy jesteś pewien?'
        },
        stats: {
          total: 'Łącznie',
          active: 'Aktywne',
          sold: 'Sprzedane',
          available: 'Dostępne',
          users: 'Użytkownicy',
          books: 'Książki',
          earnings: 'Zarobki',
          growth: 'Wzrost'
        }
      }
    }
  },
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    rtl: false,
    enhanced: {
      website: {
        title: 'SignumLBRI - Enhanced',
        subtitle: 'Book Management Platform',
        description: 'Modern platform for managing school books with advanced features',
        features: {
          dashboard: 'Dashboard',
          books: 'Books',
          users: 'Users',
          analytics: 'Analytics',
          admin: 'Administration',
          library: 'Library'
        },
        navigation: {
          home: 'Home',
          dashboard: 'Dashboard',
          books: 'Books',
          users: 'Users',
          analytics: 'Analytics',
          profile: 'Profile',
          settings: 'Settings',
          admin: 'Admin',
          logout: 'Logout'
        },
        buttons: {
          add: 'Add',
          edit: 'Edit',
          delete: 'Delete',
          save: 'Save',
          cancel: 'Cancel',
          search: 'Search',
          filter: 'Filter',
          export: 'Export',
          import: 'Import',
          refresh: 'Refresh',
          view: 'View',
          manage: 'Manage'
        },
        forms: {
          title: 'Title',
          author: 'Author',
          publisher: 'Publisher',
          price: 'Price',
          category: 'Category',
          description: 'Description',
          isbn: 'ISBN',
          year: 'Year',
          pages: 'Pages',
          language: 'Language',
          condition: 'Condition'
        },
        messages: {
          success: 'Operation completed successfully',
          error: 'An error occurred',
          warning: 'Warning',
          info: 'Information',
          loading: 'Loading...',
          noData: 'No data available',
          confirm: 'Are you sure?'
        },
        stats: {
          total: 'Total',
          active: 'Active',
          sold: 'Sold',
          available: 'Available',
          users: 'Users',
          books: 'Books',
          earnings: 'Earnings',
          growth: 'Growth'
        }
      }
    }
  },
  uk: {
    code: 'uk',
    name: 'Українська',
    flag: '🇺🇦',
    rtl: false,
    enhanced: {
      website: {
        title: 'SignumLBRI - Розширений',
        subtitle: 'Платформа Управління Книгами',
        description: 'Сучасна платформа для управління шкільними книгами з розширеними функціями',
        features: {
          dashboard: 'Панель Управління',
          books: 'Книги',
          users: 'Користувачі',
          analytics: 'Аналітика',
          admin: 'Адміністрування',
          library: 'Бібліотека'
        },
        navigation: {
          home: 'Головна',
          dashboard: 'Панель',
          books: 'Книги',
          users: 'Користувачі',
          analytics: 'Аналітика',
          profile: 'Профіль',
          settings: 'Налаштування',
          admin: 'Адмін',
          logout: 'Вийти'
        },
        buttons: {
          add: 'Додати',
          edit: 'Редагувати',
          delete: 'Видалити',
          save: 'Зберегти',
          cancel: 'Скасувати',
          search: 'Пошук',
          filter: 'Фільтр',
          export: 'Експорт',
          import: 'Імпорт',
          refresh: 'Оновити',
          view: 'Переглянути',
          manage: 'Керувати'
        },
        forms: {
          title: 'Назва',
          author: 'Автор',
          publisher: 'Видавництво',
          price: 'Ціна',
          category: 'Категорія',
          description: 'Опис',
          isbn: 'ISBN',
          year: 'Рік',
          pages: 'Сторінки',
          language: 'Мова',
          condition: 'Стан'
        },
        messages: {
          success: 'Операція виконана успішно',
          error: 'Виникла помилка',
          warning: 'Попередження',
          info: 'Інформація',
          loading: 'Завантаження...',
          noData: 'Немає даних',
          confirm: 'Ви впевнені?'
        },
        stats: {
          total: 'Всього',
          active: 'Активні',
          sold: 'Продані',
          available: 'Доступні',
          users: 'Користувачі',
          books: 'Книги',
          earnings: 'Заробіток',
          growth: 'Зростання'
        }
      }
    }
  }
};

/**
 * Enhanced Language Middleware
 * Provides advanced language support with user preferences
 */
export const enhancedLanguageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get language from various sources (priority order)
    let selectedLanguage = 
      req.session?.language ||           // User session preference
      req.user?.preferences?.language || // User profile preference
      req.query.lang as string ||       // URL parameter
      req.headers['accept-language']?.split(',')[0]?.split('-')[0] || // Browser preference
      'pl';                             // Default fallback

    // Validate language exists
    if (!enhancedLanguages[selectedLanguage as keyof typeof enhancedLanguages]) {
      selectedLanguage = 'pl';
    }

    // Set language in session for persistence
    if (req.session) {
      req.session.language = selectedLanguage;
    }

    // Set language data in response locals
    const languageData = enhancedLanguages[selectedLanguage as keyof typeof enhancedLanguages];
    res.locals.currentLanguage = selectedLanguage;
    res.locals.languageData = languageData;
    res.locals.language = languageData.enhanced;
    res.locals.availableLanguages = enhancedLanguages;
    res.locals.isRTL = languageData.rtl;

    // Add language helpers
    res.locals.t = (key: string, fallback?: string) => {
      return getNestedProperty(languageData.enhanced, key) || fallback || key;
    };

    res.locals.formatDate = (date: Date) => {
      return formatDateForLanguage(date, selectedLanguage);
    };

    res.locals.formatCurrency = (amount: number) => {
      return formatCurrencyForLanguage(amount, selectedLanguage);
    };

    next();

  } catch (error) {
    console.error('Enhanced Language Middleware Error:', error);
    // Set defaults on error
    res.locals.currentLanguage = 'pl';
    res.locals.languageData = enhancedLanguages.pl;
    res.locals.language = enhancedLanguages.pl.enhanced;
    res.locals.availableLanguages = enhancedLanguages;
    res.locals.isRTL = false;
    res.locals.t = (key: string, fallback?: string) => fallback || key;
    res.locals.formatDate = (date: Date) => date.toLocaleDateString();
    res.locals.formatCurrency = (amount: number) => `${amount} PLN`;
    next();
  }
};

/**
 * Enhanced Change Language Handler
 * POST /enhanced/language
 */
export const enhancedChangeLanguage = async (req: Request, res: Response) => {
  try {
    const { language, redirect } = req.body;
    
    // Validate language
    if (!enhancedLanguages[language as keyof typeof enhancedLanguages]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language code'
      });
    }

    // Update session
    if (req.session) {
      req.session.language = language;
    }

    // Update user preference if authenticated
    if (req.user) {
      try {
        // In a real implementation, you'd update the user's language preference in the database
        // await User.findByIdAndUpdate(req.user.id, { 
        //   'preferences.language': language 
        // });
        
        console.log(`Updated language preference for user ${req.user.id} to ${language}`);
      } catch (error) {
        console.error('Error updating user language preference:', error);
      }
    }

    // Handle different response types
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      // AJAX request
      res.json({
        success: true,
        message: 'Language updated successfully',
        language: language,
        languageData: enhancedLanguages[language as keyof typeof enhancedLanguages]
      });
    } else {
      // Form submission
      const redirectUrl = redirect || req.get('Referer') || '/enhanced';
      res.redirect(redirectUrl);
    }

  } catch (error) {
    console.error('Enhanced Change Language Error:', error);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({
        success: false,
        message: 'Error updating language'
      });
    } else {
      res.redirect('/enhanced');
    }
  }
};

// === HELPER FUNCTIONS ===

/**
 * Get nested property from object using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  } catch (error) {
    return undefined;
  }
}

/**
 * Format date for specific language
 */
function formatDateForLanguage(date: Date, language: string): string {
  try {
    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    switch (language) {
      case 'pl':
        return date.toLocaleDateString('pl-PL', formatOptions);
      case 'en':
        return date.toLocaleDateString('en-US', formatOptions);
      case 'uk':
        return date.toLocaleDateString('uk-UA', formatOptions);
      default:
        return date.toLocaleDateString('pl-PL', formatOptions);
    }
  } catch (error) {
    return date.toLocaleDateString();
  }
}

/**
 * Format currency for specific language
 */
function formatCurrencyForLanguage(amount: number, language: string): string {
  try {
    switch (language) {
      case 'pl':
        return new Intl.NumberFormat('pl-PL', {
          style: 'currency',
          currency: 'PLN'
        }).format(amount);
      case 'en':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount * 0.25); // Mock conversion
      case 'uk':
        return new Intl.NumberFormat('uk-UA', {
          style: 'currency',
          currency: 'UAH'
        }).format(amount * 10); // Mock conversion
      default:
        return `${amount} PLN`;
    }
  } catch (error) {
    return `${amount} PLN`;
  }
}

/**
 * Get browser language preference
 */
export function getBrowserLanguage(req: Request): string {
  try {
    const acceptLanguage = req.headers['accept-language'];
    if (!acceptLanguage) return 'pl';

    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase())
      .map(lang => lang.split('-')[0]);

    for (const lang of languages) {
      if (enhancedLanguages[lang as keyof typeof enhancedLanguages]) {
        return lang;
      }
    }

    return 'pl';
  } catch (error) {
    return 'pl';
  }
}

/**
 * Get language statistics for admin
 */
export async function getLanguageStatistics() {
  try {
    // In a real implementation, you'd query the database for language usage statistics
    return {
      totalUsers: 150,
      byLanguage: {
        pl: { users: 120, percentage: 80 },
        en: { users: 20, percentage: 13.3 },
        uk: { users: 10, percentage: 6.7 }
      },
      mostPopular: 'pl',
      growth: {
        pl: 5,
        en: 15,
        uk: 25
      }
    };
  } catch (error) {
    console.error('Language Statistics Error:', error);
    return {
      totalUsers: 0,
      byLanguage: {},
      mostPopular: 'pl',
      growth: {}
    };
  }
}

/**
 * Validate language code
 */
export function isValidLanguage(language: string): boolean {
  return language in enhancedLanguages;
}

/**
 * Get available languages list
 */
export function getAvailableLanguages() {
  return Object.values(enhancedLanguages).map(lang => ({
    code: lang.code,
    name: lang.name,
    flag: lang.flag,
    rtl: lang.rtl
  }));
}
