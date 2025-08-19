# Book Fair Management System

## Przegląd systemu

System zarządzania targami książek został dodany do platformy SignumLBRI w celu obsługi organizacji i zarządzania targami książkowymi w środowisku szkolnym.

## Funkcjonalności

### 1. Zarządzanie targami książek (Book Fairs)
- **Tworzenie targów**: Administratorzy mogą tworzyć nowe targi książkowe z pełną konfiguracją
- **Lokalizacja**: Obsługa kompletnych danych lokalizacyjnych (adres, sala, budynek)
- **Stanowiska**: Konfiguracja stanowisk z cenami i dostępnością
- **Daty i godziny**: Pełne zarządzanie harmonogramem targów
- **Status**: System śledzenia statusu (planowane, aktywne, zakończone, anulowane)

### 2. Zarządzanie wystawcami (Exhibitors)
- **Rejestracja wystawców**: Proces rejestracji dla wydawców i sprzedawców
- **Dane firmowe**: Kompletne informacje o firmie
- **Osoba kontaktowa**: Pełne dane kontaktowe
- **Weryfikacja**: System zatwierdzania wystawców przez administratora
- **Status**: Śledzenie statusu zatwierdzenia

### 3. Zarządzanie wydarzeniami (Events)
- **Wydarzenia na targach**: Tworzenie wydarzeń w ramach targów
- **Prelegenci**: Zarządzanie listą prelegentów
- **Typy wydarzeń**: Spotkania autorskie, warsztaty, prezentacje
- **Harmonogram**: Zarządzanie slotami czasowymi
- **Frekwencja**: Śledzenie liczby uczestników

### 4. Import danych CSV
- **Automatyczny import książek**: Import dużych ilości danych z plików CSV
- **Inteligentne rozpoznawanie**: Automatyczne wykrywanie przedmiotu na podstawie tytułu
- **Mapowanie danych**: Elastyczne mapowanie kolumn CSV na pola bazy danych
- **Walidacja**: Kompleksowa walidacja importowanych danych

## Struktura modeli

### BookFair Model
```typescript
interface IBookFair {
  title: string;                    // Nazwa targów
  description: string;              // Opis targów
  startDate: Date;                  // Data rozpoczęcia
  endDate: Date;                    // Data zakończenia
  location: {                       // Lokalizacja
    address: string;
    city: string;
    postalCode: string;
    room?: string;
    building?: string;
  };
  maxExhibitors: number;            // Maksymalna liczba wystawców
  boothPrice: number;               // Cena za stanowisko
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  exhibitors: ObjectId[];           // Referencje do wystawców
  events: ObjectId[];               // Referencje do wydarzeń
}
```

### Exhibitor Model
```typescript
interface IExhibitor {
  companyName: string;              // Nazwa firmy
  companyType: 'publisher' | 'bookstore' | 'distributor';
  contactPerson: {                  // Osoba kontaktowa
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  address: {                        // Adres firmy
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  website?: string;                 // Strona internetowa
  description: string;              // Opis działalności
  approvalStatus: 'pending' | 'approved' | 'rejected';
}
```

### Event Model
```typescript
interface IEvent {
  bookFair: ObjectId;               // Referencja do targów
  title: string;                    // Tytuł wydarzenia
  description: string;              // Opis wydarzenia
  eventType: 'author_meeting' | 'workshop' | 'presentation' | 'panel_discussion';
  startTime: Date;                  // Czas rozpoczęcia
  endTime: Date;                    // Czas zakończenia
  speakers: [{                      // Lista prelegentów
    name: string;
    bio?: string;
    photo?: string;
  }];
  maxAttendees: number;             // Maksymalna liczba uczestników
  currentAttendees: number;         // Aktualna liczba uczestników
}
```

## Endpointy API

### Book Fair Management
- `GET /admin/bookfairs` - Lista wszystkich targów
- `POST /admin/bookfairs/create` - Tworzenie nowych targów
- `GET /admin/bookfairs/:id` - Szczegóły targów
- `PUT /admin/bookfairs/:id` - Aktualizacja targów
- `DELETE /admin/bookfairs/:id` - Usuwanie targów

### Exhibitor Management
- `GET /admin/exhibitors` - Lista wystawców
- `POST /admin/exhibitors/:id/approve` - Zatwierdzanie wystawcy
- `POST /admin/exhibitors/:id/reject` - Odrzucenie wystawcy
- `GET /admin/exhibitors/:id` - Szczegóły wystawcy

### Event Management
- `GET /admin/events` - Lista wszystkich wydarzeń
- `POST /admin/events/create` - Tworzenie nowego wydarzenia
- `PUT /admin/events/:id` - Aktualizacja wydarzenia
- `DELETE /admin/events/:id` - Usuwanie wydarzenia

### CSV Import
- `POST /admin/import/csv` - Import danych z pliku CSV
- `GET /admin/import/template` - Pobranie szablonu CSV

### Public Endpoints
- `POST /public/bookfair/register-exhibitor` - Rejestracja wystawcy
- `GET /public/bookfairs` - Publiczna lista targów
- `GET /public/bookfairs/:id/events` - Wydarzenia dla konkretnych targów

## Funkcje kontrolera

### Zarządzanie targami
1. `getBookFairs` - Pobieranie listy targów z paginacją
2. `createBookFair` - Tworzenie nowych targów z walidacją
3. `getBookFairDetails` - Szczegółowe informacje o targach
4. `updateBookFair` - Aktualizacja danych targów
5. `deleteBookFair` - Usuwanie targów z kontrolą integralności

### Zarządzanie wystawcami
1. `getExhibitors` - Lista wystawców z filtrowaniem
2. `approveExhibitor` - Zatwierdzanie wystawcy
3. `rejectExhibitor` - Odrzucenie wniosku wystawcy
4. `getExhibitorDetails` - Szczegóły wystawcy

### Import CSV
1. `uploadCSV` - Upload i parsowanie pliku CSV
2. `importBooksFromCSV` - Import książek z automatycznym wykrywaniem przedmiotu
3. `getImportTemplate` - Generowanie szablonu CSV

## Bezpieczeństwo i walidacja

### Middleware bezpieczeństwa
- Uwierzytelnianie administratora
- Walidacja uprawnień
- Sanityzacja danych wejściowych
- Ochrona przed atakami CSRF

### Walidacja danych
- Kompletna walidacja wszystkich pól formularza
- Sprawdzanie poprawności dat
- Walidacja adresów email i numerów telefonu
- Kontrola integralności referencji między modelami

## Integracja z istniejącym systemem

System targów książek został w pełni zintegrowany z:
- Systemem uwierzytelniania
- Modelem użytkowników
- Systemem uprawnień administratora
- Istniejącymi modelami książek
- Systemem routingu Express.js

## Następne kroki rozwoju

1. **Interface użytkownika**: Implementacja React-based admin panel
2. **System płatności**: Integracja z bramką płatniczą dla opłat za stanowiska
3. **System powiadomień**: Email i SMS notifications dla wystawców
4. **Raporty**: Generowanie raportów sprzedaży i statystyk
5. **Mobilna aplikacja**: Dedykowana aplikacja dla uczestników targów
