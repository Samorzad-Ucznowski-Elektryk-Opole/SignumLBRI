# 📚 SignumLBRI - Library Book Resale Initiative

> **Zaawansowana platforma do sprzedaży podręczników szkolnych** 🏫

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Czym jest SignumLBRI?

**SignumLBRI** (Signum Library Book Resale Initiative) to kompleksowa platforma internetowa stworzona dla **szkół podstawowych i ponadpodstawowych** w celu ułatwienia **sprzedaży i zakupu podręczników** między uczniami.

### ✨ Główne Funkcje
- 📚 **Zarządzanie książkami** - dodawanie, edycja, wyszukiwanie po ISBN
- 👥 **System użytkowników** - studenci, sprzedawcy, administratorzy
- 🏫 **Multi-school support** - obsługa wielu szkół w jednym systemie  
- 💰 **System prowizji** - automatyczne kalkulacje dla szkół i platformy
- 📊 **Panel administracyjny** - pełne statystyki i zarządzanie
- 🌍 **Wielojęzyczność** - polski, ukraiński, angielski
- 📱 **Responsive design** - działa na desktop i mobile

---

## 🚀 Quick Start

### ⚡ Najszybszy sposób na uruchomienie

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/Samorzad-Ucznowski-Elektryk-Opole/SignumLBRI.git
cd SignumLBRI

# 2. Uruchom autostart (Windows)  
autostart.bat

# 3. Otwórz przeglądarkę
# http://localhost:3000
```

### 🔧 Dostępne skrypty development

| Skrypt | Przeznaczenie | Platform |
|--------|--------------|----------|
| `autostart.bat` | 🎯 **Auto-wybór Docker/Node.js** | Windows |
| `diagnoza.bat` | 🔍 **Diagnostyka problemów** | Windows |
| `quick-debug.bat` | 📋 **Menu rozwoju** | Windows |

---

## 🏗️ Tech Stack

### Backend
- **Node.js** + **TypeScript** + **Express.js**
- **MongoDB** + **Mongoose ODM**
- **Passport.js** (authentication)
- **Express-validator** (walidacja)

### Frontend  
- **Pug templates** (server-side rendering)
- **TailwindCSS** + **Bootstrap** (styling)
- **Webpack** (bundling)

### DevOps
- **Docker** + **Docker Compose**
- **nginx** (reverse proxy)
- **Git** (version control)

---

## 📊 Funkcjonalności Systemu

### 👥 Zarządzanie Użytkownikami
- ✅ **Rejestracja/Logowanie** z weryfikacją email
- ✅ **Role systemowe**: Student → Seller → Admin → HeadAdmin
- ✅ **Profile użytkowników** z danymi kontaktowymi
- ✅ **Reset hasła** przez email

### 📚 Zarządzanie Książkami
- ✅ **Dodawanie książek** z auto-uzupełnianiem przez ISBN
- ✅ **System ofert** (BookListing) z różnymi statusami
- ✅ **Generowanie kodów kreskowych** i etykiet
- ✅ **Proces sprzedaży**: Created → Accepted → Sold
- ✅ **Wyszukiwanie i filtrowanie** książek

### 🏫 Multi-School Support
- ✅ **Separacja danych** między szkołami
- ✅ **Konfigurowalny system prowizji** dla każdej szkoły
- ✅ **Loga/ikony szkół** z optymalizacją obrazów
- ✅ **Niezależne zarządzanie** dla każdej placówki

### 🛡️ Panel Administracyjny
- ✅ **Dashboard ze statystykami** w czasie rzeczywistym
- ✅ **Zarządzanie użytkownikami** - role, uprawnienia, pieniądze
- ✅ **Analityka sprzedaży** - wykresy, raporty, trendy
- ✅ **Zarządzanie książkami** - akceptacja, usuwanie, modyfikacja
- ✅ **Raporty finansowe** - przychody, prowizje, rozliczenia

---

## 📂 Struktura Projektu

```
SignumLBRI/
├── 📁 src/                  # Backend (TypeScript)
│   ├── 🎮 controllers/      # MVC Controllers
│   ├── 📊 models/           # MongoDB Models  
│   ├── 🛠️ util/            # Utility functions
│   ├── 🌍 lang/            # Wielojęzyczność
│   └── ⚙️ config/          # Konfiguracja
├── 📁 views/               # Frontend Templates (Pug)
├── 📁 public/              # Static Assets (CSS/JS/Images)
├── 📁 docker/              # Docker Configuration
├── 📁 docs/                # Dokumentacja
└── 📁 scripts/             # Development Scripts
```

---

## 💼 Business Model

### 💰 System Prowizji
1. **Student** ustala cenę bazową książki
2. **Szkoła** dodaje swoją marżę (konfigurowalną, np. 30%)
3. **Platforma** dodaje 20% prowizji
4. **Końcowa cena** = Cena bazowa + Marża szkoły + 20%

### 📈 Proces Sprzedaży
```
Student dodaje książkę → Seller akceptuje → Generowanie etykiety → 
Oddanie do punktu → Sprzedaż → Rozliczenie z kupującym
```

---

## 🌍 Wielojęzyczność

| Język | Status | Kod | Kompletność |
|-------|--------|-----|-------------|
| 🇵🇱 Polski | ✅ Główny | `pl` | 100% |
| 🇺🇦 Ukraiński | ✅ Gotowy | `uk` | 95% |
| 🇬🇧 Angielski | ✅ Gotowy | `en` | 90% |
| 😄 Bad Polish | 🎭 Fun | `bad_polish` | 100% |

---

## 🧪 Development

### 📋 Wymagania
- **Node.js** 18+
- **MongoDB** 6.0+
- **Docker** (opcjonalnie)
- **Git**

### 🚀 Instalacja dla developerów
```bash
# Clone repo
git clone [URL]
cd SignumLBRI

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev

