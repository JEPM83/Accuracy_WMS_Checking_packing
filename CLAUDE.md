# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WMS (Warehouse Management System) prototype for a **CHECKING + PACKING** module for post-picking outbound orders. The system is designed to run completely **OFFLINE** on a laptop with no real backend or database.

**Key Characteristics:**
- Stack: React + Vite + TypeScript
- Persistence: IndexedDB (localStorage for simple data)
- Language: 100% Spanish
- Target devices: PC and tablet (responsive)
- Multi-company (sociedades): SBO_OPERACIONES, SBO_AMBAR, SBO_ACCURACY
- Multi-client with user-based access control

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Architecture Overview

### Data Layer
- **Persistence**: IndexedDB for offline data storage (must persist on browser reload)
- **Seeds**: Initial JSON data loaded from `/src/seeds/*.json` on first use
- **No Backend**: All logic runs client-side

### Core Data Entities

1. **users.json** - User accounts with roles (ADMIN, SUPERVISOR, OPERARIO)
2. **user_clients.json** - User-to-client assignments
3. **clients.json** - Client master data
4. **orders.json** - Outbound orders
5. **order_lines.json** - Order line items with SKUs
6. **labels.json** - Packing labels/boxes (format: CLIENTE-ORDERID-SEQ)
7. **scans.json** - Individual scan records (audit trail)
8. **incidents.json** - Incidents (TRUEQUE, SOBRANTE, FALTANTE, DIF_PESO)
9. **sku_catalog.json** - SKU master with EAN mappings, weights, UOM conversions, requiresSeries/requiresLot flags

### Module Structure (Views)

1. **Login** - User/password + company selector
2. **Outbound List** - Order list with filters (company, client, dates)
3. **OutboundDetail** - Main packing/checking interface
4. **Progress Dashboard** - Charts and drill-down by order
5. **Incidents Report** - Charts and exportable tables
6. ~~**Label Traceability**~~ - OMITTED (do not implement)

## Critical Business Rules

### Order States
- **RECEP**: Picked orders, no packing started (CheckedQty=0, no scans)
- **CHK**: Packing in progress (first scan triggers this state)
- **CONFIRMADO WMS**: Packing closed
- **CONFIRMADO DESPACHO**: Do NOT implement (future state)

### Quantity Rules (Per Line)
- **OrderedQty**: Originally ordered quantity
- **PickedQty**: Actually picked quantity (target for checking)
- **CheckedQty**: Accumulated via scans during packing

**Traffic Light Logic (per line and per order):**
- **Green**: CheckedQty == PickedQty
- **Yellow**: CheckedQty != PickedQty
- **Red**: (PickedQty - CheckedQty) >= 1 OR faltante reported for that line

**SOBRANTE (Overage)**: When CheckedQty > PickedQty → Creates incident

### Labels (Bultos/Cajas/Etiquetas)
- Format: `CLIENTE-ORDERID-SEQ` (e.g., SOLUM-4500123-03)
- While order is open: show `SEQ/?`
- When order closes: freeze and show `SEQ/TOTAL`
- **Deletion Rules**:
  - Label can ONLY be deleted if it has NO scans
  - System MUST block deletion if scans exist
  - User must manually delete all scans first
  - Incidents associated with deleted scans remain as history
- **Closing Labels**:
  - Closed labels don't allow new scans
  - Can be reopened with authorization
  - On reopen-then-close: reprint PDF ONLY if content changed

### Scanning Flow

1. **SKU/EAN Input**:
   - User scans EAN or SKU
   - If EAN maps to multiple SKUs → show modal to request internal SKU
   - Auto-assign to line:
     - If SKU in 1 line → use that line
     - If SKU in multiple lines → use first line with pending balance (PickedQty - CheckedQty > 0)

2. **TRUEQUE (Wrong Item)**:
   - If SKU (or SKU+LOT combination) does NOT belong to order
   - Register TRUEQUE incident and alert
   - Do NOT increment CheckedQty

3. **Series (Serial Numbers)**:
   - If `requiresSeries` flag is true for SKU
   - User scans series one by one (each Enter adds one)
   - Quantity increments automatically (not manually editable)
   - Series must be globally unique across ALL orders in storage
   - If series already exists → block and alert

4. **Lote (Batch)**:
   - If `requiresLot` flag is true for SKU
   - Flow: scan/enter batch → enter quantity

5. **UOM (Unit of Measure)**:
   - Each SKU has its own UOM conversions (e.g., EA:1, PACK6:6, MASTER24:24)
   - Allow UOM selection when entering quantity (only if NOT series-controlled)
   - Allow mixing UOM in same SKU (multiple scans with different UOM)
   - Always accumulate CheckedQty in base unit (EA) for comparisons and weight

6. **SOBRANTE (Overage)**:
   - If user tries to register quantity that makes CheckedQty > PickedQty:
     - Show confirmation "¿Seguro?"
     - If confirmed, require authorization (based on role)
     - Register SOBRANTE incident with: SKU, QTY, LABEL, USER, DATE/TIME, AUTHORIZED_BY, optional COMMENT

