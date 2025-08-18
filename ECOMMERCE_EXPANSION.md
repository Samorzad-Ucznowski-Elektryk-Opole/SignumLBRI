# System E-Commerce dla Targów Książkowych - Rozszerzenie Transparentności

## Nowe Funkcjonalności - Pełny Cykl Sprzedaży

### WORKFLOW UŻYTKOWNIKA

```
1. REJESTRACJA PUBLICZNA → 2. DODAWANIE OGŁOSZEŃ → 3. WERYFIKACJA ADMIN → 
4. PUBLIKACJA → 5. REZERWACJA + KOSZYK → 6. PŁATNOŚĆ FIZYCZNA → 7. FINALIZACJA
```

## Nowe Modele Danych

### Model: PublicUser (Publiczni Użytkownicy)
```typescript
// src/models/PublicUser.ts
export type PublicUserDocument = mongoose.Document & {
  email: string;
  password: string;
  profile: {
    name: string;
    surname: string;
    phone: string;
  };
  school: SchoolDocument;
  status: 'pending' | 'active' | 'suspended';
  createdAt: Date;
  verifiedAt?: Date;
  verifiedBy?: UserDocument;
};
```

### Model: BookAd (Ogłoszenia Książkowe)
```typescript
// src/models/BookAd.ts  
export type BookAdDocument = mongoose.Document & {
  owner: PublicUserDocument;
  book: BookDocument;
  originalPrice: number;
  sellPrice: number; // originalPrice + 5zł marży
  condition: 'excellent' | 'good' | 'acceptable' | 'poor';
  description: string;
  images: string[];
  school: SchoolDocument;
  status: 'draft' | 'pending_verification' | 'verified' | 'published' | 'reserved' | 'sold' | 'returned';
  
  // Weryfikacja przez admina
  verifiedBy?: UserDocument;
  verifiedAt?: Date;
  verificationNotes?: string;
  
  // Fizyczna dostawa
  deliveredToPoint: boolean;
  deliveredAt?: Date;
  
  // Rezerwacja
  reservedBy?: PublicUserDocument;
  reservedAt?: Date;
  reservationExpires?: Date;
  
  // Sprzedaż
  soldBy?: UserDocument; // Sprzedawca fizyczny
  soldAt?: Date;
};
```

### Model: ShoppingCart (Koszyk)
```typescript
// src/models/ShoppingCart.ts
export type ShoppingCartDocument = mongoose.Document & {
  user: PublicUserDocument;
  school: SchoolDocument;
  items: [{
    bookAd: BookAdDocument;
    addedAt: Date;
    reservationExpires: Date;
  }];
  totalAmount: number;
  status: 'active' | 'reserved' | 'completed' | 'expired';
  createdAt: Date;
  completedAt?: Date;
};
```

## Nowe Controllery

### PublicUserController
```typescript
// src/controllers/publicUser.ts
export const getPublicRegister = (req: Request, res: Response) => {
  // Formularz rejestracji dla publicznych użytkowników
};

export const postPublicRegister = async (req: Request, res: Response) => {
  // Rejestracja nowego użytkownika publicznego
  // Email weryfikacja
  // Oczekiwanie na aktywację przez admina
};

export const getPublicLogin = (req: Request, res: Response) => {
  // Login dla użytkowników publicznych
};

export const getPublicDashboard = async (req: Request, res: Response) => {
  // Dashboard dla zalogowanych użytkowników publicznych
  // Moje ogłoszenia, historia, statystyki
};
```

### BookAdController  
```typescript
// src/controllers/bookAd.ts
export const getCreateAd = (req: Request, res: Response) => {
  // Formularz dodawania ogłoszenia
};

export const postCreateAd = async (req: Request, res: Response) => {
  // Zapisanie ogłoszenia w statusie 'draft'
  // Upload zdjęć
  // Automatyczne dodanie 5zł marży
};

export const getMyAds = async (req: Request, res: Response) => {
  // Lista ogłoszeń użytkownika
};

export const getPublicAdsForSchool = async (req: Request, res: Response) => {
  // Publiczna lista dostępnych książek dla konkretnej szkoły
  // Filtry: przedmiot, klasa, cena, stan
};
```

