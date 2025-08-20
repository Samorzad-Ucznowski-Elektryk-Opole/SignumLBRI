# 🚀 SignumLBRI 2025 Ultra - Instrukcje Instalacji i Uruchomienia

## 🎯 Wykonaj w kolejności:

### 1️⃣ Zainstaluj Node.js
```cmd
1-install-nodejs.bat
```
- Pobierze i zainstaluje Node.js 20.x LTS
- Po instalacji **restartuj terminal/cmd**

### 2️⃣ Zainstaluj zależności
```cmd
2-install-dependencies.bat
```
- Sprawdzi instalację Node.js
- Zainstaluje wszystkie pakiety npm

### 3️⃣ Uruchom w trybie rozwoju
```cmd
3-dev-start.bat
```
- Uruchomi aplikację z hot-reload
- Dostępna na portach **8080** (HTTP) i **8443** (HTTPS)

### 4️⃣ Lub uruchom w trybie produkcyjnym
```cmd
4-prod-start.bat
```
- Pełny stack z bazami danych
- SSL, monitoring, wszystko!

## 🌐 Po uruchomieniu:

| Serwis | URL | Twoje porty! |
|--------|-----|--------------|
| 🎯 **Główna aplikacja** | http://localhost:8080 | ✅ PORT 8080 |
| 🔒 **Bezpieczna aplikacja** | https://localhost:8443 | ✅ PORT 8443 |

## 📋 Wymagania systemowe:

- **Windows 10/11**
- **Node.js 20.x** (zainstaluje się automatycznie)
- **Docker Desktop** (opcjonalnie, dla pełnego stacku)
- **4GB RAM minimum**

## 🛠️ Opcjonalnie - Docker Desktop:

Jeśli chcesz pełny stack (bazy danych, cache, search):
1. Pobierz Docker Desktop ze strony: https://www.docker.com/products/docker-desktop/
2. Zainstaluj z domyślnymi opcjami
3. Uruchom Docker Desktop
4. Użyj `4-prod-start.bat` dla pełnego stacku

## ⚡ Quick Start:

```cmd
# Sposób 1 - Krok po kroku
1-install-nodejs.bat
2-install-dependencies.bat
3-dev-start.bat

# Sposób 2 - Wszystko na raz (po instalacji Node.js)
2-install-dependencies.bat && 3-dev-start.bat
```

## 🎊 Gotowe!

Twoja zajebista aplikacja będzie działać na:
- **http://localhost:8080** 🎯
- **https://localhost:8443** 🔒

Wszystko zgodnie z Twoimi wymaganiami - porty 8080 i 8443, bazy danych lokalnie, wszystko kompatybilne! 🚀