7. **FALTANTE (Shortage)**:
   - Must have "Reportar faltante" button per line
   - Creates FALTANTE incident with qtyFaltante = PickedQty - CheckedQty (if >0)
   - No authorization required
   - Mark line as red

### Repack (Move Between Labels)
- Only allowed if BOTH labels are OPEN
- Allow total or partial repack
- Implementation:
  - Register NEGATIVE scan in origin label
  - Register POSITIVE scan in destination label
  - Maintain full audit trail
- Repack with series:
  - Allow choosing which series to move
  - Series move, do NOT duplicate

### Weight/Balanza (Scale)
- Each SKU has theoretical weight per EA in catalog
- Label theoretical weight = sum(skuWeight * checkedQtyInLabel)
- When closing label:
  - Show modal "Leyendo balanza…"
  - Simulate scale: assign real weight close to theoretical
  - Allow editing real weight (requires authorization for OPERARIO)
  - If |realWeight - theoreticalWeight| exceeds threshold (e.g., 5% or 0.5kg):
    - Auto-generate DIF_PESO incident

### Order Closure
- Closing order changes state to CONFIRMADO WMS
- Allowed to close with incidents and/or incomplete lines
- In order lists and dashboards, orders with incidents must show alert (different color, icon)
- OPERARIO cannot reopen order
- SUPERVISOR/ADMIN can reopen order with explicit action

### Role-Based Authorization

**Roles:**
- **ADMIN**: Full access
- **SUPERVISOR**: Full access
- **OPERARIO**: Limited access (cannot reopen orders)

**Actions Requiring Authorization (for OPERARIO only):**
- Register SOBRANTE (Checked > Picked)
- Edit real weight from scale
- Reopen closed label
- (OPERARIO can NEVER reopen order)

**Authorization Flow:**
- If logged-in user is SUPERVISOR/ADMIN: authorize with 1 click
- If logged-in user is OPERARIO: request supervisor password in modal (fake validation for demo)

### PDF Generation (Simulated)
- When closing a label, mark as "pending updated print" if content changed
- For demo: generate ONE PDF with ALL labels from the order
- Size: 10x15 cm per label (one per page)
- Include in each label:
  - labelId (CLIENTE-ORDER-SEQ, then SEQ/TOTAL when order closes)
  - orderId
  - sociedad
  - client and delivery address
  - theoretical and real weight
  - user who closed
  - date/time
  - QR code containing compact JSON: `{labelId, orderId, sociedad}`
- Provide button: "Ver/Descargar PDF etiquetas del pedido"

## Reports

### 1. Progress Dashboard
- Filters: company, client, date range, user (optional)
- Display:
  - Global donut chart (% progress: sum checked vs sum picked)
  - Order list with mini-donut per order
  - On order selection: drill-down with:
    - Bar chart per line (Picked vs Checked)
    - Heatmap per label (% progress = units in label / total units in order)

### 2. Incidents Report
- Chart by type (TRUEQUE, SOBRANTE, FALTANTE, DIF_PESO)
- Detailed table with filters (company, client, date, order, user, type)
- Export to CSV (browser download)

## UX Requirements

- Responsive (PC and tablet)
- Scanner-first design:
  - Auto-focus on scan input
  - Enter shortcut to register
- Show visible "Estación/Mesa" field (editable in quick settings, saved in storage)
- Clear messages and confirmation modals
- Show states with chips (RECEP/CHK/CONFIRMADO WMS) and traffic lights
- Show progress per order: checked/picked and %
- Must include visible "Reset demo data" button that clears storage and reloads seeds

## Demo Users (Required)

```
operario1 / 1234 → OPERARIO
supervisor1 / 1234 → SUPERVISOR
admin1 / 1234 → ADMIN
```

## Demo Data Requirements

- Total 6 demo orders:
  - 2 simple orders (no series, no batch)
  - 2 orders with series
  - 2 orders with batch
- Each order: 5-8 lines
- All orders start with CheckedQty=0, no scans, no incidents
- Multi-company distribution across SBO_OPERACIONES, SBO_AMBAR, SBO_ACCURACY
- Minimum 3 different clients (one client can appear in multiple companies)
- SKU catalog must include:
  - Some SKUs with duplicate EANs (to trigger modal)
  - Varied UOM conversions (EA:1 mandatory, plus PACK6/PACK12 and MASTER24/MASTER48 depending on SKU)
  - Weight per EA in kg
  - requiresSeries/requiresLot flags

## Important Constraints

- NO real database or backend
- NO external services
- Must work completely OFFLINE
- Must persist all data on browser reload
- Seeds load ONLY on first use (if no data in storage)
- All UI in Spanish
- Do NOT implement English language support
- Do NOT implement label traceability module (explicitly omitted)
- Do NOT implement CONFIRMADO DESPACHO state flow (only show if exists in seeds)

## Validation Rules

- NEVER allow:
  - Duplicate series
  - Checking non-existent SKU without incident
  - Deleting label with content
- System must be consistent after:
  - Browser refresh
  - Order change
  - User change
- All important events must provide visual feedback