### ShoppingCartController
```typescript
// src/controllers/shoppingCart.ts
export const addToCart = async (req: Request, res: Response) => {
  // Dodaj książkę do koszyka
  // Automatyczna rezerwacja na 24h
  // Sprawdzenie dostępności
};

export const getCart = async (req: Request, res: Response) => {
  // Wyświetl koszyk z pozycjami
  // Suma, czasy wygaśnięcia rezerwacji
};

export const removeFromCart = async (req: Request, res: Response) => {
  // Usuń z koszyka, zwolnij rezerwację
};

export const reserveCart = async (req: Request, res: Response) => {
  // Finalna rezerwacja koszyka
  // Generowanie kodu QR/PIN do sprzedawcy
};
```

### AdminVerificationController
```typescript
// src/controllers/adminVerification.ts
export const getPendingAds = async (req: Request, res: Response) => {
  // Lista ogłoszeń czekających na weryfikację
};

export const verifyAd = async (req: Request, res: Response) => {
  // Zatwierdzenie ogłoszenia przez admina
  // Zmiana statusu na 'verified'
};

export const markAsDelivered = async (req: Request, res: Response) => {
  // Oznaczenie że książka została dostarczona do punktu
  // Zmiana statusu na 'published'
};

export const getPendingUsers = async (req: Request, res: Response) => {
  // Lista użytkowników czekających na aktywację
};

export const activateUser = async (req: Request, res: Response) => {
  // Aktywacja użytkownika publicznego
};
```

### PhysicalSalesController
```typescript
// src/controllers/physicalSales.ts
export const getSalesPanel = async (req: Request, res: Response) => {
  // Panel sprzedawcy - lista rezerwacji do realizacji
};

export const getReservationDetails = async (req: Request, res: Response) => {
  // Szczegóły rezerwacji (kod, książki, kwota)
};

export const completeSale = async (req: Request, res: Response) => {
  // Finalizacja sprzedaży fizycznej
  // Pobranie pieniędzy, aktualizacja statusów
  // Rozliczenia finansowe
};
```

## Nowe Widoki (Views)

### Rejestracja i Login Publiczny
```pug
// views/public/register.pug
// views/public/login.pug  
// views/public/user-dashboard.pug
```

### Zarządzanie Ogłoszeniami
```pug
// views/public/ads/create.pug - formularz dodawania ogłoszenia
// views/public/ads/my-ads.pug - moje ogłoszenia
// views/public/ads/browse.pug - przeglądanie dostępnych książek
```

### Koszyk i Rezerwacje
```pug
// views/public/cart/view.pug - widok koszyka
// views/public/cart/reservation.pug - potwierdzenie rezerwacji
```

### Panel Administratora - Weryfikacje
```pug
// views/admin/page/pending-ads.pug - ogłoszenia do weryfikacji
// views/admin/page/pending-users.pug - użytkownicy do aktywacji
// views/admin/page/deliveries.pug - kontrola dostaw
```

### Panel Sprzedawcy Fizycznego
```pug
// views/seller/sales-panel.pug - aktywne rezerwacje
// views/seller/complete-sale.pug - finalizacja sprzedaży
```

## Nowe API Endpoints

### Publiczne API (bez autoryzacji)
```typescript
// Przeglądanie ofert
GET  /api/public/schools/:schoolId/books
GET  /api/public/books/search?query=&subject=&class=

// Rejestracja użytkowników
POST /api/public/register
POST /api/public/verify-email
```

### API dla Zalogowanych Użytkowników Publicznych
```typescript
// Zarządzanie ogłoszeniami
GET    /api/user/ads
POST   /api/user/ads
PUT    /api/user/ads/:id
DELETE /api/user/ads/:id

// Koszyk
GET    /api/user/cart  
POST   /api/user/cart/add
DELETE /api/user/cart/remove/:itemId
POST   /api/user/cart/reserve

// Historia i statystyki
GET    /api/user/history
GET    /api/user/stats
```

### API dla Administratorów - Weryfikacja
```typescript
// Weryfikacja ogłoszeń
GET  /api/admin/pending-ads
POST /api/admin/ads/:id/verify
POST /api/admin/ads/:id/reject
POST /api/admin/ads/:id/mark-delivered

// Zarządzanie użytkownikami
GET  /api/admin/pending-users
POST /api/admin/users/:id/activate
POST /api/admin/users/:id/suspend
```

### API dla Sprzedawców Fizycznych
```typescript
// Panel sprzedażowy
GET  /api/sales/reservations
GET  /api/sales/reservation/:id
POST /api/sales/complete/:reservationId

// Weryfikacja rezerwacji
GET  /api/sales/verify-code/:code
```

## Workflow Procesów

