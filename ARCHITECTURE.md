# PlantHelper — Mapa do Código

Guia rápido para localizar *onde* cada coisa acontece. Sem teoria, só caminhos.

---

## 1. Stack

- **Expo Router** (`app/`) → roteamento por arquivo.
- **Zustand** (`src/store/`) → estado global.
- **SQLite (expo-sqlite)** (`src/database/db.ts`) → persistência de plantas.
- **AsyncStorage** → flag `isPremium`.
- **Axios** (`src/api/axiosClient.ts`) → client configurado com `baseURL` + `Api-Key` da Plant.id.
- **Plant.id v3** → identificação + diagnóstico de saúde.

---

## 2. Árvore de diretórios relevante

```
app/
  _layout.tsx                    root: init DB, sync premium, <Toast/>
  paywall.tsx                    modal de assinatura (rota)
  (main)/
    _layout.tsx                  stack interno
    index.tsx                    Home (grid de plantas)
    plant/
      [id].tsx                   TELA DE DETALHES + bottom sheet da foto
  (identify)/
    _layout.tsx
    identify.tsx                 escolha câmera/galeria p/ identificar
    camera.tsx                   câmera custom
    setup.tsx                    confirma nome + data de rega, persiste

src/
  api/
    axiosClient.ts               plantIdApi → baseURL https://plant.id/api/v3
  services/
    plantService.ts              IDENTIFICAÇÃO + DIAGNÓSTICO (Plant.id)
    subscriptionService.ts       mock premium (AsyncStorage)
    authService.ts               mock auth (placeholder Supabase)
  store/
    usePlantStore.ts             plants, isPremium, actions
  database/
    db.ts                        schema, migrations, CRUD
  components/
    PlantCard.tsx                card da grid
    PremiumBanner.tsx            banner gradient esmeralda
    PaywallModal.tsx             conteúdo do modal de paywall
    HealthResultCard.tsx         UI do resultado do diagnóstico
    ToastConfig.tsx              pill design dos toasts
  utils/
    dateUtils.ts
    plantUtils.ts                getPlantDisplayName (nickname fallback)
    shadows.ts                   shadowLayering.{cast,core}
    showToasts.ts                showSuccess/Error/Info/PremiumToast
    constants.ts
  types/
    plant.ts                     PlantRecord, HealthAssessmentResponse, ...
```

---

## 3. Fluxo de DIAGNÓSTICO (o que você está caçando)

Ordem real de execução quando o usuário aperta **"Diagnosticar agora"** na tela de detalhes:

1. `app/(main)/plant/[id].tsx` → `handleRequestDiagnosis`
   - Valida `isPremium`.
   - Abre o bottom sheet `PhotoSourceSheet`.

2. Usuário escolhe origem da foto:
   - `handleUseCurrentPhoto` → usa `plant.image_uri` do SQLite.
   - `handleNewPhoto` → `ImagePicker.launchCameraAsync` + persiste nova URI via `updatePlant(id, { imageUri })`.

3. `runDiagnosis(imageUri)` (ainda em `[id].tsx`)
   - Chama `checkHealth(plantId, imageUri)` do store.

4. `src/store/usePlantStore.ts` → `checkHealth`
   - Gate de premium.
   - Chama `plantService.assessPlantHealth(imageUri)`.
   - No sucesso: `saveHealthCheck(plantId, result)` → `loadPlants()`.

5. **`src/services/plantService.ts` → `assessPlantHealth`**  ← **AQUI A CHAMADA HTTP**
   - `convertToBase64(imageUri)` via `expo-file-system/legacy`.
   - `plantIdApi.post("/health_assessment", body, { params })`.
   - Retorna `response.data` tipado como `HealthAssessmentResponse`.

6. `src/database/db.ts` → `saveHealthCheck`
   - `UPDATE my_plants SET last_health_check_at=?, health_data=?`.
   - `health_data` gravado como JSON string.

7. De volta em `[id].tsx`, o `plants` do store re-hidrata e `HealthResultCard` renderiza a partir de `plant.health_data`.

### Endpoint exato

```
POST https://plant.id/api/v3/health_assessment
  ?language=pt
  &details=local_name,description,url,treatment,classification,common_names,cause

Headers:
  Api-Key: <EXPO_PUBLIC_PLANT_ID_API_KEY>
  Content-Type: application/json

Body:
  {
    "images": ["data:image/jpeg;base64,..."],
    "health": "only",
    "similar_images": true
  }
```

### Onde ver a response

