# 🚀 SignumLBRI Enhanced

**Nowoczesny system zarządzania książkami szkolnymi z glassmorphism UI**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-supported-blue.svg)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Funkcjonalności

### 🎨 Nowoczesny UI
- **Glassmorphism Design** - Przezroczyste, eleganckie elementy
- **Dark/Light Mode** - Automatyczne przełączanie motywów
- **Animacje CSS** - Płynne przejścia i efekty
- **Mobile-First** - Pełna responsywność

### 🌍 Wielojęzyczność
- 🇵🇱 **Polski** - Kompletne tłumaczenie
- 🇺🇸 **English** - Full translation
- 🇺🇦 **Українська** - Повний переклад

### 📊 Zaawansowane Funkcje
- **Real-time Dashboard** - Statystyki i wykresy na żywo
- **Zarządzanie Książkami** - Dodawanie, edycja, wyszukiwanie
- **System Szkół** - Zarządzanie placówkami edukacyjnymi
- **Użytkownicy** - Role, uprawnienia, profile
- **Analytics** - Szczegółowe analizy i raporty
- **API** - RESTful endpoints
- **PWA Support** - Instalacja jak aplikacja mobilna

## 🚀 Szybki Start

### Opcja 1: Automatyczna Instalacja (Zalecana)
```bash
# 1. Zainstaluj Node.js z https://nodejs.org/
# 2. Uruchom skrypt setup:
setup-enhanced-new.bat
```

### Opcja 2: Docker (Containerized)
```bash
# Wymagana instalacja Docker Desktop
docker-quick-start.bat
```

### Opcja 3: Ręczna Instalacja
```bash
npm install
node enhanced-app.js
```

## 🌐 Dostęp

Po uruchomieniu aplikacja będzie dostępna pod adresem:
- **Enhanced UI**: http://localhost:4000/enhanced
- **Health Check**: http://localhost:4000/health

## 📁 Struktura Projektu

```
SignumLBRI/
├── enhanced-app.js                 # 🎯 Główna aplikacja Enhanced
├── views/enhanced/                 # 🎨 Szablony stron
├── public/css/enhanced/           # 💅 Style CSS
├── public/js/enhanced/            # ⚡ JavaScript Enhanced
├── Dockerfile.enhanced            # 🐳 Docker build
├── docker-compose-minimal.yml     # 🐳 Docker compose
├── setup-enhanced-new.bat         # 🔧 Automatyczna instalacja
├── docker-quick-start.bat         # 🐳 Docker start
├── enhanced-preview.html          # 👀 Podgląd bez serwera
├── INSTRUKCJA-ENHANCED.md         # 📖 Pełna dokumentacja
└── QUICK-START.md                 # ⚡ Szybki start
```

## 🔧 Konfiguracja

### Zmienne Środowiskowe
```env
# Aplikacja
NODE_ENV=production
PORT=4000
USE_MEMORY_DB=true

# UI
DEFAULT_THEME=light
DEFAULT_LANGUAGE=pl
ENABLE_THEME_SWITCHING=true

# Funkcjonalności
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
```

## 🐳 Docker

### Szybkie Uruchomienie
```bash
# Build i start jedną komendą
docker-quick-start.bat
```

### Ręczne Docker
```bash
# Build
docker build -f Dockerfile.enhanced -t signumlbri-enhanced .

# Run
docker run -p 4000:4000 signumlbri-enhanced
```

## 📖 Dokumentacja

- **[INSTRUKCJA-ENHANCED.md](INSTRUKCJA-ENHANCED.md)** - Pełna dokumentacja
- **[QUICK-START.md](QUICK-START.md)** - Szybki przewodnik
- **[enhanced-preview.html](enhanced-preview.html)** - Podgląd UI

## 🛠️ Rozwój

### Uruchamianie w Trybie Development
```bash
npm install
npm run dev  # z nodemon
```

### Build CSS
```bash
npm run build:css
```

### Testy
```bash
npm test
```

## 🔒 Bezpieczeństwo

- **JWT Authentication** - Bezpieczne tokeny
- **Session Management** - Zarządzanie sesjami
- **Input Validation** - Walidacja danych
- **Rate Limiting** - Ograniczenia żądań
- **CORS Protection** - Ochrona CORS
- **Helmet.js** - Security headers

## 🤝 Wkład w Projekt

1. Fork repository
2. Utwórz branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

## 📄 Licencja

Ten projekt jest licencjonowany na warunkach MIT License - zobacz plik [LICENSE](LICENSE) dla szczegółów.

## 👥 Autorzy

- **ZSEL SignumLBRI Team** - Samorząd Uczniowski Elektryk Opole

## 🙏 Podziękowania

- Node.js Community
- Express.js Team
- MongoDB Team
- Docker Team

---

<div align="center">
  
**🎯 SignumLBRI Enhanced - Nowoczesność w Zarządzaniu Książkami 🎯**

Made with ❤️ by ZSEL Team

</div>