# Lub z Docker
docker-compose -f docker-compose.local.yml up
```

### 🧑‍💻 Przydatne komendy
```bash
npm run build          # Production build
npm test              # Run tests  
npm run lint          # ESLint check
npm run security:audit # Security scan
```

---

## 📊 Statystyki Projektu

- **📁 Files**: 150+ plików źródłowych
- **💻 Languages**: TypeScript, JavaScript, Pug, SCSS
- **📚 Models**: User, Book, BookListing, School, Buyer, Performance
- **🎮 Controllers**: 8 głównych controllerów
- **🌍 Translations**: 4 języki
- **🧪 Tests**: Jest framework (w rozwoju)

---

## 🗺️ Roadmap

### 🎯 Q2 2025 - Performance & Security
- [ ] Database optimization & indexing
- [ ] Enhanced security (2FA, audit logs)  
- [ ] Comprehensive test coverage
- [ ] Performance monitoring

### 🚀 Q3 2025 - New Features
- [ ] Progressive Web App (PWA)
- [ ] Advanced search & filtering
- [ ] Online payment integration
- [ ] Mobile-first redesign

### 🌟 2026 - Expansion
- [ ] Native mobile apps  
- [ ] Microservices architecture
- [ ] AI-powered features
- [ ] Multi-region deployment

**[📋 Pełny roadmap](docs/ROADMAP.md)**

---

## 📚 Dokumentacja

| Dokument | Opis |
|----------|------|
| **[🛠️ Development Guide](docs/DEV_GUIDE.md)** | Przewodnik dla developerów |
| **[📋 Funkcjonalności](docs/FUNKCJONALNOSCI.md)** | Szczegółowy opis wszystkich funkcji |
| **[🗺️ Roadmap](docs/ROADMAP.md)** | Plan rozwoju na 2025-2026 |
| **[🐳 Docker Guide](docker/README.md)** | Instrukcje Docker deployment |

---

## 🤝 Contributing

### 👨‍💻 Jak pomóc w rozwoju?
1. **Fork** repozytorium
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Create Pull Request**

### 📝 Coding Standards
- **TypeScript** z strict mode
- **ESLint** + **Prettier** for formatting
- **Jest** for testing
- **Conventional Commits** for messages

---

## 📄 License

Ten projekt jest licencjonowany na **MIT License** - zobacz [LICENSE](LICENSE) dla szczegółów.

---

## 🏫 Dla Szkół

### 🎯 Korzyści dla szkół
- ✅ **Bezpłatna platforma** do zarządzania podręcznikami
- ✅ **Dodatkowy dochód** z prowizji od sprzedaży
- ✅ **Wsparcie samorządu uczniowskiego** 
- ✅ **Ekologia** - second-hand books
- ✅ **Oszczędności** dla rodziców

### 📞 Kontakt dla szkół
Jesteś przedstawicielem szkoły i chcesz dołączyć do platformy?
**Skontaktuj się z nami**: [kontakt@signumlbri.pl] *(przykładowy email)*

---

## 👥 Team

**SignumLBRI** jest rozwijane przez **Samorząd Uczniowski Elektryk Opole** z pasją do innowacji w edukacji.

### 🏆 Contributors
- Główni developerzy aktywnie rozwijają platformę
- Community contributors welcome!
- Studenci testujący i zgłaszający feedback

---

## 🌟 Support

### ❓ Potrzebujesz pomocy?
- 📖 **Dokumentacja**: [docs/](docs/)  
- 🐛 **Issues**: [GitHub Issues](../../issues)
- 💬 **Discussions**: [GitHub Discussions](../../discussions)

### 🚨 Znalazłeś bug?
1. Sprawdź czy nie jest już zgłoszony w [Issues](../../issues)
2. Stwórz **nowy issue** z dokładnym opisem
3. Dodaj kroki reprodukcji błędu
4. Dołącz screenshots jeśli możliwe

---

<div align="center">

## 🎓 Made with ❤️ for Education

**SignumLBRI** - *Revolutionizing textbook trading in schools*

[⭐ Star this repo](../../stargazers) • [🍴 Fork it](../../fork) • [📢 Share it](../../)

---

*© 2025 Samorząd Uczniowski Elektryk Opole. Licensed under MIT.*

</div>
