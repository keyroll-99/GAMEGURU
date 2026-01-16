# GameGuru - Lista Zadań do Implementacji

## Legenda Statusów
- [ ] Do zrobienia
- [x] Zrobione

---

## FAZA 0: Infrastruktura i Setup

### 0.1 Docker & Środowisko
- [x] **T-001** Utworzenie struktury folderów projektu (`/backend`, `/frontend`, `/docker`)
- [x] **T-002** Utworzenie `docker-compose.yml` z PostgreSQL, Backend, Frontend
- [x] **T-003** Utworzenie `.env.example` z przykładowymi zmiennymi środowiskowymi
- [x] **T-004** Konfiguracja `.gitignore` dla całego projektu

### 0.2 Backend - Inicjalizacja NestJS
- [x] **T-005** Inicjalizacja projektu NestJS (`nest new backend`)
- [x] **T-006** Instalacja i konfiguracja Prisma ORM
- [x] **T-007** Konfiguracja połączenia z PostgreSQL (DATABASE_URL z .env)
- [x] **T-008** Utworzenie pierwszej migracji Prisma (pusta baza)

### 0.3 Frontend - Inicjalizacja Vue
- [x] **T-009** Inicjalizacja projektu Vue 3 + Vite (`npm create vue@latest`)
- [x] **T-010** Instalacja Pinia (state management)
- [x] **T-011** Instalacja Vue Router
- [x] **T-012** Konfiguracja podstawowego layoutu (App.vue, router)

---

## FAZA 1: Moduł Użytkowników (Users)

### 1.1 Backend - Schema Users
- [x] **T-013** Dodanie modelu `User` do Prisma schema:
  - `id` (UUID)
  - `email` (unique)
  - `username` (unique)
  - `password_hash`
  - `avatar_url` (nullable)
  - `created_at`
  - `updated_at`
- [x] **T-014** Migracja bazy danych dla tabeli `users`

### 1.2 Backend - Rejestracja
- [x] **T-015** Utworzenie modułu `AuthModule`
- [x] **T-016** Utworzenie DTO: `RegisterDto` (email, username, password)
- [x] **T-017** Walidacja DTO (class-validator): email format, username min 3 znaki, password min 8 znaków
- [x] **T-018** Serwis: hashowanie hasła (bcrypt)
- [x] **T-019** Serwis: sprawdzenie unikalności email i username
- [x] **T-020** Endpoint `POST /auth/register`
- [x] **T-021** Obsługa błędów (email/username już istnieje)

### 1.3 Backend - Logowanie (JWT)
- [x] **T-022** Instalacja `@nestjs/jwt` i `@nestjs/passport`
- [x] **T-023** Konfiguracja JWT strategy (access token - 15min, refresh token - 7 dni)
- [x] **T-024** Utworzenie DTO: `LoginDto` (email, password)
- [x] **T-025** Serwis: walidacja credentials
- [x] **T-026** Serwis: generowanie access + refresh token
- [x] **T-027** Endpoint `POST /auth/login` (zwraca oba tokeny)
- [x] **T-028** Endpoint `POST /auth/refresh` (wymiana refresh na nowy access token)
- [x] **T-029** Utworzenie `JwtAuthGuard` do ochrony endpointów

### 1.4 Backend - Profil użytkownika
- [x] **T-030** Endpoint `GET /users/me` (dane zalogowanego usera)
- [x] **T-031** Endpoint `PATCH /users/me` (edycja username)
- [x] **T-032** Endpoint `POST /users/me/avatar` (upload avatara)
- [x] **T-033** Walidacja avatara: max 500KB, tylko jpg/png
- [x] **T-034** Zapis avatara na dysku lub base64 w bazie (decyzja: dysk + static serve)

### 1.5 Frontend - Auth UI
- [x] **T-035** Strona `/register` - formularz rejestracji
- [x] **T-036** Strona `/login` - formularz logowania
- [x] **T-037** Pinia store: `useAuthStore` (user, tokens, isAuthenticated)
- [x] **T-038** Logika przechowywania tokenów (localStorage)
- [x] **T-039** Axios interceptor: dodawanie Bearer token do requestów
- [x] **T-040** Axios interceptor: auto-refresh token przy 401
- [x] **T-041** Navbar z przyciskami Login/Register lub Avatar + Logout
- [x] **T-042** Route guard: przekierowanie niezalogowanych do `/login`

---

## FAZA 2: Moduł Projektów (Projects)

### 2.1 Backend - Schema Projects
- [x] **T-043** Dodanie modelu `Project` do Prisma:
  - `id` (UUID)
  - `name`
  - `description` (nullable)
  - `owner_id` (FK -> User)
  - `is_archived` (boolean, default false)
  - `created_at`
  - `updated_at`
