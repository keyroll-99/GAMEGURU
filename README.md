# GameGuru 🎮

GameGuru to nowoczesne narzędzie do zarządzania projektami z naciskiem na wizualizację w formie map myśli. Projekt składa się z backendu w NestJS oraz frontendu w Vue 3.

## 🏗️ Architektura

- **Backend**: NestJS, Prisma ORM, PostgreSQL
- **Frontend**: Vue 3, Vite, Pinia, TypeScript
- **Infrastruktura**: Docker Compose

## 🚀 Wymagania wstępne

- Docker & Docker Compose
- Node.js (v20+) - do lokalnego developmentu
- npm (lub pnpm/yarn)

## 🛠️ Instalacja i Uruchomienie

### Szybki start (Docker)

Najłatwiejszy sposób na uruchomienie całej aplikacji (baza danych + backend + frontend):

1. Sklonuj repozytorium:
   ```bash
   git clone <repo-url>
   cd GameGuru
   ```

2. Skonfiguruj zmienne środowiskowe:
   ```bash
   cp .env.example .env
   ```
   Domyślne wartości powinny zadziałać od razu (użytkownik: `gameguru`, hasło: `gameguru123`).

3. Uruchom kontenery:
   ```bash
   docker-compose up --build
   ```

Aplikacja będzie dostępna pod adresami:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs

### Development lokalny

Jeśli chcesz uruchomić usługi osobno (np. baza w Dockerze, a kod lokalnie):

#### 1. Baza danych (PostgreSQL)
Uruchom tylko bazę danych przez Docker Compose:
```bash
docker-compose up postgres -d
```

#### 2. Backend
```bash
cd backend
npm install
npm run migrate:dev  # Uruchom migracje bazy danych
npm run start:dev    # Uruchom serwer developerski
```
Backend dostępny pod: `http://localhost:3000`

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend dostępny pod: `http://localhost:5173`

## 📚 Dokumentacja API

Backend udostępnia dokumentację w standardzie OpenAPI (Swagger) w trybie developerskim.
Po uruchomieniu backendu wejdź na:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

## 🗄️ Baza Danych (Prisma Studio)

Aby wizualnie zarządzać bazą danych, możesz użyć Prisma Studio (gdy backend działa lokalnie):
```bash
cd backend
npx prisma studio
```
Dostępne pod: `http://localhost:5555`

## 🧪 Testy

Backend:
```bash
cd backend
npm run test       # Unit tests
npm run test:e2e   # End-to-end tests
```

Frontend:
```bash
cd frontend
npm run type-check # Sprawdzenie typów TypeScript
```

## 📝 Lista zadań

Postęp prac można śledzić w pliku `prompts/task.md`.

---
Autor: Twój Zespół GameGuru
