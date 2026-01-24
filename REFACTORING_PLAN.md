# Refactoring Plan: Modrinth Embeds Project Structure

## Executive Summary

The CurseForge addition introduced several structural inconsistencies that deviate from the clean patterns established for Modrinth. This document outlines a comprehensive refactoring plan to create a unified, maintainable architecture that can easily support additional platforms in the future.

---

## Current State Analysis

### Existing Modrinth Structure (Well-Designed)
```
src/
├── routes/
│   ├── userRoutes.js        (15 lines)
│   ├── projectRoutes.js     (15 lines)
│   ├── organizationRoutes.js (15 lines)
│   ├── collectionRoutes.js  (15 lines)
│   └── metaRoutes.js        (12 lines - NOW contains CurseForge!)
├── controllers/
│   ├── cardController.js    (121 lines - unified, config-driven)
│   └── badgeController.js   (131 lines - unified, config-driven)
├── services/
│   └── modrinthClient.js    (handles V2 & V3 API)
├── generators/
│   ├── badge.js             (43 lines - reusable badge generator)
│   └── [entity]Card.js      (one per entity type)
```

### Added CurseForge Structure (Inconsistent)
```
src/
├── routes/
│   └── curseforgeRoutes.js  (31 lines - ALL routes in one file)
├── controllers/
│   └── curseforgeController.js (276 lines - duplicated logic)
├── services/
│   └── curseforgeClient.js  (224 lines)
└── generators/
    └── curseforgeCard.js    (CurseForge-specific card)
```

---

## Key Issues Identified

### 1. Badge Generation Duplication (HIGH PRIORITY)
**Problem:** CurseForge duplicates the entire badge generation logic inline in the controller instead of using the existing `generators/badge.js`.

**Evidence:**
- `src/controllers/curseforgeController.js:20-63` - Contains `generateCurseforgeBadge()` function (44 lines)
- `src/generators/badge.js` - Contains `generateBadge()` function for Modrinth (43 lines)
- Both functions do nearly identical things, just with different icons

**Impact:** Code duplication, maintenance burden, styling inconsistencies

### 2. Controller Pattern Inconsistency (HIGH PRIORITY)
**Problem:** Modrinth uses a configuration-driven unified controller, but CurseForge duplicates the request handling logic.

**Evidence:**
- `cardController.js` has `CARD_CONFIGS` and a single `handleCardRequest()` function (35 lines)
- `badgeController.js` has `BADGE_CONFIGS` and a single `handleBadgeRequest()` function (70 lines)
- `curseforgeController.js` duplicates similar logic but without the config abstraction

**Impact:** Adding new entities or platforms requires writing more boilerplate

### 3. Meta Route Pollution (MEDIUM PRIORITY)
**Problem:** CurseForge-specific meta route was added to `metaRoutes.js` instead of being in CurseForge routes.

**Evidence:**
- `src/routes/metaRoutes.js:8-9` - Contains `getCfMeta` route handler
- `src/controllers/metaController.js:51-80` - Contains `getCfMeta()` function
- This file was meant for generic meta endpoints, not platform-specific ones

**Impact:** Violates separation of concerns, makes adding more platforms awkward

### 4. Route Organization Confusion (MEDIUM PRIORITY)
**Problem:** Inconsistent route file organization patterns.

**Evidence:**
- Modrinth: One file per entity type (user, project, org, collection) - very granular
- CurseForge: One file for all CurseForge routes
- Both approaches work, but inconsistency is confusing

**Impact:** Unclear pattern for adding new platforms or entities

### 5. API Configuration Check Duplication (MEDIUM PRIORITY)
**Problem:** API key configuration check is repeated in every CurseForge controller function.

**Evidence:**
- `curseforgeController.js:74-80` - Configuration check in badge handler
- `curseforgeController.js:161-167` - Same check in slug lookup
- `curseforgeController.js:196-202` - Same check in mod card handler
- Modrinth doesn't need this as it has no required API key

**Impact:** Code repetition, harder to modify error handling

