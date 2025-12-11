## IC Index Reference

This document explains the shared No. Kad Pengenalan (No. KP) index that now enforces global uniqueness across KIR, AIR, and PKIR records. Use this as the source of truth whenever you need to look up an IC or ensure it isn’t duplicated.

### What Changed

- Added `ICIndexService` (`src/services/backend/ICIndexService.js`) which wraps the `index_nokp` collection and exposes helpers to **register**, **transfer**, **update metadata**, **unregister**, and **read** IC entries.
- Updated `KIRService`, `AIRService`, and `PasanganService` to call `ICIndexService` during create/update/delete so that every IC lives in `index_nokp` with metadata about its owner (`owner_type`, `owner_id`, `kir_id`, `nama`, `env`).
- AIR/PKIR forms now throw an error immediately if the IC is already registered, because the backend transaction fails with a friendly message.

### Data Stored in `index_nokp`

| Field             | Description                                    |
|-------------------|------------------------------------------------|
| `no_kp`           | Normalized IC (digits only) – document ID      |
| `no_kp_display`   | Raw IC entered by the user                     |
| `owner_type`      | `KIR` \| `AIR` \| `PKIR`                       |
| `owner_id`        | Firestore document ID of the record            |
| `kir_id`          | Parent KIR ID (for AIR/PKIR)                   |
| `nama`            | Person’s name (best effort)                    |
| `env`             | Current environment (`dev`, `prod`, …)         |
| `created_at`      | Timestamp when the IC was registered           |
| `updated_at`      | Timestamp for the latest metadata update       |

### Using the Index in New Code

Import the service from the backend index barrel:

```js
import ICIndexService, { INDEX_OWNER_TYPES } from '../services/backend/ICIndexService.js';
```

Common calls:

- `ICIndexService.register(noKP, { ownerType, owner_id, kirId, nama })`
- `ICIndexService.transfer(oldNoKP, newNoKP, metadata)` for updates
- `ICIndexService.unregister(noKP)` when deleting a record
- `ICIndexService.get(noKP)` if you need to check who owns an IC
- `ICIndexService.updateMetadata(noKP, metadata)` to tweak the saved info

Always normalize data the same way (digits only). The helper does this internally.

### Testing / Verification

1. **Create or edit** KIR/AIR/PKIR using the UI or direct service call. Successful saves should create/update a document in `index_nokp` (check via Firebase console or emulator).
2. **Attempt a duplicate** IC for another record. The backend transaction will throw (toast shows “No. KP … telah digunakan”), proving that global uniqueness works.
3. **Delete** an AIR/PKIR and confirm the corresponding `index_nokp` doc disappears.
4. Optionally run a Firestore query on `index_nokp` filtering by `owner_type` to audit who owns a specific IC.

> :warning:  Existing records that were created before this change won’t appear in `index_nokp` automatically. Backfill them via a script or a one-time migration to enforce uniqueness retroactively.

