# 📚 SignumLBRI - Analiza Funkcjonalności i Działów

## 🏗️ Architektura Systemu

### 📁 Główne Komponenty
```
├── 🖥️  Frontend (Pug Templates + TailwindCSS + Bootstrap)
├── ⚙️  Backend (Node.js + TypeScript + Express)
├── 🗄️  Baza Danych (MongoDB + Mongoose)
├── 🐳 Docker (Containerization)
└── 🔐 Authentication (Passport.js)
```

---

## 🎯 Główne Działy Funkcjonalne

### 1. 👥 **MODUŁ UŻYTKOWNIKÓW** 
📍 **Controller**: `src/controllers/user.ts`
📍 **Model**: `src/models/User.ts`

#### Funkcjonalności:
- ✅ Rejestracja użytkowników
- ✅ Logowanie/wylogowanie  
- ✅ Profile użytkowników
- ✅ Weryfikacja emaili
- ✅ Reset hasła
- ✅ Zarządzanie kontami

#### Role Użytkowników:
- 👨‍🎓 **Student** - podstawowe konto
- 👨‍💼 **Seller** - może sprzedawać książki
- 🛡️ **Admin** - administracja szkoły
- 👑 **HeadAdmin** - super admin wszystkich szkół

---

### 2. 📚 **MODUŁ KSIĄŻEK** 
📍 **Controller**: `src/controllers/book.ts`
📍 **Models**: `src/models/Book.ts`, `src/models/BookListing.ts`

#### Funkcjonalności:
- ✅ Dodawanie książek do sprzedaży
- ✅ Wyszukiwanie po ISBN
- ✅ Zarządzanie ofertami (`BookListing`)
- ✅ Akceptacja ofert przez sprzedawców
- ✅ Sprzedaż książek
- ✅ Anulowanie ofert
- ✅ Usuwanie książek (admin)
- ✅ Generowanie kodów kreskowych
- ✅ System etykiet i zarządzanie logistyką

#### Stany Książek:
- 🆕 **Created** - nowo dodana
- ✅ **Accepted** - zaakceptowana przez sprzedawcę
- 💰 **Sold** - sprzedana
- ❌ **Deleted** - usunięta
- ⏸️ **Cancelled** - anulowana

---

### 3. 🏫 **MODUŁ SZKÓŁ**
📍 **Controller**: `src/controllers/school.ts`
📍 **Model**: `src/models/School.ts`

#### Funkcjonalności:
- ✅ Rejestracja nowych szkół
- ✅ Zarządzanie logami szkół
- ✅ System marży/prowizji dla szkół
- ✅ Ikony/loga szkół
- ✅ Separacja danych między szkołami

---

### 4. 🛡️ **PANEL ADMINISTRACYJNY**
📍 **Controller**: `src/controllers/admin.ts`
📍 **Routes**: `/admin/*`

#### Główne Sekcje:
##### 📊 Dashboard Główny
- Statystyki ogólne
- Wykresy sprzedaży
- Przegląd aktywności

##### 👥 Zarządzanie Użytkownikami
- Lista wszystkich użytkowników
- Edycja profili
- Nadawanie uprawnień
- Dawanie pieniędzy użytkownikom

##### 📚 Zarządzanie Książkami  
- Lista wszystkich książek
- Statystyki książek
- Wykresy sprzedaży w czasie
- Zarządzanie ofertami

##### 💰 Kupujący i Rozliczenia
- Lista kupujących (`Buyer`)
- Statystyki zarobków
- Prowizje szkół
- Raporty finansowe

##### 📈 Analityka i Raporty
- Wykresy użytkowników w czasie
- Statystyki wydajności
- Analiza sprzedaży
- Metryki szkół

---

### 5. 🛒 **SYSTEM SPRZEDAŻY**
📍 **Models**: `src/models/Buyer.ts`, `src/models/BookListing.ts`

#### Proces Sprzedaży:
1. 📝 **Dodanie książki** przez studenta
2. ✅ **Akceptacja** przez sprzedawcę (seller)
3. 🏷️ **Generowanie etykiety** z kodem kreskowym
4. 📦 **Fizyczne oddanie** książki do punktu
5. 💰 **Sprzedaż** przez sprzedawcę
6. 💳 **Rozliczenie** z kupującym

#### Ekonomiczny Model:
- Student ustala **cenę bazową**
- Szkoła dodaje **marżę szkolną** (konfigurowalną)
- System dodaje **20% dla twórcy aplikacji**
- **Końcowa cena** = cena_bazowa + marża_szkoły + 20%

---

### 6. 🔍 **SYSTEM WYSZUKIWANIA**
📍 **Utils**: `src/util/findBook.ts`

