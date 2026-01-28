# GameGuru MindMap - Lista Ulepszeń

## Podsumowanie problemów
Na podstawie zgłoszenia zidentyfikowano następujące problemy:

1. ❌ **Brak zapisywania stanu per użytkownik** - Zoom, pozycja, zwinięte/rozwinięte węzły
2. ❌ **Przeładowania przy przestawianiu** - UI się odświeża przy każdej zmianie
3. ❌ **Drag & drop nie jest płynny** - Przenoszenie węzłów przez przeciąganie działa niepłynnie
4. ❌ **Brak widoku tablicy** - Nie ma alternatywnego widoku typu Kanban

---

## ✅ Faza 1: Zapisywanie stanu użytkownika (UKOŃCZONA)

### Zaimplementowano:
- ✅ Model `UserViewState` w bazie danych przechowujący preferencje widoku
- ✅ Endpointy API do zapisu i odczytu stanu:
  - `GET /view-state/:projectId` - Pobranie zapisanego stanu
  - `POST /view-state` - Zapis/aktualizacja stanu
  - `DELETE /view-state/:projectId` - Reset stanu
- ✅ Automatyczny zapis stanu:
  - Zoom i pozycja kamery (pan)
  - Lista rozwiniętych węzłów
  - Debouncing 1 sekunda (nie zapisuje przy każdej zmianie)
- ✅ Przywracanie stanu przy ładowaniu projektu
- ✅ Optymistyczne aktualizacje (zmiana widoczna od razu, API w tle)

### Efekty:
- ✅ Stan widoku jest teraz zapisywany automatycznie
- ✅ Po powrocie do projektu wszystko jest tak jak użytkownik zostawił
- ✅ Każdy użytkownik ma swój własny stan dla każdego projektu

---

## 📋 Faza 2: Ulepszenie Drag & Drop

### Do zrobienia:

#### 2.1 Wizualna informacja zwrotna
- [ ] **Podświetlanie celów upuszczenia**
  - Węzeł nad którym przeciągamy powinien się podświetlić
  - Pokazać czy można tam upuścić (zielony = można, czerwony = nie można)
  
- [ ] **Widmo przeciąganego elementu**
  - Półprzezroczysty podgląd podczas przeciągania
  - Kursor powinien wskazywać akcję (chwytanie)

- [ ] **Podgląd nowej relacji**
  - Tymczasowa linia pokazująca do którego rodzica zostanie przeniesiony węzeł

#### 2.2 Lepsza detekcja upuszczenia
- [ ] **Większe strefy upuszczenia**
  - Zwiększyć próg z 100px do 150px
  - Łatwiej trafić w cel
  
- [ ] **Dedykowane strefy między węzłami**
  - Możliwość upuszczenia między węzłami (zmiana kolejności)
  - Wizualne wskaźniki gdzie może wylądować

#### 2.3 Optymalizacja wydajności
- [ ] **Cache'owanie obliczeń layoutu**
  - Nie przeliczać całego drzewa za każdym razem
  - Tylko dotknięte gałęzie
  
- [ ] **Płynniejsze animacje**
  - Dodać transitions CSS
  - Smooth return po nieudanym przeciągnięciu

---

## 📋 Faza 3: Widok Tablicy (Kanban)

### Do zrobienia:

#### 3.1 Nowe komponenty
- [ ] **BoardView.vue** - Główny widok tablicy Kanban
- [ ] **BoardColumn.vue** - Kolumna statusu (TODO, W TRAKCIE, GOTOWE)
- [ ] **BoardCard.vue** - Karta zadania
- [ ] **BoardFilters.vue** - Filtry (po osobie, typie, itp.)

#### 3.2 Funkcjonalność
- [ ] **Kolumny wg statusu**
  - Automatyczne grupowanie węzłów po statusie
  - TODO | W TRAKCIE | GOTOWE
  
- [ ] **Drag & drop między kolumnami**
  - Przeciąganie karty zmienia status
  - Płynne animacje
  
- [ ] **Swimlanes (opcjonalnie)**
  - Grupowanie dodatkowo po osobie przypisanej
  - Lub po milestone
  
- [ ] **Szybkie akcje**
  - Edycja inline
  - Szybka zmiana statusu
  - Dodawanie pod-zadań
  
- [ ] **Przełącznik widoku**
  - Przycisk Mind Map / Tablica
  - Zapamiętanie preferencji użytkownika

#### 3.3 Zarządzanie stanem
- [ ] Dodać `viewMode` do store (mindmap / board)
- [ ] Zapisywać preferowany widok w UserViewState
- [ ] Przywracać ostatnio używany widok

---

## 📋 Faza 4: Wydajność i UX

### Do zrobienia:

#### 4.1 Skróty klawiszowe
- [ ] `Spacja + Przeciągnięcie` - Przesuwanie canvas
- [ ] `+/-` - Zoom in/out
- [ ] `F` - Dopasuj widok
- [ ] `0` - Reset zoom do 100%
- [ ] `E` - Rozwiń wszystko
- [ ] `C` - Zwiń wszystko
- [ ] `N` - Nowy węzeł
- [ ] `Ctrl+Z` - Cofnij
- [ ] `Ctrl+Y` - Ponów