### 6. Cache Key Inconsistency (LOW PRIORITY)
**Problem:** Different cache key patterns between platforms.

**Evidence:**
- Modrinth badges: `badge:${entityType}:${identifier}`
- CurseForge badges: `cf:mod:${modId}`
- Modrinth cards: `${cardType}:${identifier}`
- CurseForge cards: `cf:mod:card:${modId}`

**Impact:** Inconsistent cache management, harder to debug

### 7. Platform Icon Management (LOW PRIORITY)
**Problem:** No centralized way to manage platform icons and branding.

**Evidence:**
- Modrinth icon is in `ICONS.modrinth` (in icons.js)
- CurseForge icon is hardcoded inline in `curseforgeController.js:36-38`
- Badge generator only accepts Modrinth icon

**Impact:** Adding platforms requires duplicating badge code

---

## Proposed Refactoring

### Phase 1: Unify Badge Generation (HIGH IMPACT, LOW RISK)

#### Goal: Create a single, reusable badge generator for all platforms.

#### Changes:

1. **Create `src/constants/platforms.js`**
   ```javascript
   export const PLATFORMS = {
       modrinth: {
           id: 'modrinth',
           name: 'Modrinth',
           defaultColor: '#1bd96a',
           icon: (color) => ICONS.modrinth(color)
       },
       curseforge: {
           id: 'curseforge',
           name: 'CurseForge',
           defaultColor: '#F16436',
           icon: (color) => `/* CurseForge SVG path */`
       }
   };
   ```

2. **Refactor `src/generators/badge.js`**
   - Add `platform` parameter
   - Use platform config for icon and default color
   - Move CurseForge icon inline code here

3. **Update `src/controllers/badgeController.js`**
   - Add CurseForge to `BADGE_CONFIGS`
   - Create platform-specific configs
   - Add CurseForge badge handlers

4. **Delete `generateCurseforgeBadge()` from curseforgeController.js**
   - Remove lines 20-63
   - Update badge handlers to use unified generator

#### Files Modified:
- `src/constants/platforms.js` (NEW)
- `src/constants/icons.js` (add CurseForge icon)
- `src/generators/badge.js` (add platform parameter)
- `src/controllers/badgeController.js` (add CurseForge configs)
- `src/controllers/curseforgeController.js` (remove duplicate badge code)

#### Expected Reduction: ~50 lines of duplicated code

---

### Phase 2: Unify Card Controller Pattern (HIGH IMPACT, MEDIUM RISK)

#### Goal: Apply the same configuration-driven pattern to CurseForge cards.

#### Changes:

1. **Update `src/controllers/cardController.js`**
   - Add CurseForge to `CARD_CONFIGS`
   - Add platform parameter support
   - Extract common error handling

2. **Move CurseForge card logic to use unified handler**
   - Refactor `getCfMod` to use `handleCardRequest`

3. **Create base controller utilities (optional)**
   - Extract `handleCardRequest` and `handleBadgeRequest` to reusable functions
   - Consider `src/controllers/base/handlers.js`

#### Files Modified:
- `src/controllers/cardController.js` (add CurseForge config)
- `src/controllers/curseforgeController.js` (simplify to use pattern)
- `src/controllers/base/handlers.js` (NEW - optional)

#### Expected Reduction: ~80 lines of duplicated request handling code

---

### Phase 3: Reorganize Routes (MEDIUM IMPACT, LOW RISK)

#### Goal: Establish clear, consistent route organization.

#### Option A: Platform-based routes (RECOMMENDED)
```
src/routes/
├── modrinth/
│   ├── userRoutes.js
│   ├── projectRoutes.js
│   ├── organizationRoutes.js
│   └── collectionRoutes.js
├── curseforge/
│   └── index.js
└── metaRoutes.js (generic only)
```

#### Option B: Feature-based routes (ALTERNATIVE)
```
src/routes/
├── cardRoutes.js        (all card routes)
├── badgeRoutes.js       (all badge routes)
├── lookupRoutes.js      (slug lookup endpoints)
└── metaRoutes.js
```

