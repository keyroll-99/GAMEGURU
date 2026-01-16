# GameGuru - Specyfikacja Techniczna MVP / v1.0

## 1. Przegląd Systemu
Narzędzie do zarządzania projektami gier oparte na nieskończonej, hierarchicznej mapie myśli (Mind Map) zamiast klasycznej tablicy Kanban.

### Stack Technologiczny
*   **Backend:** NestJS (Node.js) + TypeORM/Prisma (do wyboru, zalecany Prisma dla type-safety).
*   **Baza danych:** PostgreSQL.
*   **Frontend:** Vue 3 (Composition API) + Pinia (State Management).
*   **Infrastruktura:** Docker + Docker Compose.

---

## 2. Architektura Bazy Danych (Schema Design)

W oparciu o wymagania (drzewiasta struktura, kolejność rodzeństwa), proponuję następujące tabele:

### `users`
*   `id` (UUID/Int, Primary Key)
*   `email` (Unique, String)
*   `password_hash` (String)
*   `username` (String)
*   `avatar_url` (String, Nullable) - *zgodnie z wymaganiem: user ma avatar*
*   `created_at`

### `projects`
*   `id` (PK)
*   `name` (String)
*   `description` (String, Nullable)
*   `owner_id` (FK -> users.id)
*   `created_at`

### `project_members` (Tabela łącząca)
*   `project_id` (FK)
*   `user_id` (FK)
*   `role` (Enum: 'OWNER', 'MEMBER') - *przygotowanie pod uprawnienia*

### `nodes` (Sercem systemu - Taski i Milestone'y)
To jest prosta lista sąsiedztwa (Adjacency List) do obsługi drzewa.

*   `id` (PK)
*   `project_id` (FK -> projects.id) - dla szybkiego filtrowania całego drzewa.
*   `parent_id` (FK -> nodes.id, Nullable) - jeśli NULL, jest to ROOT projektu.
*   `type` (Enum: 'TASK', 'MILESTONE') - *jeden obiekt, różne typy*
*   `status` (Enum: 'TODO', 'IN_PROGRESS', 'DONE') - *zgodnie z wymaganiem statusów*
*   `title` (String)
*   `description` (Text, Nullable)
*   `assigned_to` (FK -> users.id, Nullable) - *zgodnie z wymaganiem przypisania*
*   `order_index` (Integer) - *Kluczowe: User sam układa, system pilnuje kolejności rodzeństwa (1, 2, 3...).*
*   `created_at`

---

## 3. Backend API (NestJS) - Kluczowe Endpointy

Do obsługi MVP potrzebujemy następujących kontrolerów:

**Auth (`/auth`)**
*   `POST /register` (email, pass, username)
*   `POST /login` (zwraca JWT)

**Projects (`/projects`)**
*   `POST /` (Tworzy projekt + automatycznie tworzy pierwszy Node typu ROOT o nazwie projektu).
*   `GET /` (Lista projektów usera).
*   `POST /:id/invite` (Body: `{ email }` -> szuka usera w DB, dodaje do `project_members`).
*   `DELETE /:id/members/:userId` (Usuwa usera z projektu).

**Nodes (`/nodes`)**
*   `GET /project/:projectId` -> Pobiera całe drzewo węzłów dla projektu (Front przetworzy płaską listę na drzewo).
*   `POST /` -> Tworzy nowy node. W Body: `parentId` (wymagane), `title`, `type`. Logic: Backend musi obliczyć `order_index` (np. max order rodzeństwa + 1).
*   `PATCH /:id` -> Edycja: zmiana opisu, przypisanie usera (`assigned_to`), zmiana statusu.
*   `PATCH /:id/move` -> Logika Drag & Drop. W Body: `newParentId`, `newOrderIndex`. Backend musi przeliczyć indeksy rodzeństwa.

---

## 4. Frontend (Vue 3) - Wytyczne UX/UI

### Wizualizacja Mapy Myśli (Mind Map)
Zamiast gotowej biblioteki Canvas, dla MVP i łatwości stylowania (CSS) zalecane podejście to **Komponenty Rekurencyjne**.

1.  **Layout:** Zastosowanie `display: flex` lub biblioteki typu `D3.js` (tylko do obliczenia drzewa) + renderowanie HTML. Użytkownik nie układa współrzędnych X/Y, layout jest automatyczny.
2.  **Node Component:**
    *   Wyświetla Title.
    *   **Statusy:**
        *   `DONE`: Przekreślenie, szary kolor, wizualnie "zgaszony".
        *   `IN_PROGRESS`: Wyraźna (np. niebieska/pomarańczowa) ramka lub znacznik.
        *   `TODO`: Domyślny wygląd.
    *   Wyświetla Avatar przypisanego usera (mały okrąg w rogu).
3.  **Interakcja:**
    *   Drag and Drop: Użycie biblioteki do przestawiania kolejności dzieci (zmiana `order_index`) oraz przenoszenia między rodzicami.

### Flow Użytkownika
1.  **Dashboard:** Lista projektów -> Kliknięcie w projekt otwiera widok Mapy.
2.  **Widok Mapy:**
    *   Centralny widok: Drzewo.
    *   Prawy panel (Sidebar): Szczegóły klikniętego węzła (Gdzie można edytować opis, zmienić status selectem, przypisać osobę po emailu/liście członków).

---

## 5. Docker Compose (Start środowiska)

Plik `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Konfiguracja Bazy Danych
  postgres:
    image: postgres:18
    container_name: gameguru_db
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gameguru
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Backend (NestJS)
  backend:
    image: node:20-alpine
    container_name: gameguru_backend
    working_dir: /app
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
    command: npm run start:dev
    depends_on:
      - postgres

  # Frontend (Vue)
  frontend:
    image: node:20-alpine
    container_name: gameguru_frontend
    working_dir: /app
    ports:
      - "8080:5173"
    volumes:
      - ./frontend:/app
    command: npm run dev -- --host
    depends_on:
      - backend

volumes:
  postgres_data:
```
