# SignumLBRI - System Targów Książki z Przejrzystością Publiczną

## Opis Systemu

SignumLBRI to zaawansowany system zarządzania targami książkowymi dla szkół, który oferuje:

### 🎯 **Główne Funkcjonalności**
- **Transparentność publiczna** - otwarte dane o cenach, dostępności księgarń
- **E-commerce dla użytkowników publicznych** - rejestracja, dodawanie ogłoszeń, koszyk zakupowy
- **System rezerwacji z kodami QR** - fizyczny odbiór z automatyczną synchronizacją kont
- **Zarządzanie wieloszkolne** - jeden system dla wielu szkół równolegle
- **Pełna automatyzacja** procesów weryfikacji i sprzedaży

### 🔄 **Proces E-commerce**
1. **Rejestracja publiczna** - użytkownicy mogą się zarejestrować wybierając szkołę
2. **Weryfikacja przez admin** - admin zatwierdza konto użytkownika
3. **Dodawanie ogłoszeń** - użytkownicy dodają książki do sprzedaży z opisem i zdjęciami
4. **Weryfikacja ogłoszeń** - admin potwierdza dostarczenie książek do punktu zbiórki
5. **Publikacja** - książki stają się dostępne w publicznym katalogu z marżą 5 zł
6. **Koszyk zakupowy** - klienci mogą rezerwować książki
7. **Fizyczny odbiór** - sprzedawca skanuje kod QR i realizuje sprzedaż
8. **Automatyczne updaty** - system synchronizuje konta kupującego i sprzedającego

## 🛠 Instalacja i Konfiguracja

### Wymagania Systemowe
- Node.js 18+ 
- MongoDB 6+
- NPM lub Yarn

### Kroki Instalacji

1. **Zainstaluj Node.js**
   - Pobierz z https://nodejs.org/ (wersja LTS)
   - Zweryfikuj instalację: `node --version` i `npm --version`

2. **Zainstaluj MongoDB**
   - Pobierz MongoDB Community Server
   - Lub użyj MongoDB Atlas (cloud)

3. **Sklonuj repozytorium**
   ```bash
   git clone <repository-url>
   cd SignumLBRI
   ```

4. **Zainstaluj zależności**
   ```bash
   npm install
   ```

5. **Zainstaluj dodatkowe pakiety dla nowej funkcjonalności**
   ```bash
   npm install qrcode express-validator multer sharp
   npm install --save-dev @types/qrcode @types/multer @types/sharp
   ```