#### Changes:
1. Create `src/routes/modrinth/` directory
2. Move existing Modrinth routes into it
3. Create `src/routes/curseforge/` directory
4. Move CurseForge routes into it
5. Remove CurseForge meta route from `metaRoutes.js`
6. Update `src/server.js` route imports

#### Files Modified:
- `src/routes/modrinth/*.js` (MOVED)
- `src/routes/curseforge/*.js` (MOVED/CREATED)
- `src/routes/metaRoutes.js` (remove CurseForge route)
- `src/server.js` (update imports)
- `src/controllers/metaController.js` (remove getCfMeta, move to curseforge)

---

### Phase 4: Extract API Client Base Class (MEDIUM IMPACT, MEDIUM RISK)

#### Goal: Reduce duplication between API clients.

#### Changes:

1. **Create `src/services/baseClient.js`**
   ```javascript
   export class BasePlatformClient {
       constructor(config) {
           this.baseUrl = config.baseUrl;
           this.apiKey = config.apiKey;
           this.platform = config.platform;
       }

       async fetch(endpoint, options) {
           // Unified fetch logic with error handling
       }

       isConfigured() {
           // Check if API key is set
       }

       getCacheKey(type, id) {
           // Unified cache key generation
       }
   }
   ```

2. **Refactor `modrinthClient.js` and `curseforgeClient.js`**
   - Extend base class
   - Keep platform-specific methods

#### Files Modified:
- `src/services/baseClient.js` (NEW)
- `src/services/modrinthClient.js` (extend base)
- `src/services/curseforgeClient.js` (extend base)

#### Expected Reduction: ~40 lines of duplicated fetch/cache logic

---

### Phase 5: Standardize Cache Keys (LOW IMPACT, LOW RISK)

#### Goal: Create consistent cache key patterns.

#### Proposed Pattern:
```javascript
// Format: ${platform}:${entityType}:${id}:${suffix}
// Examples:
modrinth:user:geometrically
modrinth:user:geometrically:badge
modrinth:project:sodium
curseforge:mod:3915
curseforge:mod:3915:badge
curseforge:slug:geckolib
```

#### Changes:
1. Create `src/utils/cacheKeys.js` with factory functions
2. Update all cache key generation to use factory

---

### Phase 6: Add Platform-Specific Error Middleware (LOW IMPACT, LOW RISK)

#### Goal: Centralize API configuration checks.

#### Changes:

1. **Create `src/middleware/apiConfig.js`**
   ```javascript
   export const requireApiKey = (platform, client) => (req, res, next) => {
       if (!client.isConfigured()) {
           return res.status(500).json({
               error: `${platform} API key not configured`,
               message: `Set ${platform.toUpperCase()}_API_KEY environment variable`
           });
       }
       next();
   };
   ```

2. **Apply middleware to CurseForge routes**
   ```javascript
   router.get("/curseforge/lookup/:slug",
       requireApiKey("CurseForge", curseforgeClient),
       curseforgeController.getCfSlugLookup
   );
   ```

#### Files Modified:
- `src/middleware/apiConfig.js` (NEW)
- `src/routes/curseforge/index.js` (add middleware)

#### Expected Reduction: ~30 lines of repeated configuration checks

---

## Recommended Implementation Order

### Week 1: Low-Risk Foundation
1. Phase 6 - Add API config middleware (easiest, immediate cleanup)
2. Phase 5 - Standardize cache keys (low risk, improves observability)

### Week 2: Core Unification
3. Phase 1 - Unify badge generation (high impact, low risk)
4. Phase 3 - Reorganize routes (improves structure, low risk)

### Week 3: Advanced Refactoring
5. Phase 2 - Unify card controllers (requires careful testing)
6. Phase 4 - Extract base client class (optional, can defer)

---

## Alternative: Minimal Change Approach

If you want a smaller scope refactoring:

### Quick Wins (1-2 hours):
1. Move CurseForge icon from inline to `ICONS.curseforge`
2. Refactor badge generator to accept platform parameter
3. Update CurseForge to use unified badge generator
4. Move `getCfMeta` from metaController to curseforgeController

### Expected Result:
- Eliminates ~50 lines of code duplication
- Maintains existing structure
- Low risk, easy to test

---

## File Tree After Refactoring (Recommended Approach)

```
src/
├── constants/
│   ├── icons.js          (add CurseForge icon)
│   ├── platforms.js      (NEW: platform configs)
│   └── loaderConfig.js
├── controllers/
│   ├── cardController.js     (unified for all platforms)
│   ├── badgeController.js    (unified for all platforms)
│   └── metaController.js     (generic meta only)
├── middleware/
│   ├── errorHandler.js
│   ├── checkCrawler.js
│   └── apiConfig.js          (NEW: API key validation)
├── routes/
│   ├── modrinth/
│   │   ├── index.js          (NEW: exports all Modrinth routes)
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── organizationRoutes.js
│   │   └── collectionRoutes.js
│   ├── curseforge/
│   │   ├── index.js          (NEW: exports all CurseForge routes)
│   │   └── routes.js         (renamed from curseforgeRoutes.js)
│   └── metaRoutes.js         (generic meta endpoints only)
├── services/
│   ├── baseClient.js         (NEW: base API client)
│   ├── modrinthClient.js
│   └── curseforgeClient.js
├── generators/
│   ├── badge.js              (platform-aware)
│   ├── userCard.js
│   ├── projectCard.js
│   ├── organizationCard.js
│   ├── collectionCard.js
│   └── curseforgeCard.js
└── utils/
    ├── cache.js
    ├── cacheKeys.js          (NEW: cache key factory)
    ├── formatters.js
    ├── generateImage.js
    ├── imageFetcher.js
    ├── logger.js
    └── statsAggregator.js
```

---

## Testing Strategy

### Before Each Phase:
1. Run existing test suite (if available)
2. Manually test all Modrinth endpoints
3. Manually test all CurseForge endpoints
4. Verify cache behavior

### After Each Phase:
1. Regression test all endpoints
2. Verify no performance degradation
3. Check that logs are consistent
4. Validate cache keys

### Critical Endpoints to Test:
```
Modrinth:
- /user/:username
- /user/:username/downloads
- /project/:slug
- /project/:slug/downloads
- /organization/:id
- /collection/:id
- /meta/:type/:id

CurseForge:
- /curseforge/project/:modId
- /curseforge/project/:modId/downloads
- /curseforge/project/:modId/likes
- /curseforge/project/:modId/versions
- /curseforge/lookup/:slug
- /meta/curseforge/:modId (after moving)
```

---

## Success Metrics

- **Code Reduction:** Target ~200 lines of duplicated code eliminated
- **Maintainability:** Adding new platform should require:
  - 1 platform config entry
  - 1 client service (~100 lines)
  - 1 card generator
  - Route definitions only (no controller logic)
- **Consistency:** All platforms follow same patterns
- **Testability:** Each platform can be tested independently

---

## Questions for User

1. **Scope Preference:** Do you want the full refactoring (6 phases) or minimal changes (Phase 1 only)?

2. **Route Organization:** Do you prefer platform-based routes (Option A) or feature-based routes (Option B)?

3. **Timeline:** Is this a greenfield refactoring (can break temporarily) or must it be backwards compatible throughout?

4. **Future Platforms:** Are you planning to add more platforms soon? If so, which ones? This affects how much abstraction is worthwhile.

5. **Breaking Changes:** Are you willing to change cache key patterns? This will invalidate existing caches but improves consistency.

---

## Notes

- This project has excellent foundations - the Modrinth implementation is well-architected
- The CurseForge addition works but doesn't leverage existing patterns
- The configuration-driven approach in controllers is a major strength worth preserving
- Consider documenting the patterns in a CONTRIBUTING.md for future platform additions