- [x] **T-044** Dodanie modelu `ProjectMember`:
  - `project_id` (FK)
  - `user_id` (FK)
  - `role` (enum: OWNER, MEMBER)
  - `joined_at`
- [x] **T-045** Migracja bazy danych

### 2.2 Backend - CRUD Projektów
- [x] **T-046** Utworzenie modułu `ProjectsModule`
- [x] **T-047** DTO: `CreateProjectDto` (name, description?)
- [x] **T-048** Endpoint `POST /projects` - tworzenie projektu
  - Automatycznie dodaje ownera do `project_members` z rolą OWNER
  - Automatycznie tworzy ROOT node
- [x] **T-049** Endpoint `GET /projects` - lista projektów usera (gdzie jest memberem)
- [x] **T-050** Endpoint `GET /projects/:id` - szczegóły projektu
- [x] **T-051** Endpoint `PATCH /projects/:id` - edycja nazwy/opisu (tylko owner)
- [x] **T-052** Endpoint `PATCH /projects/:id/archive` - archiwizacja projektu (tylko owner)
- [x] **T-053** Endpoint `PATCH /projects/:id/transfer-ownership` - przekazanie ownership (tylko owner)

### 2.3 Backend - Członkowie projektu
- [x] **T-054** Endpoint `GET /projects/:id/members` - lista członków
- [x] **T-055** DTO: `InviteMemberDto` (email)
- [x] **T-056** Endpoint `POST /projects/:id/members` - zaproszenie usera (szuka po email)
- [x] **T-057** Endpoint `DELETE /projects/:id/members/:userId` - usunięcie członka (tylko owner)
- [x] **T-058** Endpoint `DELETE /projects/:id/members/me` - opuszczenie projektu (member)
- [x] **T-059** Walidacja: owner nie może usunąć siebie bez przekazania ownership

### 2.4 Frontend - Projects UI
- [x] **T-060** Strona `/dashboard` - lista projektów użytkownika
- [x] **T-061** Komponent `ProjectCard` (nazwa, opis, liczba członków, owner badge)
- [x] **T-062** Modal: Tworzenie nowego projektu
- [x] **T-063** Pinia store: `useProjectsStore`
- [x] **T-064** Strona `/projects/:id/settings` - ustawienia projektu
- [x] **T-065** Sekcja: Zarządzanie członkami (lista, invite, remove)
- [x] **T-066** Sekcja: Archiwizacja projektu
- [x] **T-067** Sekcja: Transfer ownership

---

## FAZA 3: Moduł Węzłów - Mind Map (Nodes)

### 3.1 Backend - Schema Nodes
- [x] **T-068** Dodanie modelu `Node` do Prisma:
  - `id` (UUID)
  - `project_id` (FK)
  - `parent_id` (FK -> Node, nullable dla ROOT)
  - `type` (enum: ROOT, TASK, MILESTONE)
  - `status` (enum: TODO, IN_PROGRESS, DONE)
  - `title` (varchar 255)
  - `description` (text, nullable)
  - `order_index` (integer)
  - `created_at`
  - `updated_at`
- [x] **T-069** Dodanie tabeli `NodeAssignees` (wiele userów do node):
  - `node_id` (FK)
  - `user_id` (FK)
- [x] **T-070** Dodanie tabeli `NodeHistory` (historia zmian ROOT):
  - `id`
  - `node_id` (FK)
  - `field_name` (title/description)
  - `old_value`
  - `new_value`
  - `changed_by` (FK -> User)
  - `changed_at`
- [x] **T-071** Migracja bazy danych

### 3.2 Backend - CRUD Nodes
- [x] **T-072** Utworzenie modułu `NodesModule`
- [x] **T-073** Endpoint `GET /projects/:projectId/nodes` - pobiera całe drzewo (płaska lista)
- [x] **T-074** DTO: `CreateNodeDto` (parentId, title, type, description?)
- [x] **T-075** Endpoint `POST /nodes` - tworzenie węzła
  - Walidacja: parentId musi istnieć i być z tego samego projektu
  - Automatyczne obliczenie order_index
- [x] **T-076** Endpoint `GET /nodes/:id` - szczegóły węzła
- [x] **T-077** DTO: `UpdateNodeDto` (title?, description?, status?)
- [x] **T-078** Endpoint `PATCH /nodes/:id` - edycja węzła
  - Dla ROOT: zapis do NodeHistory
- [x] **T-079** Endpoint `DELETE /nodes/:id` - usunięcie węzła + cascade dzieci
  - Walidacja: nie można usunąć ROOT
