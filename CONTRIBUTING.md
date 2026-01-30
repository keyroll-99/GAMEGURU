# 🎓 Wprowadzenie dla Developera - gtrip

Witaj w projekcie gtrip! Ten dokument pomoże Ci zrozumieć strukturę projektu i rozpocząć naukę Vue 3 oraz NestJS.

## 📖 Spis treści

1. [Przegląd technologii](#-przegląd-technologii)
2. [Struktura projektu](#-struktura-projektu)
3. [Backend (NestJS)](#-backend-nestjs)
4. [Frontend (Vue 3)](#-frontend-vue-3)
5. [Baza danych (Prisma)](#-baza-danych-prisma)
6. [Jak zacząć kodować](#-jak-zacząć-kodować)
7. [Zadania dla początkujących](#-zadania-dla-początkujących)
8. [Przydatne linki](#-przydatne-linki)

---

## 🔧 Przegląd technologii

| Warstwa | Technologia | Opis |
|---------|-------------|------|
| **Frontend** | Vue 3 + Composition API | Reaktywny framework UI |
| **State Management** | Pinia | Zarządzanie stanem aplikacji |
| **Routing** | Vue Router | Nawigacja między stronami |
| **Backend** | NestJS | Framework Node.js (wzorowany na Angular) |
| **ORM** | Prisma | Typowane zapytania do bazy danych |
| **Baza danych** | PostgreSQL | Relacyjna baza danych |
| **Konteneryzacja** | Docker Compose | Uruchamianie całego środowiska |

---

## 📁 Struktura projektu

```
GameGuru/
├── backend/                 # Serwer NestJS
│   ├── src/
│   │   ├── auth/           # Moduł autentykacji (JWT)
│   │   ├── users/          # Moduł użytkowników
│   │   ├── projects/       # Moduł projektów
│   │   ├── nodes/          # Moduł węzłów mapy myśli
│   │   ├── prisma/         # Serwis bazy danych
│   │   └── common/         # Wspólne elementy (filtry, interceptory)
│   └── prisma/
│       └── schema.prisma   # Schemat bazy danych
│
├── frontend/                # Aplikacja Vue 3
│   └── src/
│       ├── api/            # Klient HTTP (axios)
│       ├── components/     # Komponenty Vue
│       ├── views/          # Strony/widoki
│       ├── stores/         # Stan aplikacji (Pinia)
│       ├── router/         # Konfiguracja routingu
│       └── layouts/        # Układy stron
│
├── docker/                  # Konfiguracja Docker
└── docs/                    # Dokumentacja
```

---

## 🖥️ Backend (NestJS)

### Czym jest NestJS?

NestJS to framework do budowania skalowalnych aplikacji serwerowych. Używa **modułów**, **kontrolerów** i **serwisów**.

### Podstawowe koncepty

#### 1. **Moduły** (`*.module.ts`)
Grupują powiązane funkcjonalności:

```typescript
// backend/src/users/users.module.ts
@Module({
  controllers: [UsersController],  // Obsługa requestów HTTP
  providers: [UsersService],       // Logika biznesowa
  exports: [UsersService],         // Eksport dla innych modułów
})
export class UsersModule {}
```

#### 2. **Kontrolery** (`*.controller.ts`)
Obsługują żądania HTTP (REST API):

```typescript
// backend/src/users/users.controller.ts
@Controller('users')
export class UsersController {
  @Get(':id')           // GET /users/:id
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()               // POST /users
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

#### 3. **Serwisy** (`*.service.ts`)
Zawierają logikę biznesową:

```typescript
// backend/src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

#### 4. **DTO** (Data Transfer Objects)
Definiują kształt danych + walidację:

```typescript
// backend/src/users/dto/create-user.dto.ts
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  username: string;
}
```

### Struktura modułu w projekcie

```
backend/src/users/
├── users.module.ts      # Definicja modułu
├── users.controller.ts  # Endpointy API
├── users.service.ts     # Logika biznesowa
├── dto/                 # Obiekty walidacji
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
└── index.ts             # Eksporty modułu
```

---

## 🎨 Frontend (Vue 3)

### Czym jest Vue 3?

Vue to reaktywny framework do budowania interfejsów. Używamy **Composition API** (nowoczesne podejście).

### Podstawowe koncepty

#### 1. **Komponenty** (`.vue`)
Samodzielne części UI:

```vue
<script setup lang="ts">
// Logika komponentu
import { ref, computed } from 'vue'

const count = ref(0)                    // Reaktywna zmienna
const doubled = computed(() => count.value * 2)  // Wartość obliczona

function increment() {
  count.value++
}
</script>

<template>
  <div>
    <p>Licznik: {{ count }} (x2 = {{ doubled }})</p>
    <button @click="increment">+1</button>
  </div>
</template>

<style scoped>
/* Style tylko dla tego komponentu */
button { background: blue; color: white; }
</style>
```

#### 2. **Reaktywność**

```typescript
import { ref, reactive, computed, watch } from 'vue'

// ref - dla prostych wartości
const name = ref('Jan')
name.value = 'Anna'  // Zmiana wartości

// reactive - dla obiektów
const user = reactive({ name: 'Jan', age: 25 })
user.age = 26  // Zmiana bez .value

// computed - wartości obliczone (cache)
const fullName = computed(() => `${user.name} Kowalski`)

// watch - nasłuchiwanie zmian
watch(name, (newVal, oldVal) => {
  console.log(`Zmiana z ${oldVal} na ${newVal}`)
})
```

#### 3. **Store (Pinia)**
Globalny stan aplikacji:

```typescript
// frontend/src/stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  // Stan
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  // Akcje
  async function login(email: string, password: string) {
    const response = await authApi.login(email, password)
    user.value = response.user
  }

  return { user, isAuthenticated, login }
})
```

Użycie w komponencie:
```vue
<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
// authStore.user, authStore.login()
</script>
```

#### 4. **Router**
Nawigacja między stronami:

```typescript
// frontend/src/router/index.ts
const routes = [
  { path: '/', component: HomeView },
  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
]
```

### Struktura widoku w projekcie

```
frontend/src/views/
├── HomeView.vue          # Strona główna
├── LoginView.vue         # Logowanie
├── RegisterView.vue      # Rejestracja
├── DashboardView.vue     # Panel główny (lista projektów)
├── MindMapView.vue       # Widok mapy myśli
└── ProfileView.vue       # Profil użytkownika
```

---

## 🗄️ Baza danych (Prisma)

### Schemat (`backend/prisma/schema.prisma`)

Definiuje tabele i relacje:

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  password_hash String

  // Relacje
  owned_projects Project[] @relation("ProjectOwner")
}

model Project {
  id       String @id @default(uuid())
  name     String
  owner_id String

  owner User   @relation("ProjectOwner", fields: [owner_id], references: [id])
  nodes Node[]
}
```

### Podstawowe operacje Prisma

```typescript
// Pobierz użytkownika
await prisma.user.findUnique({ where: { id: 'xxx' } })

// Stwórz projekt
await prisma.project.create({
  data: { name: 'Mój projekt', owner_id: userId }
})

// Pobierz z relacjami
await prisma.project.findMany({
  where: { owner_id: userId },
  include: { nodes: true }  // Dołącz węzły
})

// Aktualizuj
await prisma.node.update({
  where: { id: nodeId },
  data: { title: 'Nowy tytuł' }
})

// Usuń
await prisma.project.delete({ where: { id: projectId } })
```

---

## 🚀 Jak zacząć kodować

### 1. Uruchom środowisko

```bash
# Terminal 1 - Baza danych
docker-compose up postgres -d

# Terminal 2 - Backend
cd backend
npm install
npm run migrate:dev
npm run start:dev

# Terminal 3 - Frontend
cd frontend
npm install
npm run dev
```

### 2. Sprawdź czy działa

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger (dokumentacja API): http://localhost:3000/api/docs
- Prisma Studio (baza): `cd backend && npx prisma studio`

### 3. Workflow developmentu

1. **Zmiany w bazie** → Edytuj `schema.prisma` → `npm run migrate:dev`
2. **Nowy endpoint** → Stwórz DTO → Dodaj metodę w serwisie → Dodaj w kontrolerze
3. **Nowa strona** → Stwórz widok `.vue` → Dodaj route w `router/index.ts`
4. **Nowy komponent** → Stwórz w `components/` → Zaimportuj gdzie potrzeba

---

## 📝 Zadania dla początkujących

### Poziom 1: Zapoznanie się z kodem

- [ ] Przeczytaj `backend/src/users/users.service.ts` - jak działa pobieranie użytkownika?
- [ ] Przeczytaj `frontend/src/views/LoginView.vue` - jak działa logowanie?
- [ ] Sprawdź Swagger (`/api/docs`) - jakie endpointy są dostępne?

### Poziom 2: Małe zmiany

- [ ] **Backend**: Dodaj pole `bio` do modelu `User` (schema.prisma + migracja)
- [ ] **Frontend**: Dodaj wyświetlanie `bio` na stronie profilu
- [ ] **Frontend**: Zmień kolor przycisku w `LoginView.vue`

### Poziom 3: Nowe funkcjonalności

- [ ] **Backend**: Stwórz endpoint `GET /users/me/stats` zwracający liczbę projektów użytkownika
- [ ] **Frontend**: Wyświetl statystyki na dashboardzie
- [ ] **Frontend**: Stwórz komponent `StatCard.vue` do wyświetlania pojedynczej statystyki

---

## 🔗 Przydatne linki

### Dokumentacja

| Technologia | Link |
|-------------|------|
| **Vue 3** | https://vuejs.org/guide/introduction.html |
| **Vue Composition API** | https://vuejs.org/guide/extras/composition-api-faq.html |
| **Pinia** | https://pinia.vuejs.org/introduction.html |
| **Vue Router** | https://router.vuejs.org/guide/ |
| **NestJS** | https://docs.nestjs.com/ |
| **Prisma** | https://www.prisma.io/docs/ |
| **TypeScript** | https://www.typescriptlang.org/docs/ |

### Narzędzia VS Code

Zalecane rozszerzenia:
- **Vue - Official** (Vue.volar)
- **Prisma** (Prisma.prisma)
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)

### Debugowanie

```bash
# Backend - logi
npm run start:dev  # Wyświetla logi w terminalu

# Frontend - DevTools
# Otwórz F12 w przeglądarce → Vue DevTools (rozszerzenie Chrome)

# Baza danych - wizualnie
cd backend && npx prisma studio
```

---

## 💡 Wskazówki

1. **Zacznij od małych zmian** - nie próbuj zrozumieć wszystkiego naraz
2. **Używaj console.log** - w Vue używaj `console.log()`, w NestJS `console.log()` lub `Logger`
3. **Czytaj błędy** - TypeScript i Vue dają czytelne komunikaty
4. **Swagger jest twoim przyjacielem** - testuj API bez pisania frontendu
5. **Hot reload działa** - po zapisaniu pliku zmiany są widoczne automatycznie

---

Powodzenia! 🚀 Jeśli masz pytania, sprawdź najpierw dokumentację lub zapytaj.