- **Função que recebe o JSON da API**:
  `src/services/plantService.ts` → `assessPlantHealth` → variável `response.data`.
- **Onde fica persistido**:
  SQLite `my_plants.health_data` (coluna TEXT com JSON).
- **Onde é lido de volta**:
  `src/database/db.ts` → `hydratePlant` → `JSON.parse(row.health_data)` validado por `isValidHealthAssessment`.
- **Onde é renderizado**:
  `src/components/HealthResultCard.tsx` (prop `response`).

### Tipos

`src/types/plant.ts`:
- `HealthAssessmentResponse` → `{ result, status }`
- `HealthAssessmentResult` → `{ is_healthy, disease: { suggestions }, is_plant }`
- `DiseaseSuggestion` → `{ id, name, probability, details: { local_name, description, treatment, cause, url, ... } }`
- `DiseaseTreatment` → `{ biological?, prevention?, chemical? }`

---

## 4. Fluxo de IDENTIFICAÇÃO (para referência)

1. `app/(identify)/identify.tsx` → câmera ou galeria.
2. `useIdentifyPlant` (hook em `src/hooks/useIdentifyPlant.ts`) dispara `plantService.identifyPlant`.
3. `plantService.identifyPlant` → `POST /identification` na Plant.id v3.
4. Rota navega para `setup.tsx` com `identifiedPlant` + `imageUri`.
5. `setup.tsx` → `addPlant(...)` → `insertPlant` no SQLite (guarda `image_uri`).

---

## 5. Premium (RevenueCat)

Fonte única da verdade: **RevenueCat** (`react-native-purchases` v10). O mock em
AsyncStorage foi removido.

- `src/services/subscriptionService.ts` → `checkSubscription` (`Purchases.getCustomerInfo`), `purchasePackage` (`Purchases.getOfferings` + `Purchases.purchasePackage` do slot `monthly`/`$rc_monthly`), `restorePurchases` (`Purchases.restorePurchases`). Cancelamento do usuário (`userCancelled`) é tratado silenciosamente.
- Entitlement ID esperado no dashboard: `"PlantHelper Pro"` (constante `PREMIUM_ENTITLEMENT_ID`).
- `app/_layout.tsx` → `Purchases.configure({ apiKey })` no boot (chave por plataforma vinda de `EXPO_PUBLIC_REVENUECAT_APPLE_KEY` / `_GOOGLE_KEY`) e registra `addCustomerInfoUpdateListener` que chama `setPremium` no store a cada mudança (compra, renovação, refund, expiração, restore).
- `usePlantStore.setPremium(value)` é um setter puro — só mexe no estado, nunca persiste localmente.
- **Identidade**: `src/hooks/useAuth.ts` chama `signInAnonymously` no Supabase quando não há sessão, e repassa o `user.id` via `Purchases.logIn`. `authService.signIn/signUp` também chamam `Purchases.logIn` após sucesso; `signOut` chama `Purchases.logOut`. Isso garante UUID estável no RC desde o primeiro boot.
- **Pré-requisitos**: (1) Anonymous Sign-Ins habilitado em Supabase → Auth → Providers; (2) produtos/offering/entitlement `"PlantHelper Pro"` configurados no dashboard RevenueCat; (3) build custom (Expo Dev Client + EAS) — o SDK tem código nativo e não roda em Expo Go em modo real (Expo Go cai em *Preview API Mode* automático).

---

## 6. Onde toasts são mostrados

- Config visual: `src/components/ToastConfig.tsx` (pill).
- Helpers: `src/utils/showToasts.ts` (`customSuccess | customError | customInfo | customPremium`).
- Host: `<Toast />` em `app/_layout.tsx`, fora do `<Stack/>`, para renderizar sobre modais.

---

## 7. Schema do SQLite (`my_plants`)

| coluna                 | tipo     | notas                                 |
|------------------------|----------|---------------------------------------|
| id                     | INTEGER  | PK autoincrement                      |
| nickname               | TEXT     | nullable                              |
| original_name          | TEXT     | nome vindo da Plant.id                |
| scientific_name        | TEXT     |                                       |
| watering_freq_days     | INTEGER  |                                       |
| last_watered_at        | TEXT     | ISO                                   |
| next_watering_at       | TEXT     | ISO                                   |
| image_uri              | TEXT     | última foto da planta                 |
| last_health_check_at   | TEXT     | ISO, null até o 1º diagnóstico        |
| health_data            | TEXT     | JSON de `HealthAssessmentResponse`    |

Migrations idempotentes ficam em `src/database/db.ts` → `runMigrations`.