### 1. Rejestracja Publicznego Użytkownika
```mermaid
graph TD
    A[Wypełnienie formularza] → B[Email weryfikacja]
    B → C[Oczekiwanie na aktywację przez admina]
    C → D[Admin weryfikuje tożsamość]
    D → E[Konto aktywowane - może dodawać ogłoszenia]
```

### 2. Cykl Życia Ogłoszenia
```mermaid
graph TD
    A[Draft - tworzenie ogłoszenia] → B[Pending Verification]
    B → C{Admin weryfikuje}
    C →|Tak| D[Verified - czeka na dostawę]
    C →|Nie| E[Rejected - powrót do draft]
    D → F[Dostawa do punktu]
    F → G[Published - widoczne publicznie]
    G → H[Reserved - w koszyku użytkownika]
    H → I{Sprzedaż fizyczna}
    I →|Sprzedano| J[Sold]
    I →|Nie sprzedano| K[Returned to owner]
```

### 3. Proces Rezerwacji i Sprzedaży
```mermaid
graph TD
    A[Przeglądanie ofert] → B[Dodanie do koszyka]
    B → C[Automatyczna rezerwacja 24h]
    C → D[Potwierdzenie rezerwacji]
    D → E[Generowanie kodu odbioru]
    E → F[Wizyta w punkcie fizycznym]
    F → G[Sprzedawca weryfikuje kod]
    G → H[Płatność i odbiór książek]
    H → I[Finalizacja - update statusów]
```

## Automatyzacje i Reguły Biznesowe

### Automatyczne Procesy
```typescript
// src/services/automation.ts
export class AutomationService {
  
  // Automatyczne wygaszanie rezerwacji
  async expireReservations() {
    const expired = await ShoppingCart.find({
      'items.reservationExpires': { $lt: new Date() },
      status: 'reserved'
    });
    
    for (const cart of expired) {
      // Zwolnij rezerwacje, wyślij email
    }
  }
  
  // Automatyczne marże
  async calculateMargin(originalPrice: number): Promise<number> {
    return originalPrice + 5.00; // 5zł marży
  }
  
  // Automatyczne powiadomienia
  async sendNotifications() {
    // Email o nowych ogłoszeniach dla adminów
    // SMS o wygasających rezerwacjach
    // Push notifications dla aplikacji mobilnej
  }
  
  // Automatyczne rozliczenia
  async processFinancialSettlements() {
    // Rozliczenia między użytkownikami a szkołami
    // Prowizje platformy
  }
}
```

### Reguły Biznesowe
```typescript
// src/config/business-rules.ts
export const BusinessRules = {
  
  // Marże i ceny
  MARGIN_AMOUNT: 5.00, // 5zł marży na książkę
  MIN_BOOK_PRICE: 1.00,
  MAX_BOOK_PRICE: 500.00,
  
  // Czasy rezerwacji
  CART_RESERVATION_HOURS: 24,
  FINAL_RESERVATION_DAYS: 7,
  
  // Limity użytkowników
  MAX_ADS_PER_USER: 50,
  MAX_CART_ITEMS: 20,
  
  // Weryfikacja
  REQUIRE_ADMIN_VERIFICATION: true,
  REQUIRE_PHYSICAL_DELIVERY: true,
  
  // Rozliczenia
  PLATFORM_COMMISSION_PERCENT: 10, // 10% prowizji platformy
  SCHOOL_COMMISSION_PERCENT: 15,   // 15% prowizji szkoły
};
```

## Multi-School Management

### Separacja Danych per Szkoła
```typescript
// src/middleware/schoolContext.ts
export const schoolContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Automatyczne filtrowanie danych per szkoła
  // Zapewnienie że użytkownicy widzą tylko swoją szkołę
  
  if (req.user && req.user.school) {
    res.locals.currentSchool = req.user.school;
    res.locals.schoolFilter = { school: req.user.school._id };
  }
  
  next();
};
```

### Dashboard Multi-School dla SuperAdmin
```typescript
// src/controllers/superAdmin.ts
export const getMultiSchoolDashboard = async (req: Request, res: Response) => {
  const schoolStats = await School.aggregate([
    {
      $lookup: {
        from: 'bookads',
        localField: '_id',
        foreignField: 'school', 
        as: 'ads'
      }
    },
    {
      $project: {
        name: 1,
        totalAds: { $size: '$ads' },
        activeAds: {
          $size: {
            $filter: {
              input: '$ads',
              cond: { $eq: ['$$this.status', 'published'] }
            }
          }
        }
      }
    }
  ]);
  
  res.render('admin/multi-school-dashboard', { schoolStats });
};
```