- [x] **T-080** DTO: `MoveNodeDto` (newParentId, newOrderIndex)
- [x] **T-081** Endpoint `PATCH /nodes/:id/move` - przeniesienie węzła (drag & drop)
  - Przeliczenie order_index rodzeństwa

### 3.3 Backend - Assignees
- [x] **T-082** Endpoint `POST /nodes/:id/assignees` (body: userId)
  - Walidacja: user musi być memberem projektu
- [x] **T-083** Endpoint `DELETE /nodes/:id/assignees/:userId` - usunięcie przypisania
- [x] **T-084** Endpoint `GET /nodes/:id/history` - historia zmian (tylko dla ROOT)

### 3.4 Frontend - Mind Map Core
- [x] **T-085** Strona `/projects/:id/map` - główny widok mapy
- [x] **T-086** Pinia store: `useNodesStore` (nodes tree, selected node)
- [x] **T-087** Funkcja: transformacja płaskiej listy na drzewo
- [x] **T-088** Komponent `MindMapCanvas` - kontener z zoom/pan
- [x] **T-089** Implementacja zoom (scroll wheel) i pan (drag tła)
- [x] **T-090** Komponent rekurencyjny `NodeTree` - renderowanie drzewa
- [x] **T-091** Komponent `NodeCard` - pojedynczy węzeł
  - Wyświetla: title, status (kolor/ikona), avatary assignees
  - Status DONE: przekreślenie, szary
  - Status IN_PROGRESS: kolorowa ramka

### 3.5 Frontend - Interakcje z węzłami
- [x] **T-092** Collapse/Expand węzłów (ikonka +/-)
- [x] **T-093** Kliknięcie w węzeł = zaznaczenie (podświetlenie)
- [x] **T-094** Sidebar prawy: szczegóły zaznaczonego węzła
- [x] **T-095** Sidebar: edycja title (inline)
- [x] **T-096** Sidebar: edycja description (textarea)
- [x] **T-097** Sidebar: zmiana statusu (select/dropdown)
- [x] **T-098** Sidebar: zarządzanie assignees (lista + dodawanie z dropdown członków)
- [x] **T-099** Przycisk "Dodaj dziecko" na węźle lub w sidebarze
- [x] **T-100** Modal: Tworzenie nowego węzła (title, type)

### 3.6 Frontend - Drag & Drop
- [x] **T-101** Instalacja biblioteki do drag & drop (np. vuedraggable lub @vueuse/gesture)
- [x] **T-102** Drag węzła do zmiany kolejności (order_index)
- [x] **T-103** Drag węzła do innego rodzica (przeniesienie)
- [x] **T-104** Wizualne wskaźniki podczas przeciągania (drop zones)

---

## FAZA 4: Polish & UX

### 4.1 Backend - Dodatkowe
- [x] **T-105** Global exception filter (czytelne błędy API)
- [x] **T-106** Request validation pipe (global)
- [x] **T-107** Logging (request/response)
- [x] **T-108** CORS konfiguracja

### 4.2 Frontend - UI/UX
- [x] **T-109** Loading states (skeletony, spinnery)
- [x] **T-110** Toast notifications (sukces, błąd)
- [x] **T-111** Responsive design (podstawowy)
- [x] **T-112** Dark/Light mode (opcjonalne)
- [x] **T-113** Skróty klawiszowe (Escape = zamknij sidebar, Delete = usuń węzeł)

### 4.3 Dokumentacja
- [x] **T-114** README.md z instrukcją uruchomienia
- [x] **T-115** Swagger/OpenAPI dokumentacja API

---

## Podsumowanie

| Faza | Liczba tasków |
|------|---------------|
| 0 - Infrastruktura | 12 |
| 1 - Users & Auth | 30 |
| 2 - Projects | 25 |
| 3 - Nodes (Mind Map) | 37 |
| 4 - Polish | 11 |
| **RAZEM** | **115** |

---

## Decyzje techniczne do podjęcia w trakcie

1. **Avatar storage**: Dysk (`/uploads/avatars/`) + static serve przez NestJS
2. **Limity techniczne**:
   - Title: max 255 znaków
   - Description: bez limitu (TEXT)
   - Avatar: max 500KB, jpg/png
3. **Weryfikacja email**: POMINIĘTA (brak serwera mailowego)
4. **Reset hasła**: POMINIĘTE (wymaga maila) - do dodania w przyszłości

---

## Kolejność implementacji

Zalecam realizację w kolejności faz: 0 → 1 → 2 → 3 → 4

W ramach fazy można realizować backend i frontend równolegle po ukończeniu części backendowej danego modułu.
