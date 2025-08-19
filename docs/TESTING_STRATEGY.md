# Strategia testowania systemu SignumLBRI

## Przegląd testowania

Dokument opisuje strategię testowania dla systemu zarządzania targami książkowymi w platformie SignumLBRI, ze szczególnym uwzględnieniem nowo dodanych funkcjonalności.

## Struktura testów

### 1. Testy jednostkowe (Unit Tests)

#### A. Testy modeli Mongoose
```bash
# Uruchomienie testów modeli
npm test tests/models/
```

**Testowane funkcjonalności:**
- `BookFair.test.js` - Walidacja modelu targów książkowych
- `Exhibitor.test.js` - Walidacja modelu wystawców
- `Event.test.js` - Walidacja modelu wydarzeń
- `BookFairExhibitor.test.js` - Testy relacji między targami a wystawcami

#### B. Testy funkcji utility
```bash
# Uruchomienie testów pomocniczych
npm test tests/utils/
```

**Testowane funkcjonalności:**
- `adminHelpers.test.js` - Testy wykrywania przedmiotów i sanityzacji danych
- `csvImport.test.js` - Testy parsowania i importu CSV
- `validation.test.js` - Testy walidacji danych

### 2. Testy integracyjne (Integration Tests)

#### A. Testy kontrolerów administratora
```bash
# Uruchomienie testów kontrolerów
npm test tests/integration/admin/
```

**Testowane endpointy:**
- `POST /admin/bookfairs/create` - Tworzenie targów
- `GET /admin/bookfairs` - Lista targów z paginacją
- `PUT /admin/bookfairs/:id` - Aktualizacja targów
- `DELETE /admin/bookfairs/:id` - Usuwanie targów
- `POST /admin/exhibitors/:id/approve` - Zatwierdzanie wystawców
- `POST /admin/import/csv` - Import danych CSV

#### B. Testy publicznych endpointów
```bash
# Uruchomienie testów publicznych
npm test tests/integration/public/
```

**Testowane endpointy:**
- `GET /public/bookfairs` - Publiczna lista targów
- `POST /public/bookfair/register-exhibitor` - Rejestracja wystawcy
- `GET /public/bookfairs/:id/events` - Wydarzenia targów

### 3. Testy end-to-end (E2E Tests)

#### A. Scenariusze użytkownika
```bash
# Uruchomienie testów E2E
npm run test:e2e
```

**Testowane scenariusze:**
1. **Pełny cykl targów książkowych:**
   - Administrator tworzy nowe targi
   - Wystawca rejestruje się na targi
   - Administrator zatwierdza wystawcę
   - Tworzenie wydarzeń na targach
   - Publiczne przeglądanie targów

2. **Import danych CSV:**
   - Upload pliku CSV
   - Walidacja i parsowanie danych
   - Import książek do bazy danych
   - Weryfikacja poprawności importu

### 4. Testy wydajnościowe (Performance Tests)

#### A. Testy obciążeniowe
```bash
# Uruchomienie testów wydajności
npm run test:performance
```

**Testowane scenariusze:**
- Import dużych plików CSV (1000+ pozycji)
- Równoczesne zapytania do API
- Paginacja dużych zbiorów danych

## Konfiguracja środowiska testowego

