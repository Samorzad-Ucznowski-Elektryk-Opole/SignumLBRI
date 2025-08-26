# 🚀 INSTRUKCJA URUCHOMIENIA SignumLBRI Enhanced

## ⚠️ WYMAGANIA SYSTEMOWE

### Node.js (WYMAGANE)
```bash
# Pobierz Node.js z https://nodejs.org/
# Wybierz wersję LTS (Long Term Support)
# Po instalacji uruchom ponownie terminal
```

### Instalacja zależności
```bash
npm install
```

## 🎯 OPCJE URUCHOMIENIA

### 1️⃣ Szybkie uruchomienie (ZALECANE)
```bash
# Windows
launch-enhanced.bat

# Lub bezpośrednio
node enhanced-app.js
```

### 2️⃣ Docker (jeśli Docker zainstalowany)
```bash
# Budowanie obrazu
docker build -f Dockerfile.enhanced -t signumlbri-enhanced .

# Uruchomienie
docker run -d -p 4000:4000 --name signumlbri-enhanced signumlbri-enhanced
```

### 3️⃣ Przez npm
```bash
npm start
```

## 🌐 DOSTĘP DO APLIKACJI

Po uruchomieniu aplikacja będzie dostępna pod adresem:
- **Enhanced UI**: http://localhost:4000/enhanced
- **Standardowa**: http://localhost:4000/

## 📋 FUNKCJE ENHANCED

### ✨ Nowoczesny Interface
- 🎨 Glassmorphism design z przezroczystymi elementami
- 🌙 Tryb ciemny i jasny
- 📱 W pełni responsywny design
- 🎭 Animacje CSS i przejścia

### 🔧 Zaawansowane Funkcje
- 📚 System zarządzania książkami
- 👥 Panel administracyjny
- 📊 Analityka i raporty
- 🏢 Zarządzanie szkołami
- 💰 System płatności
- 📸 Upload i skalowanie obrazów

### 🌍 Obsługa języków
- 🇵🇱 Polski (domyślny)
- 🇬🇧 Angielski
- 🇺🇦 Ukraiński

### 🔒 Bezpieczeństwo
- 🛡️ Hashing haseł (bcrypt)
- 🔐 Sesje użytkowników
- 🚫 Ochrona przed atakami
- ✅ Walidacja danych

## 🚨 ROZWIĄZYWANIE PROBLEMÓW

### Brak Node.js
```bash
# Pobierz i zainstaluj Node.js
https://nodejs.org/

# Sprawdź instalację
node --version
npm --version
```

### Port zajęty
```bash
# Zmień port w enhanced-app.js
const PORT = 4001; // Zamiast 4000
```

### Błędy modułów
```bash
# Usuń node_modules i zainstaluj ponownie
rmdir /s node_modules
npm install
```

## 📞 WSPARCIE

W przypadku problemów:
1. Sprawdź czy Node.js jest zainstalowany
2. Uruchom `npm install` w folderze projektu
3. Sprawdź czy port 4000 jest wolny
4. Spróbuj uruchomić przez `npm start`

---

**Autor**: GitHub Copilot  
**Wersja**: Enhanced SignumLBRI 2.0  
**Data**: 2024