## Implementacja Bezpieczeństwa

### Rate Limiting
```typescript
// src/middleware/rateLimiting.ts
import rateLimit from 'express-rate-limit';

export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // max 100 requests per window per IP
  message: 'Too many requests from this IP'
});

export const adCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 godzina
  max: 10, // max 10 ogłoszeń na godzinę
  message: 'Too many ads created'
});
```

### Walidacja i Sanityzacja
```typescript
// src/validators/bookAd.ts
export const validateBookAd = [
  check('title').isLength({ min: 3, max: 200 }).escape(),
  check('originalPrice').isFloat({ min: 1, max: 500 }),
  check('condition').isIn(['excellent', 'good', 'acceptable', 'poor']),
  check('description').isLength({ max: 1000 }).escape(),
];
```

## Plan Wdrożenia - Fazy

### FAZA 1: Podstawy E-Commerce (2-3 tygodnie)
- [ ] Modele danych (PublicUser, BookAd, ShoppingCart)
- [ ] Rejestracja i login użytkowników publicznych
- [ ] Podstawowy dashboard użytkownika
- [ ] CRUD ogłoszeń książkowych

### FAZA 2: System Weryfikacji (1-2 tygodnie)  
- [ ] Panel weryfikacji dla adminów
- [ ] Workflow zatwierdzania ogłoszeń
- [ ] System dostawy do punktów fizycznych
- [ ] Powiadomienia email/SMS

### FAZA 3: Koszyk i Rezerwacje (2-3 tygodnie)
- [ ] Funkcjonalność koszyka
- [ ] System rezerwacji z timeoutem
- [ ] Generowanie kodów odbioru
- [ ] API dla sprzedawców fizycznych

### FAZA 4: Finalizacja i Rozliczenia (2 tygodnie)
- [ ] Panel sprzedawcy fizycznego
- [ ] Finalizacja sprzedaży
- [ ] Automatyczne rozliczenia finansowe
- [ ] Historia transakcji

### FAZA 5: Automatyzacja i Skalowanie (1-2 tygodnie)
- [ ] Automatyczne procesy (cron jobs)
- [ ] Multi-school dashboard
- [ ] Monitoring i alerting
- [ ] Performance optimization

### FAZA 6: Mobile-First i UX (2 tygodnie)
- [ ] Responsive design
- [ ] PWA capabilities  
- [ ] Push notifications
- [ ] Offline functionality

## Korzyści Nowego Systemu

### Dla Użytkowników (Rodziców/Uczniów)
- ✅ Łatwe dodawanie ogłoszeń z domu
- ✅ Przeglądanie dostępnych książek online
- ✅ Rezerwacja przed wizytą w szkole
- ✅ Automatyczne zarządzanie cenami (marża 5zł)
- ✅ Historia transakcji

### Dla Administratorów Szkół
- ✅ Kontrola jakości - weryfikacja przed publikacją
- ✅ Śledzenie dostaw do punktu zbiórki
- ✅ Automatyczne rozliczenia finansowe
- ✅ Transparentność procesów
- ✅ Mniej pracy manualnej

### Dla Sprzedawców w Punktach
- ✅ Przygotowane rezerwacje do realizacji
- ✅ Kody weryfikacyjne rezerwacji
- ✅ Jasne instrukcje sprzedaży
- ✅ Automatyczne aktualizacje systemu

### Dla Systemu (Transparentność)
- ✅ Każda transakcja zapisana w blockchain-like audit log
- ✅ Publiczne statystyki dostępne w real-time
- ✅ Open data API z anonimizowanymi danymi
- ✅ Compliance z RODO i przepisami

## Metryki Sukcesu

### Operacyjne
- [ ] >95% ogłoszeń zweryfikowanych w <48h
- [ ] >90% rezerwacji sfinalizowanych
- [ ] <5% konfliktów/reklamacji
- [ ] >85% satysfakcji użytkowników

### Finansowe  
- [ ] >20% wzrost obrotów vs tradycyjne targi
- [ ] <2% błędów w rozliczeniach
- [ ] >15% oszczędności czasu administratorów

### Techniczne
- [ ] <200ms średni czas odpowiedzi API
- [ ] 99.9% uptime systemu
- [ ] 100% transakcji w audit logu
- [ ] <24h backup recovery time

---

**System ten pozwoli na pełną automatyzację targów książkowych z zachowaniem kontroli i transparentności, skalując się na wiele szkół równolegle.**
