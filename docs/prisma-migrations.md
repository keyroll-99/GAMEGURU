# Prisma - Jak dodać nową migrację

## Wymagania wstępne

- Docker z PostgreSQL musi być uruchomiony
- Musisz być w katalogu `backend/`

```powershell
# Uruchom bazę danych (jeśli nie działa)
cd d:\GameGuru
docker-compose up -d postgres
```

---

## Krok 1: Edytuj schemat Prisma

Otwórz plik `backend/prisma/schema.prisma` i dodaj/zmodyfikuj model:

```prisma
model NowyModel {
  id        String   @id @default(uuid())
  nazwa     String
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("nowy_model")  // nazwa tabeli w bazie
}
```

### Konwencje nazewnictwa:

| Prisma (camelCase) | Baza danych (snake_case) |
|--------------------|--------------------------|
| `createdAt`        | `created_at` via `@map()` |
| `NowyModel`        | `nowy_model` via `@@map()` |

---

## Krok 2: Wygeneruj migrację

```powershell
cd d:\GameGuru\backend
npx prisma migrate dev --name nazwa_migracji
```

### Przykłady nazw migracji:
- `add_users_table`
- `add_projects_table`
- `add_avatar_to_users`
- `rename_title_to_name`

### Co się dzieje:
1. Prisma porównuje schemat z bazą danych
2. Generuje plik SQL w `prisma/migrations/[timestamp]_[nazwa]/migration.sql`
3. Automatycznie wykonuje migrację na bazie
4. Regeneruje Prisma Client

---

## Krok 3: Sprawdź wygenerowany SQL

Przejrzyj plik migracji:

```
backend/prisma/migrations/
  └─ 20260116155455_nazwa_migracji/
      └─ migration.sql
```

---

## Przydatne komendy

### Tylko wygeneruj migrację (bez wykonania)

```powershell
npx prisma migrate dev --name nazwa --create-only
```

Przydatne gdy chcesz przejrzeć/edytować SQL przed wykonaniem.

### Wykonaj istniejące migracje

```powershell
npx prisma migrate deploy
```

Używane na produkcji - wykonuje wszystkie pending migracje.

### Reset bazy danych

```powershell
npx prisma migrate reset
```

⚠️ **UWAGA**: Usuwa wszystkie dane i wykonuje migracje od nowa!

### Sprawdź status migracji

```powershell
npx prisma migrate status
```

### Regeneruj Prisma Client (bez migracji)

```powershell
npx prisma generate
```

---

## Rozwiązywanie problemów

### Problem: "Can't reach database server"

```powershell
# Upewnij się, że PostgreSQL działa
docker-compose up -d postgres

# Sprawdź czy kontener jest zdrowy
docker ps
```

### Problem: "Migration failed"

1. Sprawdź błąd w konsoli
2. Możesz zresetować bazę: `npx prisma migrate reset`
3. Lub ręcznie poprawić SQL w pliku migracji

### Problem: "Drift detected"

Baza różni się od schematu. Rozwiązania:
- `npx prisma migrate reset` (rozwój)
- `npx prisma db push --accept-data-loss` (szybka synchronizacja)

---

## Przykład: Dodanie nowego pola

### 1. Edytuj model w schema.prisma:

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  username     String   @unique
  passwordHash String   @map("password_hash")
  avatarUrl    String?  @map("avatar_url")
  bio          String?  // ← NOWE POLE
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

### 2. Utwórz migrację:

```powershell
npx prisma migrate dev --name add_bio_to_users
```

### 3. Wynik w SQL:

```sql
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
```

---

## Przykład: Relacje między tabelami

```prisma
model User {
  id       String    @id @default(uuid())
  email    String    @unique
  projects Project[] // relacja 1:N
  
  @@map("users")
}

model Project {
  id      String @id @default(uuid())
  name    String
  ownerId String @map("owner_id")
  owner   User   @relation(fields: [ownerId], references: [id])
  
  @@map("projects")
}
```

```powershell
npx prisma migrate dev --name add_projects_table
```