### 1. Baza danych testowa
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/public/**'
  ]
};
```

### 2. Setup plików testowych
```javascript
// tests/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Czyszczenie bazy po każdym teście
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

## Przykłady testów

### 1. Test modelu BookFair
```javascript
// tests/models/BookFair.test.js
describe('BookFair Model', () => {
  it('should create a valid book fair', async () => {
    const bookFairData = {
      title: 'Targi Książki Szkolnej 2025',
      description: 'Największe targi książkowe w regionie',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-03'),
      location: {
        address: 'ul. Szkolna 1',
        city: 'Lębork',
        postalCode: '84-300'
      },
      maxExhibitors: 50,
      boothPrice: 500,
      status: 'planned'
    };

    const bookFair = new BookFair(bookFairData);
    const savedBookFair = await bookFair.save();
    
    expect(savedBookFair._id).toBeDefined();
    expect(savedBookFair.title).toBe(bookFairData.title);
    expect(savedBookFair.status).toBe('planned');
  });

  it('should validate required fields', async () => {
    const bookFair = new BookFair({});
    
    await expect(bookFair.save()).rejects.toThrow();
  });
});
```

### 2. Test funkcji wykrywania przedmiotu
```javascript
// tests/utils/adminHelpers.test.js
describe('Subject Detection', () => {
  it('should correctly detect mathematics subject', () => {
    const result = detectBookSubject('Algebra liniowa i geometria analityczna', 'Kiełbasa');
    
    expect(result.subject).toBe('Matematyka');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should detect polish language from title', () => {
    const result = detectBookSubject('Literatura polska XIX wieku');
    
    expect(result.subject).toBe('Język polski');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('should return default subject for unknown content', () => {
    const result = detectBookSubject('Unknown Book Title');
    
    expect(result.subject).toBe('Inne');
    expect(result.confidence).toBeLessThan(0.3);
  });
});
```

### 3. Test integracyjny API
```javascript
// tests/integration/admin/bookfairs.test.js
describe('BookFair API', () => {
  let authToken;

  beforeEach(async () => {
    // Logowanie użytkownika administratora
    const adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    
    authToken = generateJWT(adminUser._id);
  });

  it('should create new book fair', async () => {
    const bookFairData = {
      title: 'Test Book Fair',
      description: 'Test Description',
      startDate: '2025-09-01',
      endDate: '2025-09-03',
      location: {
        address: 'Test Address',
        city: 'Test City',
        postalCode: '12-345'
      },
      maxExhibitors: 30,
      boothPrice: 300
    };

    const response = await request(app)
      .post('/admin/bookfairs/create')
      .set('Authorization', `Bearer ${authToken}`)
      .send(bookFairData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(bookFairData.title);
  });

  it('should return paginated list of book fairs', async () => {
    // Tworzenie testowych danych
    await BookFair.create([
      { title: 'Fair 1', /* ... inne dane */ },
      { title: 'Fair 2', /* ... inne dane */ },
      { title: 'Fair 3', /* ... inne dane */ }
    ]);

    const response = await request(app)
      .get('/admin/bookfairs?page=1&limit=2')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(2);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.total).toBe(3);
  });
});
```

## Metryki pokrycia kodu

### Cel: 80%+ pokrycia kodu

```bash
# Generowanie raportu pokrycia
npm run test:coverage
```

**Oczekiwane pokrycie:**
- Modele: 90%+
- Kontrolery: 85%+
- Funkcje utility: 95%+
- Middleware: 80%+

## Automatyzacja testów

### 1. Pre-commit hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit",
      "pre-push": "npm run test:integration"
    }
  }
}
```

### 2. CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:all
      - run: npm run test:coverage
```

## Monitorowanie i raportowanie

### 1. Raporty testowe
- Generowane automatycznie po każdym uruchomieniu
- Dostępne w formacie HTML i JSON
- Przechowywane w folderze `test-reports/`

### 2. Metryki jakości
- Pokrycie kodu
- Czas wykonania testów
- Liczba przechodzących/nieprzechodzących testów
- Analiza regresji

## Najlepsze praktyki

1. **Izolacja testów** - Każdy test powinien być niezależny
2. **Czyszczenie danych** - Zawsze czyść bazę danych między testami
3. **Mocking** - Używaj mock'ów dla zewnętrznych zależności
4. **Opisowe nazwy** - Nazwy testów powinny opisywać co testują
5. **Arrange-Act-Assert** - Używaj wzorca AAA w testach
6. **Testy negatywne** - Testuj również scenariusze błędów

## Uruchomienie testów lokalnie

```bash
# Wszystkie testy
npm test

# Tylko testy jednostkowe
npm run test:unit

# Tylko testy integracyjne
npm run test:integration

# Testy z pokryciem kodu
npm run test:coverage

# Testy w trybie watch
npm run test:watch

# Testy end-to-end
npm run test:e2e
```

## Rozwiązywanie problemów testowych

### Problemy z bazą danych
- Sprawdź czy MongoDB Memory Server jest poprawnie skonfigurowany
- Upewnij się że czyszczenie bazy działa po każdym teście

### Problemy z czasem wykonania
- Optymalizuj zapytania do bazy danych
- Używaj indeksów w modelach testowych
- Rozważ równoległe wykonywanie testów

### Problemy z asynchronicznymi operacjami
- Używaj async/await zamiast callbacków
- Sprawdź czy wszystkie Promise'y są awaited
- Używaj odpowiednich timeoutów