6. **Konfiguracja środowiska**
   Utwórz plik `.env` z następującymi zmiennymi:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/signumlbri
   
   # Session
   SESSION_SECRET=your-super-secret-session-key
   
   # Email (opcjonalnie)
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM=noreply@yourdomain.com
   
   # File Uploads
   UPLOAD_PATH=./public/uploads
   MAX_FILE_SIZE=10485760
   
   # App Configuration
   NODE_ENV=development
   PORT=3000
   ```

7. **Kompilacja TypeScript**
   ```bash
   npm run build
   ```

8. **Uruchomienie**
   ```bash
   # Tryb development (z hot-reload)
   npm run dev
   
   # Tryb production
   npm start
   ```

## 📊 Struktura Nowych Modeli Danych

### PublicUser Model
```typescript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  school: ObjectId (ref: School),
  status: 'pending' | 'active' | 'suspended' | 'banned',
  emailVerified: Boolean,
  
  // Statystyki
  totalBooksPublished: Number,
  totalBooksSold: Number,
  totalBooksReserved: Number,
  totalBooksPurchased: Number,
  totalMoneyEarned: Number,
  totalMoneySpent: Number,
  
  // Metadane
  registrationIP: String,
  lastLoginAt: Date,
  approvedBy: ObjectId (ref: User),
  approvedAt: Date
}
```

### BookAd Model
```typescript
{
  owner: ObjectId (ref: PublicUser),
  book: ObjectId (ref: Book),
  school: ObjectId (ref: School),
  
  originalPrice: Number,
  sellingPrice: Number, // originalPrice + 5 zł marża
  condition: 'nowa' | 'bardzo-dobry' | 'dobry' | 'zadowalający',
  description: String,
  images: [String], // ścieżki do plików
  
  status: 'draft' | 'pending_verification' | 'published' | 'reserved' | 'sold' | 'rejected',
  
  // Rezerwacja
  reservedBy: ObjectId (ref: PublicUser),
  reservedAt: Date,
  reservationExpires: Date,
  reservationCode: String,
  
  // Weryfikacja
  deliveredToSchool: Boolean,
  deliveryConfirmedBy: ObjectId (ref: User),
  deliveryConfirmedAt: Date,
  
  publishedAt: Date,
  soldAt: Date
}
```

### ShoppingCart Model
```typescript
{
  user: ObjectId (ref: PublicUser),
  school: ObjectId (ref: School),
  
  items: [{
    bookAd: ObjectId (ref: BookAd),
    addedAt: Date,
    reservationExpires: Date
  }],
  
  status: 'active' | 'reserved' | 'completed' | 'expired' | 'cancelled',
  totalAmount: Number,
  
  reservationCode: String,
  reservationExpires: Date,
  completedAt: Date,
  completedBy: ObjectId (ref: User)
}
```

## 🎨 Nowe Widoki i Kontrolery

### Struktura kontrolerów:
- `publicUser.ts` - rejestracja i zarządzanie kontami publicznymi
- `bookAd.ts` - zarządzanie ogłoszeniami książek
- `shoppingCart.ts` - koszyk zakupowy i rezerwacje
- `adminPublicManagement.ts` - panel admin do weryfikacji

### Struktury widoków:
```
views/
├── public/
│   ├── layout.pug                 # Layout dla części publicznej
│   ├── auth/                      # Formularze logowania/rejestracji
│   ├── dashboard.pug              # Dashboard użytkownika publicznego
│   ├── books/                     # Przeglądanie i zarządzanie ogłoszeniami
│   └── cart/                      # Koszyk i historia rezerwacji
└── admin/
    └── publicManagement/          # Panel administratora
        ├── dashboard.pug          # Dashboard zarządzania
        ├── users.pug              # Zarządzanie użytkownikami
        ├── bookAds.pug            # Zarządzanie ogłoszeniami
        └── salesTerminal.pug      # Terminal sprzedaży z QR
```

## 🔐 System Uprawnień

### Role użytkowników:
- **PublicUser** - użytkownicy publiczni (sprzedawcy/kupujący)
- **Admin/HeadAdmin** - administratorzy szkół (weryfikacja, sprzedaż)

### Zabezpieczenia:
- Hashowanie haseł (bcrypt)
- Weryfikacja email
- Rate limiting dla API
- Walidacja plików upload
- Separacja danych per szkoła

## 🚀 Uruchomienie w Środowisku Produkcyjnym

### Docker (Zalecane)
```bash
# Build
docker build -t signumlbri .

# Run with docker-compose
docker-compose up -d
```

### PM2 (Node.js Process Manager)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /uploads/ {
        root /path/to/app/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📊 Funkcjonalności Transparentności Publicznej

### Open Data API
- `GET /api/public/books` - lista wszystkich dostępnych książek
- `GET /api/public/schools` - statystyki szkół
- `GET /api/public/stats` - ogólne statystyki systemu

### Dashboard Transparentności
- Wykresy cen książek per szkoła
- Statystyki dostępności
- Porównanie cen między szkołami
- Historia cen

## 🔧 Konserwacja i Monitoring

### Automatyczne zadania (Cron Jobs)
```javascript
// Czyszczenie wygasłych rezerwacji (co godzinę)
0 * * * * - clearExpiredReservations()

// Wysyłanie powiadomień o zbliżających się wygaśnięciach (co 15 min)
*/15 * * * * - sendExpirationWarnings()

// Backup bazy danych (codziennie o 2:00)
0 2 * * * - backupDatabase()
```

### Logi i Monitoring
- Winston dla logowania
- Morgan dla logów HTTP
- Health check endpoint: `/api/health`

## 📞 Wsparcie i Rozwój

### Roadmapa:
- [ ] Integracja z systemami płatności online
- [ ] Aplikacja mobilna (React Native)
- [ ] API dla zewnętrznych księgarń
- [ ] System ocen i komentarzy
- [ ] Zaawansowana analityka sprzedaży

### Zgłaszanie błędów:
Utwórz issue w repozytorium z opisem problemu i krokami do reprodukcji.

## 📄 Licencja

MIT License - szczegóły w pliku LICENSE

---

**Opracowane dla**: Systemu zarządzania targami książkowymi z pełną przejrzystością publiczną i automatyzacją procesów e-commerce.
