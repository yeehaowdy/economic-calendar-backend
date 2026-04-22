# INSIGHT – Szoftver Dokumentáció

**Dátum:** 2026.04.

**Fejlesztők:** Terenyi Botond, Tarjányi Levente, Papp Roland

**Admin belépés**: 

**Email**: admin@insight.com

**Jelszó**: admin1

## 1. A szoftver célja

Az **INSIGHT** egy pénzügyi információs platform, amelynek célja, hogy a felhasználók egyetlen, egységes felületen keresztül férjenek hozzá a pénzügyi piacok legfontosabb adataihoz. A platform három fő adattípusra épül:

- **Gazdasági naptár:** globális, magas hatású gazdasági események megjelenítése, valuta és befolyás szerinti szűréssel.
- **Élő piaci adatok:** részvények, indexek és kriptovaluták valós idejű árfolyamainak megjelenítése grafikonnal.
- **Piaci hírek:** ismert hírportálokról származó cikkek a gazdasági világból.

A platform célközönsége befektetők, kereskedők, és a pénzügyi dolgozók. Az alkalmazás minimalista design elvek mentén készült, az egyértelműséget és az adatközpontú megjelenítést helyezve előtérbe.

---

## 2. Rendszerarchitektúra

Az INSIGHT külön front- és backendből álló weboldal.

```
┌─────────────────────────────────────────────┐
│                 FELHASZNÁLÓ                 │
│                  (Böngésző)                 │
└───────────────────┬─────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────┐
│            FRONTEND (Netlify)               │
│     React + Vite SPA                        │
│     insight-web.netlify.app                 │
└───────────────────┬─────────────────────────┘
                    │ REST API (HTTP/JSON)
┌───────────────────▼─────────────────────────┐
│            BACKEND (Vercel)                 │
│     Node.js + Express szerver               │
│     economic-calendar-backend.vercel.app    │
└───────────────────┬─────────────────────────┘
                    │ Firebase SDK
┌───────────────────▼─────────────────────────┐
│          FIREBASE (Google Cloud)            │
│  Firestore (adatbázis) + Auth + Storage     │
└─────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│         KÜLSŐ API-k                         │
│  pl: .Finnhub.io (élő árfolyamadatok)       │
└─────────────────────────────────────────────┘
```

**Kommunikációs minta:** A frontend közvetlenül hívja a backend REST API-ját az alkalmazás saját adataihoz (naptár, hírek), míg a piaci árfolyamadatokat a frontend oldal közvetlenül kéri le.

---

## 3. Komponensek technikai leírása

### 3.1 Backend

**Technológiai stack:**

| Komponens | Technológia |
| --- | --- |
| Futtatókörnyezet | Node.js |
| Webszerver keretrendszer | Express |
| Adatbázis kliens | Firebase SDK (Firestore) |
| CORS kezelés | cors |
| Környezeti változók | dotenv |
| Tesztelési keretrendszer | Vitest + Supertest |
| Deploy platform | Vercel |

**Belépési pont:** `index.js`

A backend egy Express.js alapú REST API szerver, amely Firebase Firestore adatbázisból szolgálja ki az adatokat. A szerver ES Module szintaxist (`import`/`export`) használ.

**CORS konfiguráció:** A szerver csak az alábbi originekről fogad kéréseket:

- `http://localhost:5173` (fejlesztői környezet)
- `https://insight-web.netlify.app` (produkciós frontend)

**Adatbázis kapcsolat:** A Firestore kapcsolat `experimentalForceLongPolling: true` opcióval inicializálódik, amely a Vercel serverless környezetben biztosítja a stabil WebSocket-mentes kommunikációt.

**Tesztelés:** Az `index.test.js` fájl Vitest + Supertest segítségével teszteli az összes API végpontot. A Firebase modulok mockolva vannak (`vi.mock`), így a tesztek valódi adatbázis-kapcsolat nélkül futnak. Összesen 22 teszteset fedi le a sikeres és hibás útvonalakat egyaránt.

---

### 3.2 Frontend ([https://github.com/yeehaowdy/economic-calendar-frontend.git](https://github.com/yeehaowdy/economic-calendar-frontend.git))

**Technológiai stack:**