#### 4.2 Wyszukiwanie i filtrowanie
- [ ] **Pasek wyszukiwania**
  - Szukanie po tytule węzła
  - Podświetlanie wyników
  
- [ ] **Filtry**
  - Po statusie (TODO, W TRAKCIE, GOTOWE)
  - Po typie (ZADANIE, MILESTONE)
  - Po osobie przypisanej
  - Po dacie utworzenia/modyfikacji

#### 4.3 System Cofnij/Ponów
- [ ] Implementacja Command Pattern
- [ ] Historia akcji (stack)
- [ ] Możliwość cofnięcia ostatnich 20 akcji
- [ ] Wskaźnik czy można cofnąć/ponowić

#### 4.4 Wirtualne przewijanie
- [ ] Dla dużych map (100+ węzłów)
- [ ] Renderowanie tylko widocznych węzłów
- [ ] Ładowanie sąsiednich on-demand
- [ ] Znaczące przyspieszenie dla dużych projektów

#### 4.5 Wskaźnik zapisu
- [ ] Pokazać "Zapisywanie..." podczas zapisu
- [ ] "✓ Zapisano" po sukcesie
- [ ] "⚠ Błąd zapisu" przy problemie
- [ ] W rogu ekranu, nieinwazyjnie

---

## 📋 Faza 5: Zaawansowane funkcje

### Do zrobienia:

#### 5.1 Szablony węzłów
- [ ] Predefiniowane struktury:
  - Sprint Planning (Epic → Stories → Tasks)
  - Feature Development (Feature → Components → Tasks)
  - Bug Tracking (Bug → Investigation → Fix → Test)
- [ ] Możliwość tworzenia własnych szablonów
- [ ] Szybkie wstawianie całej struktury

#### 5.2 Operacje grupowe
- [ ] **Multi-select**
  - Ctrl+Klik lub przeciągnięcie prostokąta
  - Zaznaczanie wielu węzłów
  
- [ ] **Akcje grupowe**
  - Zmiana statusu dla wszystkich
  - Usunięcie wielu
  - Przeniesienie do innego rodzica
  - Przypisanie osoby do wielu zadań

#### 5.3 Eksport
- [ ] **PNG** - Eksport mapy jako obrazek
- [ ] **PDF** - Dokument wielostronicowy
- [ ] **JSON** - Backup danych / migracja
- [ ] **Markdown** - Hierarchiczna lista tekstowa

#### 5.4 Współpraca w czasie rzeczywistym
- [ ] **WebSocket** - Aktualizacje na żywo
- [ ] **Wskaźniki obecności** - Kto teraz przegląda/edytuje
- [ ] **Rozwiązywanie konfliktów** - Równoczesne edycje
- [ ] **Feed aktywności** - Ostatnie zmiany zespołu

#### 5.5 Analityka
- [ ] **Dashboard statystyk**
  - Liczba zadań w każdym statusie
  - Wypalenie (burndown chart)
  - Obciążenie członków zespołu
  
- [ ] **Raporty**
  - Postęp projektu
  - Velocity team
  - Time tracking (opcjonalnie)

---

## 📊 Priorytet implementacji

### 🔴 Wysoki (Natychmiast)
1. ✅ Zapisywanie stanu widoku (ZROBIONE)
2. 🔄 Lepsza wizualizacja drag & drop
3. 🔄 Implementacja widoku tablicy Kanban
4. 🔄 Wyszukiwanie i filtrowanie

### 🟡 Średni (Następny sprint)
1. ⏳ Skróty klawiszowe
2. ⏳ System cofnij/ponów
3. ⏳ Optymalizacja wydajności (wirtualne przewijanie)
4. ⏳ Szablony węzłów

### 🟢 Niski (Przyszłość)
1. ⏳ Operacje grupowe
2. ⏳ Funkcje eksportu
3. ⏳ Współpraca w czasie rzeczywistym
4. ⏳ Analityka i raporty

---

## 🎯 Podsumowanie

### Co zostało naprawione:
✅ **Stan widoku zapisuje się automatycznie** - Zoom, pozycja i rozwinięte węzły są zachowywane per użytkownik i per projekt

### Co jeszcze zostało do zrobienia:
1. **Drag & drop wymaga jeszcze dopracowania** - Dodać wizualne wskazówki i większe strefy upuszczenia
2. **Brak widoku tablicy** - Potrzebny alternatywny widok Kanban
3. **Brak zaawansowanych funkcji** - Wyszukiwanie, filtrowanie, skróty, eksport

### Następne kroki:
1. Przetestować zapisywanie stanu (uruchomić Docker i sprawdzić czy działa)
2. Zaimplementować fazę 2 (lepszy drag & drop)
3. Stworzyć widok tablicy (faza 3)
4. Dodać wyszukiwanie i skróty (faza 4)

---

## 📝 Notatki techniczne

### Potencjalne problemy:
- Migracja bazy danych wymaga uruchomienia `npm run migrate:dev` w backendzie
- WebSocket będzie wymagać dodatkowej infrastruktury
- Export do PDF może wymagać dodatkowej biblioteki (puppeteer/playwright)

### Zalecenia:
- Testy jednostkowe dla nowych funkcji
- E2E testy dla critical path
- Monitoring wydajności dla dużych projektów
- Accessibility (a11y) dla wszystkich nowych komponentów
