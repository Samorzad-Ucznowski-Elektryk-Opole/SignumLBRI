# � SignumLBRI - Modern School Book Management System

Nowoczesny system zarządzania książkami szkolnymi z glassmorphism UI i zaawansowanymi funkcjami.

## ✨ Funkcje

- 🎨 **Glassmorphism Design** - Nowoczesny przezroczysty interfejs
- 🌙 **Tryb ciemny/jasny** - Przełączanie motywów
- 📱 **Responsywny design** - Działa na wszystkich urządzeniach  
- 🌍 **Wielojęzyczność** - Polski/Angielski/Ukraiński
- 📚 **Zarządzanie książkami** - Zaawansowany system biblioteczny
- 👥 **Zarządzanie użytkownikami** - Uczniowie, nauczyciele, admin
- 📊 **Panel analityczny** - Raporty i statystyki
- 🔒 **Bezpieczeństwo** - Hashowanie haseł, sesje, ochrona CSRF

## � Szybki start

### Wymagania
- **Docker** (pobierz z [docker.com](https://www.docker.com/))
- **Docker Compose** (dołączony do Docker Desktop)

### Uruchomienie

```bash
# Klonowanie repozytorium
git clone https://github.com/Samorzad-Ucznowski-Elektryk-Opole/SignumLBRI.git
cd SignumLBRI

# Start za pomocą skryptu (Windows)
.\scripts\start.bat

# Lub bezpośrednio Docker Compose
docker-compose up -d

# Szybki restart
.\scripts\quick-restart.bat
```

**Aplikacja będzie dostępna pod adresem:** 🌐 **http://localhost:4000**

## 🌐 Punkty dostępu

Po uruchomieniu kontenerów aplikacja dostępna jest pod:

- **Główna aplikacja**: http://localhost:4000
- **Panel administracyjny**: http://localhost:4000/admin  
- **Health check**: http://localhost:4000/health
- **Statystyki systemu**: http://localhost:4000/stats
- **API**: http://localhost:4000/api/

## 🐳 Zarządzanie Docker

### Podstawowe komendy
```bash
# Uruchomienie serwisów
docker-compose up -d

# Zatrzymanie serwisów  
docker-compose down

# Wyświetlanie logów
docker-compose logs -f

# Restart serwisów
docker-compose restart

# Przebudowanie kontenerów
docker-compose up --build -d
```

### NPM skrypty
```bash
npm run docker:up       # Start z docker-compose
npm run docker:down     # Stop docker-compose  
npm run docker:logs     # Wyświetl logi
npm run docker:restart  # Restart kontenerów
```

## 📁 Struktura projektu (uporządkowana)

```
SignumLBRI/
├── 📋 Pliki konfiguracyjne
│   ├── Dockerfile              # Konfiguracja kontenera
│   ├── docker-compose.yml      # Orchestracja kontenerów
│   ├── package.json           # Zależności i skrypty
│   └── .env                   # Zmienne środowiskowe
├── 🗂️ scripts/               # Skrypty zarządzania
│   ├── start.bat              # Start aplikacji (Windows)
│   ├── quick-restart.bat      # Szybki restart
│   └── Makefile              # Zadania automatyzacji
├── 📚 docs/                   # Dokumentacja
│   ├── DOCKER-SETUP.md        # Szczegóły Docker
│   └── TROUBLESHOOTING.md     # Rozwiązywanie problemów
├── ⚙️ configs/               # Alternatywne konfiguracje
│   └── docker-compose-complete.yml
├── 🔧 temp/                   # Pliki tymczasowe/debug
│   ├── enhanced-app-debug.js  # Wersja debug
│   └── debug-wrapper.js       # Wrapper debug
├── 💻 src/                    # Kod źródłowy TypeScript
│   ├── app.ts                # Główna aplikacja
│   ├── controllers/          # Kontrolery tras
│   ├── models/              # Modele bazy danych
│   ├── util/                # Narzędzia pomocnicze
│   ├── config/              # Konfiguracje
│   └── lang/                # Pliki językowe
├── 🎨 views/                  # Szablony Pug
├── 🌍 public/                 # Zasoby statyczne
└── 🗄️ mongo-init/            # Inicjalizacja bazy danych
```

## 🔧 Konfiguracja

### Zmienne środowiskowe
```bash
# Aplikacja
PORT=4000
NODE_ENV=production
SESSION_SECRET=your_session_secret

# Baza danych
MONGODB_URI=mongodb://mongodb:27017/signumlbri

# Funkcje
ENABLE_REGISTRATION=true
ENABLE_GUEST_MODE=false
```

### Wolumeny Docker
- **Logi aplikacji**: `./logs:/app/logs`
- **Dane MongoDB**: `./mongodb-data:/data/db`  
- **Pliki uploadowane**: `./public/uploads:/app/public/uploads`

## 🐛 Diagnostyka i debug

### Health check
Aplikacja zawiera zaawansowane monitorowanie stanu:

```bash
# Szybki check stanu
curl http://localhost:4000/health

# Szczegółowe statystyki
curl http://localhost:4000/stats
```

### Analiza logów
```bash
# Wyświetl wszystkie logi
docker-compose logs -f

# Logi konkretnego serwisu
docker-compose logs -f signumlbri-enhanced

# Filtrowanie logów według czasu
docker-compose logs --since=1h signumlbri-enhanced
```

### Dostęp do bazy danych
```bash
# Dostęp do shell MongoDB
docker-compose exec mongodb mongosh signumlbri

# Wyświetl kolekcje
show collections

# Query użytkownicy
db.users.find().pretty()
```

## � Wdrożenie produkcyjne

### Docker Swarm
```bash
# Inicjalizacja swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml signumlbri

# Check serwisów
docker service ls
```

### Monitorowanie

Aplikacja zawiera wbudowane monitorowanie:
- **Śledzenie requestów**: Unikalne ID requestów i timing
- **Zasoby systemowe**: Pamięć, CPU, uptime
- **Stan bazy danych**: Status połączenia i wydajność
- **Śledzenie błędów**: Komprehensywne logowanie

## 🔐 Bezpieczeństwo

### Domyślne zabezpieczenia
- **Ochrona CSRF**: Wbudowana walidacja tokenów
- **Zarządzanie sesją**: Bezpieczne obsługiwanie sesji
- **Hashowanie haseł**: bcrypt dla bezpieczeństwa haseł
- **Rate limiting**: Ograniczenia API requestów
- **Nagłówki bezpieczeństwa**: Integracja Helmet.js

### Najlepsze praktyki
1. **Zmień domyślne hasła**
2. **Używaj zmiennych środowiskowych dla sekretów**
3. **Włącz HTTPS w produkcji**
4. **Regularne aktualizacje bezpieczeństwa**
5. **Monitoruj logi dostępu**

## 📞 Wsparcie

W przypadku problemów:

1. Sprawdź [przewodnik rozwiązywania problemów](docs/TROUBLESHOOTING.md)
2. Przejrzyj logi Docker pod kątem błędów
3. Zweryfikuj status health kontenerów
4. Otwórz issue na GitHub

## 🔄 Rozwój i wkład

### Lokalne środowisko deweloperskie
```bash
# Klonowanie repo
git clone https://github.com/Samorzad-Ucznowski-Elektryk-Opole/SignumLBRI.git

# Uruchomienie w trybie dev
npm install
npm run dev

# Lub za pomocą Docker
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Struktura kodu
- **TypeScript**: Główny kod w `src/`
- **Pug templates**: Szablony w `views/`
- **SCSS**: Style w `src/public/css/`
- **Tests**: Testy w `tests/`

---

🔧 **Maintainer**: ZSEL SignumLBRI Team  
📅 **Ostatnia aktualizacja**: Sierpień 2025  
📄 **Licencja**: MIT

## 🔧 Environment Configuration

Default environment variables in docker-compose.yml:

```yaml
environment:
  - NODE_ENV=production
  - PORT=4000
  - USE_MEMORY_DB=true
  - SESSION_SECRET=enhanced-secret-key-production-change-this
  - DEFAULT_LANGUAGE=pl
  - DEFAULT_THEME=light
  - ENABLE_ANALYTICS=true
  - ENABLE_NOTIFICATIONS=true
```

## 🚀 Development

For development with auto-reload:

```bash
# Build development image
docker build -t signumlbri-enhanced:dev .

# Run with volume mount for development
docker run -p 4000:4000 -v $(pwd):/app signumlbri-enhanced:dev npm run dev
```

## 📊 Health Monitoring

The application includes health checks:

```bash
# Check container health
docker ps

# View health check logs
docker inspect signumlbri-enhanced --format='{{.State.Health.Status}}'

# Manual health check
curl http://localhost:4000/health
```

## 🛡️ Security

- Non-root user execution
- Security headers (Helmet.js)
- Rate limiting
- CSRF protection  
- Secure session cookies
- Input validation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and test with Docker
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

**ZSEL SignumLBRI Team**
- Repository: https://github.com/Samorzad-Ucznowski-Elektryk-Opole/SignumLBRI

---

**🐳 Docker-first Enhanced with ❤️ by GitHub Copilot** 🤖