| Komponens | Technológia |
| --- | --- |
| UI keretrendszer | React 18 |
| Build eszköz | Vite |
| Routing | React Router DOM v6 |
| Adatbázis / Auth kliens | Firebase SDK (Auth, Firestore, Storage) |
| Diagramkönyvtár | Recharts |
| Deploy platform | Netlify |
| Tesztelési keretrendszer | Vitest |

**Belépési pont:** `App.jsx`

A frontend egy React Single Page Application (SPA), amely React Router DOM segítségével kezeli a kliensoldali útvonalakat. Az alkalmazás komponensalapú felépítést követ.

### Oldalak és útvonalak

| Útvonal | Komponens | Leírás | Képernyőkép | Képernyőkép (mobil verzió) |
| --- | --- | --- | --- | --- |
| `/` | `Home` | Főoldal, funkcióáttekintő | [https://ibb.co/LhzSwcj5](https://ibb.co/LhzSwcj5) | [https://ibb.co/8Dsg04Cr](https://ibb.co/8Dsg04Cr) |
| `/login` | `Login` | Bejelentkezés e-mail/jelszóval | [https://ibb.co/fVtVvcwK](https://ibb.co/fVtVvcwK) | [https://ibb.co/8WD8Vh0](https://ibb.co/8WD8Vh0) |
| `/register` | `Register` | Regisztráció, felhasználói fiók létrehozása | [https://ibb.co/W4hsBc0p](https://ibb.co/W4hsBc0p) | [https://ibb.co/5XH61zXg](https://ibb.co/5XH61zXg) |
| `/calendar` | `Calendar` | Gazdasági naptár | [https://ibb.co/S44mwj6Y](https://ibb.co/S44mwj6Y) | [https://ibb.co/9HnBBfMV](https://ibb.co/9HnBBfMV) |
| `/news` | `News` | Gazdasági hírek | [https://ibb.co/LDx8wFG7](https://ibb.co/LDx8wFG7) | [https://ibb.co/LXc6qbPQ](https://ibb.co/LXc6qbPQ) |
| `/markets` | `Markets` | Élő piaci adatok | [https://ibb.co/JF7h0Htg](https://ibb.co/JF7h0Htg) | [https://ibb.co/9mYMdcZ5](https://ibb.co/9mYMdcZ5) |
| `/profile` | `Profile` | Felhasználói profil szerkesztése | [https://ibb.co/Z7CWF5B](https://ibb.co/Z7CWF5B) | [https://ibb.co/RGFHH2Fg](https://ibb.co/RGFHH2Fg) |
| `/admin_panel` | `AdminPanel` | Admin vezérlőpult | [https://ibb.co/7JLHHhp5](https://ibb.co/7JLHHhp5) [https://ibb.co/gMyBdJdG](https://ibb.co/gMyBdJdG) [https://ibb.co/hJTNqx9K](https://ibb.co/hJTNqx9K) [https://ibb.co/hJQqnTJt](https://ibb.co/hJQqnTJt) | [https://ibb.co/0VY81xWy](https://ibb.co/0VY81xWy) [https://ibb.co/G3bVdZrM](https://ibb.co/G3bVdZrM) [https://ibb.co/nMd0qf3Q](https://ibb.co/nMd0qf3Q) [https://ibb.co/6RJHHFjq](https://ibb.co/6RJHHFjq) [https://ibb.co/q396JKGS](https://ibb.co/q396JKGS) |

### Komponensek részletes leírása

**`Navbar.jsx`**
Hamburger-menü alapú navigációs sáv, amely Firebase `onAuthStateChanged` figyelővel valós időben követi a bejelentkezési állapotot. Admin szerepkör esetén megjeleníti az Admin Panel hivatkozást. Kijelentkezéskor a `/login` oldalra irányít.

**`Home.jsx`**
A platform nyitóoldala, amely hero szekcióból, funkcióáttekintőből, és információs kártyákból áll. Bejelentkezett felhasználó esetén személyre szabott üzenetet és profilra mutató linket jelenít meg.

**`Calendar.jsx`**
Gazdasági naptár komponens. Az adat a backend `/api/calendar` végpontjáról töltődik be. Főbb funkciók: napválasztó navigáció (előző nap/mai nap/következő nap), valuta- és befolyás-szűrők, időzóna-váltó, élő óra megjelenítése. Az események tartalmazzák az aktuális, előrejelzett és előző értékeket, valamint a befolyás színjelzését (piros - magas/sárga - közepes/zöld - alacsony).

**`News.jsx`**
Hír komponens. A cikkek az `/api/news?page=N&limit=12` végpontról töltődnek be. Az oldal tetején animált árfolyam-ticker fut, amely a `localStorage`-ból olvassa a korábban betöltött piaci adatokat. Minden hírkártyán megjelenik a forrás, dátum, devizacímke, rövid leírás és a cikkre mutató hivatkozás.

**`Markets.jsx`**
Élő piaci adat megjelenítő. A Finnhub.io API-tól lekéri 40+ részvény, index és kriptovaluta aktuális árfolyamát, napi magas/alacsony/nyitó értékeit. Az adatok 65 másodpercenként automatikusan frissülnek, és `localStorage`-ban kerülnek gyorsítótárazásra az azonnali megjelenítés érdekében. Minden kártyán mini vonaldiagram ( `LineChart`) jelzi a napi mozgásirányt. A kártyákra kattintva a TradingView megfelelő grafikonoldalát nyitja meg.

**`Login.jsx` / `Register.jsx`**
Firebase Authentication alapú hitelesítési oldalak. A `Login` `signInWithEmailAndPassword`, a `Register` `createUserWithEmailAndPassword` metódust használ. Regisztrációkor a felhasználói rekord a Firestore `users` kollekcióba is mentésre kerül `role: "user"` értékkel. Mindkét oldalon megvalósított a jelszó megjelenítés/elrejtés funkció.

**`Profile.jsx`**
Bejelentkezett felhasználó profilkezelő oldala. Lehetővé teszi a megjelenített név módosítását és profilkép feltöltését Firebase Storage-ba (`avatars/{uid}` útvonalon). A változtatások visszaíródnak a Firebase Auth felhasználói profiljába. Toast értesítési rendszer jelzi a sikeres/sikertelen műveleteket.

**`AdminPanel.jsx`**
Kétfüles adminisztrációs felület hírek és naptáresemények kezeléséhez. Az admin jogosultság Firebase Firestore `users/{uid}.role === 'admin'` feltétel alapján ellenőrzött. A komponens teljes CRUD műveletsort valósít meg a backend API-n keresztül. A lap tetejére gördüléssel (`window.scrollTo`) segíti a szerkesztési workflow-t.

**`AdminRoute.jsx`**
React Router wrapper komponens, amely védi az `/admin_panel` útvonalat. Nem admin vagy nem bejelentkezett felhasználót a főoldalra (`/`) irányít át. Betöltés közben „VERIFYING PERMISSIONS..." üzenetet jelenít meg.

---

## 4. Működés műszaki feltételei

### 4.1 Hardver- és szoftverkövetelmények

**Szerver (backend) – fejlesztési/önálló üzemeltetés esetén:**

| Követelmény | Minimum |
| --- | --- |
| Node.js | 18.x LTS vagy újabb |
| Operációs rendszer | macOS, Windows |
| Internetkapcsolat | Szükséges |

**Produkciós deploy:** A backend Vercel serverless platformon fut, így önálló szerver nem szükséges. A frontend Netlify-on van hostolva.

**Kliensoldali (böngésző) követelmények:**

| Követelmény | Részlet |
| --- | --- |
| Böngésző | Firefox, Edge, Safari |
| JavaScript | Engedélyezett |
| Internetkapcsolat | Szükséges |

---

### 4.2 Környezeti változók

**Backend (`.env` fájl):**

```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
PORT=3000
```

**Frontend (`.env` fájl):**

```
VITE_BACKEND_URL=https://economic-calendar-backend.vercel.app
VITE_FINNHUB_API_KEY=
```

---

### 4.3 Telepítés és indítás

**Backend:**

```bash
# 1. Függőségek telepítése
npm install

# 2. Környezeti változók beállítása
cp .env.example .env
# (szerkessze a .env fájlt a megfelelő értékekkel)

# 3. Fejlesztői indítás (automatikus újraindítással)
npm run dev

# 4. Produkciós indítás
npm start

# 5. Tesztek futtatása
npm test
```

**Frontend:**

```bash
# 1. Függőségek telepítése
npm install

# 2. Környezeti változók beállítása
# Hozzon létre .env fájlt a gyökérkönyvtárban

# 3. Fejlesztői szerver indítása
npm run dev
# Elérhető: http://localhost:5173

# 4. Produkciós build készítése
npm run build
```

---

## 5. A szoftver használata

### 5.1 Felhasználói szerepkörök

**Vendég felhasználó (nem bejelentkezett):**

- Megtekintheti a főoldalt, a gazdasági naptárat, a híroldalt és a piaci adatokat
- Nem férhet hozzá a profil oldalhoz és az admin panelhez

**Regisztrált felhasználó (`role: "user"`):**

- Minden vendég funkcióhoz hozzáférés
- Profiloldal: megjelenített név és profilkép módosítása

**Adminisztrátor (`role: "admin"`):**

- Minden felhasználói funkcióhoz hozzáférés
- Admin panel: hírek és naptáresemények létrehozása, szerkesztése, törlése

> Az admin szerepkör kiosztása kézileg történik a Firebase Firestore konzolban, a `users/{uid}` dokumentum `role` mezőjének `"admin"` értékre állításával.
> 

---

### 5.2 Főbb funkciók bemutatása

### Regisztráció és bejelentkezés

A `/register` oldalon a felhasználó megadja teljes nevét, e-mail címét és jelszavát. Sikeres regisztrációt követően automatikusan bejelentkezik és a főoldalra kerül. Meglévő fiókkal a `/login` oldalon lehet bejelentkezni.

### Gazdasági naptár használata

A `/calendar` oldalon az aznapi gazdasági események jelennek meg alapértelmezetten. A felhasználó a navigációs gombokkal (Previous / Today / Next) böngészhet a napok között. A jobb felső sarokban lévő Filters gombbal szűrők nyithatók meg, amelyekkel deviza (pl. USD, EUR, GBP) és befolyás (High / Medium / Low) szerint lehet szűkíteni a listát. Az időzóna-választóval az eseményidőpontok a választott időre konvertálhatók.

### Piaci adatok megtekintése

A `/markets` oldalon kártyás nézetben jelennek meg az árfolyamok. A keresőmezőbe szimbólum vagy név begépelésével szűrhető a lista. Egy kártyára kattintva a TradingView részletes grafikon oldala nyílik meg. Az adatok 65 másodpercenként automatikusan frissülnek.

### Hírek olvasása

A `/news` oldalon legújabb gazdasági cikkek jelennek meg, oldalanként 12 cikkel. Az oldal alján lévő lapozó gombokkal (Previous / Next) lehet navigálni. Az oldal tetején futó ticker a betöltött árfolyamadatokat jeleníti meg animáltan. A „Read article" linkre kattintva az eredeti forrás oldala nyílik meg.

### Admin panel használata

Az `/admin_panel` oldalon (csak admin felhasználóknak) két fül érhető el:

- **NEWS MANAGEMENT:** Új cikk hozzáadása (cím, forrás, leírás, link, kép URL, devizacímke, dátum mezőkkel). Meglévő cikk szerkesztése az „Edit" gombra kattintva (az adatok betöltődnek az űrlapba), majd az „Update" gombbal menthető. Cikk törlése a „Delete" gombbal (megerősítő párbeszéddel).
- **CALENDAR MANAGEMENT:** Új gazdasági esemény felvitele (elnevezés, deviza, dátum, időpont, aktuális/előrejelzett/előző értékek, hatásszint). A szerkesztés és törlés ugyanúgy működik, mint a hírkezelésnél.

---

## 6. API végpontok referencia ([https://github.com/yeehaowdy/economic-calendar-backend.git](https://github.com/yeehaowdy/economic-calendar-backend.git))

Az alábbiakban a backend által nyújtott REST API végpontok összefoglalása látható.

**Alap URL (produkció):** `https://economic-calendar-backend.vercel.app`

### Gazdasági naptár (`/api/calendar`)

| Metódus | Végpont | Leírás | Kérés törzse |
| --- | --- | --- | --- |
| GET | `/api/calendar` | Összes naptáresemény lekérése dátum szerint rendezve | — |
| POST | `/api/calendar` | Új esemény létrehozása | JSON: esemény adatai |
| PUT | `/api/calendar/:id` | Meglévő esemény frissítése | JSON: módosított mezők |
| DELETE | `/api/calendar/:id` | Esemény törlése | — |

**Esemény adatstruktúra:**

```json
{
  "title": "CPI Data",
  "country": "USD",
  "impact": "High",
  "actual": "3.2%",
  "forecast": "3.1%",
  "previous": "3.0%",
  "date": "2026-03-26T14:30:00.000Z",
  "time": "14:30"
}
```

### Hírek (`/api/news`)

| Metódus | Végpont | Leírás | Paraméterek |
| --- | --- | --- | --- |
| GET | `/api/news` | Hírlistát ad vissza | `?page=1&limit=12` |
| GET | `/api/news/admin` | Összes hír (admin, rendezés nélkül) | — |
| POST | `/api/news` | Új hír létrehozása | JSON: hír adatai |
| PUT | `/api/news/:id` | Meglévő hír frissítése | JSON: módosított mezők |
| DELETE | `/api/news/:id` | Hír törlése | — |

**Hír adatstruktúra:**

```json
{
  "title": "Fed Holds Rates Steady",
  "description": "The Federal Reserve decided...",
  "source": "Bloomberg",
  "link": "https://bloomberg.com/...",
  "image": "https://cdn.example.com/image.jpg",
  "relatedCurrency": "USD",
  "pubDate": "2026-03-26"
}
```

**Paginált válasz formátuma (`GET /api/news`):**

```json
{
  "data": [ /* hírek tömbje */ ],
  "totalPages": 5,
  "currentPage": 1
}
```

### Hibaválaszok

Minden végpont egységes hibaformátumot használ szerverhiba esetén:

```json
{
  "error": "Server error",
  "details": "Firestore connection error"
}
```

HTTP státuszkódok: `200 OK`, `201 Created`, `500 Internal Server Error`

---

## 7. Frontend komponenstesztek ([https://github.com/yeehaowdy/economic-calendar-frontend.git](https://github.com/yeehaowdy/economic-calendar-frontend.git))

A frontend tesztelése **Vitest** + **React Testing Library** + **@testing-library/user-event** kombinációval történik. A tesztek a `components_test.jsx` fájlban találhatók, és teljes Firebase-, Router- és fetch-mockolással futnak – valódi hálózati kapcsolat nélkül.

**Tesztelési segédeszközök:**

| Eszköz | Szerepe |
| --- | --- |
| Vitest | Tesztfuttató keretrendszer |
| React Testing Library | Komponens renderelés és DOM assertiók |
| @testing-library/user-event | Felhasználói interakciók szimulálása |
| MemoryRouter | React Router izolált tesztkörnyezet |
| vi.mock | Firebase, React Router mockolása |

Minden tesztcsoport `beforeEach`-ben törli a mock állapotokat (`vi.clearAllMocks()`), biztosítva az egymástól független lefutást.

---

### AdminRoute (4 teszteset)

Az `AdminRoute` wrapper komponens jogosultságkezelési logikáját ellenőrzi. Tesztelt esetek: betöltési állapot megjelenítése (`VERIFYING PERMISSIONS...`), admin szerepkörű felhasználó esetén a védett tartalom renderelése, nem admin felhasználó főoldalra (`/`) irányítása, valamint nem bejelentkezett felhasználó átirányítása.

### Login (5 teszteset)

A `Login` komponens megjelenését és működését ellenőrzi. Tesztelt esetek: az e-mail és jelszó mezők, valamint a „Sign In" gomb megjelenése; sikeres bejelentkezéskor hibaüzenet hiánya; hibás hitelesítő adatok esetén `"Invalid email or password"` szöveg megjelenése; jelszó láthatóság váltó (`type="password"` ↔ `type="text"`); a regisztrációra mutató link jelenléte.

### Register (4 teszteset)

A `Register` komponens megjelenését és regisztrációs folyamatát ellenőrzi. Tesztelt esetek: a három beviteli mező (Full Name, Email, Password) megjelenése; sikeres regisztráció esetén a `createUserWithEmailAndPassword` Firebase függvény helyes paraméterekkel való meghívása; gyenge jelszó esetén Firebase hibaüzenet megjelenítése; a bejelentkezésre mutató link jelenléte.

### Home (4 teszteset)

A `Home` főoldal dinamikus tartalmait ellenőrzi. Tesztelt esetek: nem bejelentkezett felhasználónak `"JOIN THE NETWORK"` gomb; bejelentkezett felhasználónak `"GO TO PROFILE"` gomb; a három funkcióismertető kártya (Economic Calendar, Live Markets, Market News) megjelenése; a hero szekció főcímének renderelése.

### Calendar – szűrőlogika (8 teszteset, unit)

A `Calendar` komponens szűrőlogikáját unit tesztként ellenőrzi, DOM renderelés nélkül. Tesztelt esetek: dátum szerinti szűrés pontossága; devizaszűrő (pl. csak EUR események); befolyás-szűrő (pl. csak High); kombinált szűrő (USD + High); üres nap esetén üres eredményhalmaz; `handleToggleFilter` viselkedése – `All` kiválasztásakor a többi szűrő törlése, illetve az utolsó elem eltávolításakor automatikus visszaváltás `All`-ra.

### News (6 teszteset)

A `News` oldalkomponens megjelenítési és lapozási logikáját ellenőrzi, mockolva a `fetch` hívásokat. Tesztelt esetek: hírek megjelenése sikeres API válasz után; `"1 / 3"` oldalszám-jelző; PREVIOUS gomb letiltottsága az első oldalon; NEXT gomb elérhetősége több oldal esetén; üres hírlistára `"No market news found"` üzenet; hálózati hiba esetén a betöltő spinner eltűnése.

### Markets – keresés és cache (6 teszteset, unit)

Két unit tesztcsoportban ellenőrzi a `Markets` komponens keresési és gyorsítótárazási logikáját. Keresés: üres feltételre minden elem visszaadása; részleges, kis-nagybetű független egyezés; nem létező szimbólumra üres eredmény; kriptovaluta szimbólum kereshetősége. Cache: `localStorage`-ban tárolt adatok betöltése induláskor; üres cache esetén üres tömb inicializálása.

### AdminPanel (4 teszteset)

Az `AdminPanel` adminisztrációs felület működését ellenőrzi admin jogosultságú felhasználóval. Tesztelt esetek: admin felhasználónak a dashboard megjelenítése; nem admin felhasználónak `"Access Denied"` üzenet; `CALENDAR MANAGEMENT` fülre váltáskor a naptáros form megjelenése; hír beküldésekor a `fetch` API hívás megtörténte.

---

**Összesített tesztlefedettség:**

| Tesztcsoport | Tesztek száma | Típus |
| --- | --- | --- |
| AdminRoute | 4 | Integrációs |
| Login | 5 | Integrációs |
| Register | 4 | Integrációs |
| Home | 4 | Integrációs |
| Calendar – szűrőlogika | 8 | Unit |
| News | 6 | Integrációs |
| Markets – keresés | 4 | Unit |
| Markets – cache | 2 | Unit |
| AdminPanel | 4 | Integrációs |
| **Összesen** | **41** | — |

## 8. Munkamegosztás- és fejlesztési folyamat

### Frontend fejlesztési lépései

| Leírás | Képernyőképek |
| --- | --- |
| Frontend contribution GitHubon | [https://ibb.co/whGPX2cq](https://ibb.co/whGPX2cq) |
| Frontend GitGraph, időrendi sorrendben csökkenő | [https://ibb.co/Q7YksV0R](https://ibb.co/Q7YksV0R) [https://ibb.co/Fj1ScPN](https://ibb.co/Fj1ScPN) [https://ibb.co/fYtTMbCs](https://ibb.co/fYtTMbCs) [https://ibb.co/wh2W5qKh](https://ibb.co/wh2W5qKh) |

### Backend fejlesztési lépései

| Leírás | Képernyőképek |
| --- | --- |
| Backend contribution GitHubon | [https://ibb.co/JRVPG9Kg](https://ibb.co/JRVPG9Kg) |
| Backend GitGraph, időrendi sorrendben csökkenő | [https://ibb.co/3mbCFmdB](https://ibb.co/3mbCFmdB) [https://ibb.co/39zd8nrw](https://ibb.co/39zd8nrw) |

*Dokumentáció készült: 2026 | INSIGHT Team*