#### Funkcjonalności:
- ✅ Wyszukiwanie po ISBN
- ✅ Integracja z zewnętrznymi API
- ✅ Auto-uzupełnianie danych książek
- ✅ Wyszukiwanie w bibliotece dostępnych książek

---

### 7. 🌍 **SYSTEM WIELOJĘZYCZNOŚCI**
📍 **Lang**: `src/lang/`

#### Dostępne Języki:
- 🇵🇱 Polski (`pl.ts`) - główny
- 🇺🇦 Ukraiński (`uk.ts`)  
- 🇬🇧 Angielski (`en.ts`)
- 😄 "Bad Polish" (`bad_polish.ts`) - żartobliwa wersja

---

### 8. 🖼️ **SYSTEM OBRAZÓW**
📍 **Controller**: `src/controllers/image.ts`

#### Funkcjonalności:
- ✅ Okładki książek
- ✅ Loga szkół  
- ✅ Optymalizacja obrazów (Sharp)
- ✅ Caching obrazów

---

### 9. 📊 **SYSTEM RAPORTOWANIA**
📍 **Utils**: `src/util/admin.ts`

#### Raporty:
- 📈 Wykresy sprzedaży w czasie
- 👥 Statystyki użytkowników
- 💰 Raporty finansowe
- 🏫 Wydajność szkół
- 📚 Popularne książki

---

## 🎨 Frontend Structure

### 📱 Responsive Design
- 🖥️ **Desktop**: Pełne widoki z Bootstrap
- 📱 **Mobile**: Specjalne widoki mobilne (np. `editBookMobile.pug`)

### 🎨 Styling
- **TailwindCSS** - główny framework CSS
- **Bootstrap** - komponenty UI  
- **SCSS** - dodatkowe style

### 📄 Główne Widoki
```
views/
├── 🏠 home.pug & homeStaff.pug - strony główne
├── 👤 account/ - zarządzanie kontem
├── 📚 book/ - zarządzanie książkami  
├── 🛡️ admin/ - panel administracyjny
├── 🏫 school/ - zarządzanie szkołami
├── 📖 library/ - przeglądanie dostępnych książek
└── 🔒 privacy_policy/ & tos/ - regulaminy
```

---

## 🔧 Konfiguracja Techniczna

### 🗄️ Baza Danych (MongoDB)
- **Collections**: Users, Books, BookListings, Schools, Buyers, Performance
- **Relations**: Mongoose ODM z populowaniem
- **Indexing**: Optymalizacja wyszukiwania

### 🔐 Bezpieczeństwo  
- **Passport.js**: Strategia lokalna + sesje
- **Express-validator**: Walidacja danych
- **Role-based**: System uprawnień
- **CSRF Protection**: Zabezpieczenie formularzy

### 📦 Deployment
- **Docker**: Containerization
- **Docker Compose**: Orchestration
- **nginx**: Reverse proxy
- **SSL**: HTTPS certificates

---

## 🚀 Następne Kroki Development

### 🎯 Priorytetowe Ulepszenia
1. **📊 Enhanced Analytics** - więcej wykresów i raportów
2. **💌 Email Notifications** - powiadomienia o statusach
3. **📱 Mobile App** - natywna aplikacja mobilna
4. **🔍 Advanced Search** - filtrowanie, sortowanie
5. **💳 Payment Integration** - integracja z płatnościami online
6. **🏷️ Inventory Management** - lepsze zarządzanie logistyką
7. **📈 Performance Monitoring** - monitoring wydajności
8. **🔒 Enhanced Security** - 2FA, audit logs

### 🛠️ Technical Debt
1. **🧪 Test Coverage** - zwiększenie pokrycia testami
2. **📝 Documentation** - API documentation
3. **♻️ Code Refactoring** - modernizacja kodu
4. **⚡ Performance Optimization** - optymalizacja zapytań DB
5. **🔄 CI/CD Pipeline** - automatyzacja wdrożeń

---

## 📋 Status Obecny

### ✅ Co działa dobrze:
- Podstawowe funkcjonalności CRUD
- System ról i uprawnień
- Panel administracyjny
- Responsive design  
- Multi-tenancy (szkoły)
- Podstawowa analityka

### ⚠️ Co wymaga poprawy:
- Optymalizacja wydajności
- Lepsze error handling
- Więcej testów automatycznych  
- Enhanced UX/UI
- Mobile experience
- Monitoring i logging

---

## 💡 Wnioski

SignumLBRI to **zaawansowana platforma** do zarządzania sprzedażą podręczników szkolnych z:

- 🏗️ **Solidną architekturą** MVC 
- 🔐 **Bezpiecznym** systemem autoryzacji
- 📊 **Rozbudowaną** analityką
- 🏫 **Multi-tenant** support dla szkół
- 📱 **Responsive** design

**Gotowa do dalszego rozwoju i skalowania!** 🚀
