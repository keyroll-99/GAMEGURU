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

## ✅ Faza 2: Ulepszenie Drag & Drop (UKOŃCZONA)

### Zaimplementowano:

#### 2.1 Wizualna informacja zwrotna
- [x] **Podświetlanie celów upuszczenia**
  - Węzeł nad którym przeciągamy się podświetla
  - Zielony = można upuścić, czerwony = nie można (circular reference, same parent)
  
- [x] **Widmo przeciąganego elementu**
  - Półprzezroczysty podgląd podczas przeciągania (opacity 0.5)
  - Kursor wskazuje akcję (grabbing)

#### 2.2 Lepsza detekcja upuszczenia
- [x] **Większe strefy upuszczenia**
  - Zwiększono próg z 100px do 150px
  - Łatwiej trafić w cel

#### 2.3 Optymalizacja wydajności
- [x] **Throttling obliczeń**
  - RequestAnimationFrame throttling (~60fps)
  - Anulowanie poprzednich requestów przed kolejnymi
  
- [x] **Płynniejsze animacje**
  - Dodano transitions CSS
  - Smooth scale i color transitions dla drop targets

---

## 🔄 Faza 3: Widok Tablicy (Kanban) (W TRAKCIE)

### Zaimplementowano:

#### 3.1 Nowe komponenty
- [x] **BoardView.vue** - Główny widok tablicy Kanban
- [x] **BoardColumn.vue** - Kolumna statusu (TODO, W TRAKCIE, GOTOWE)
- [x] **BoardCard.vue** - Karta zadania

#### 3.2 Funkcjonalność
- [x] **Kolumny wg statusu**
  - Automatyczne grupowanie węzłów po statusie
  - TODO | W TRAKCIE | GOTOWE
  
- [x] **Drag & drop między kolumnami**
  - Przeciąganie karty zmienia status
  - Płynne animacje

- [x] **Przełącznik widoku**
  - Przycisk Mind Map / Tablica
  - Zapamiętanie preferencji użytkownika

#### 3.3 Zarządzanie stanem
- [x] Dodać `viewMode` do store (mindmap / board)
- [x] Zapisywać preferowany widok w UserViewState
- [x] Przywracać ostatnio używany widok

### Do zrobienia:
- [x] **BoardFilters.vue** - Filtry (po osobie, typie, itp.)
- [ ] **Szybkie akcje** (podstawowe)

---

## 🔄 Faza 4: Wydajność i UX

### Zaimplementowano:

#### 4.1 Skróty klawiszowe
- [x] `+/-` - Zoom in/out
- [x] `F` - Dopasuj widok
- [x] `0` - Reset zoom do 100%
- [x] `E` - Rozwiń wszystko
- [x] `C` - Zwiń wszystko
- [x] `N` - Nowy węzeł

### Do zrobienia:

#### 4.1 Skróty klawiszowe (pozostałe)
- [ ] `Spacja + Przeciągnięcie` - Przesuwanie canvas
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

## 📊 Priorytet implementacji

### 🔴 Wysoki (Natychmiast)
1. ✅ Zapisywanie stanu widoku (ZROBIONE)
2. ✅ Lepsza wizualizacja drag & drop (ZROBIONE)
3. ✅ Implementacja widoku tablicy Kanban (ZROBIONE)
4. 🔄 Skróty klawiszowe (W TRAKCIE)
5. 🔄 Wyszukiwanie i filtrowanie (Dla tablicy zrobione)

### 🟡 Średni (Następny sprint)
1. ⏳ System cofnij/ponów
2. ⏳ Optymalizacja wydajności (wirtualne przewijanie)
3. ⏳ Szablony węzłów

---

## 🎯 Podsumowanie

### Co zostało naprawione:
✅ **Stan widoku zapisuje się automatycznie**
✅ **Drag & Drop** - Poprawiono wizualizację i wydajność
✅ **Widok Tablicy** - Zaimplementowano podstawowy widok Kanban

### Co jeszcze zostało do zrobienia:
1. **Filtry tablicy** - Możliwość filtrowania zadań
2. **Skróty klawiszowe** - Ułatwienie nawigacji
3. **Wyszukiwanie** - Szybkie znajdowanie zadań

### Następne kroki:
1. Dodać filtry do widoku tablicy
2. Dodać skróty klawiszowe do widoku mapy
3. Dodać pasek wyszukiwania
