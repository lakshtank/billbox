# BillBox — Diagram Prompts

Ten diagrams are referenced in the project report. For each one you get **two options**:

- **Option A — AI image prompt.** Paste into Gemini / ChatGPT image generation. Fast, but AI image tools often misspell labels in diagrams, so always zoom in and check the text before pasting into the report.
- **Option B — Mermaid code (recommended).** Paste into <https://mermaid.live>, then use *Actions → PNG* to download a clean, pixel-sharp diagram with correct spelling. This is the safer choice for a submission.

Keep every diagram on a **white background** so it sits cleanly in the Word document. Export at a wide size (at least 1600 px) so it stays sharp when printed.

Figure numbers below match the placeholders already in the report.

---

## 1. System Architecture — Figure 1

**Option A — AI image prompt**

> Create a clean, professional three-tier software architecture diagram on a pure white background, in a flat modern style with rounded rectangles, thin grey connector lines and a navy blue and light blue colour scheme. No shadows, no 3D, no clipart.
>
> Layer 1, labelled "Client Layer": a single box "React 19 Single Page Application (Vite)" containing four small stacked boxes: "Pages", "Components", "TanStack Query Cache", "Auth Context".
>
> Layer 2, labelled "Server Layer": a single box "Node.js + Express REST API" containing four small stacked boxes: "Routes", "Controllers", "Services", "Middleware (JWT, Multer, Validation)".
>
> Layer 3, labelled "Data and External Services": three separate boxes side by side: "MongoDB Atlas (Mongoose ODM)", "Google Gemini AI (Receipt Reading)", "SMTP Email Service".
>
> Draw a labelled arrow from Layer 1 to Layer 2 reading "HTTPS / JSON via Axios", and three labelled arrows from Layer 2 down to each of the three Layer 3 boxes, reading "Mongoose queries", "AI extraction request" and "Reminder emails". Use clear, readable sans-serif text.

**Option B — Mermaid code**

```mermaid
graph TD
    subgraph CLIENT["Client Layer — React 19 SPA (Vite)"]
        A1["Pages<br/>Dashboard · Receipts · Products"]
        A2["Reusable Components<br/>Navbar · Sidebar · Cards"]
        A3["TanStack Query<br/>Server data cache"]
        A4["Auth Context<br/>JWT session state"]
    end

    subgraph SERVER["Server Layer — Node.js + Express REST API"]
        B1["Routes<br/>URL definitions"]
        B2["Middleware<br/>JWT · Multer · Validation"]
        B3["Controllers<br/>Request handling"]
        B4["Services<br/>OCR · Warranty · Email"]
    end

    subgraph DATA["Data and External Services"]
        C1[("MongoDB Atlas<br/>via Mongoose ODM")]
        C2["Google Gemini AI<br/>Receipt reading"]
        C3["SMTP Server<br/>Reminder emails"]
    end

    CLIENT -->|"HTTPS / JSON via Axios"| SERVER
    B1 --> B2 --> B3 --> B4
    SERVER -->|"Mongoose queries"| C1
    B4 -->|"AI extraction request"| C2
    B4 -->|"Warranty reminder mail"| C3
```

---

## 2. Entity Relationship Diagram — Figure 2

**Option A — AI image prompt**

> Create a clean database entity relationship diagram on a white background in flat professional style. Seven entity boxes, each with a navy header bar containing the entity name in white text and a white body listing its key fields in grey sans-serif text.
>
> Entities and fields: "User (name, email, password, timezone, defaultCurrency, notificationPreferences)"; "Receipt (userId, publicToken, storeName, invoiceNumber, purchaseDate, subtotal, taxAmount, grandTotal, currency, fileType, status)"; "Product (receiptId, userId, productName, brand, category, quantity, unitPrice, lineTotal, warrantyExpiryDate, warrantyStatus, reminderEnabled)"; "Category (userId, name)"; "Activity (userId, type, title, message, refId)"; "BatchUpload (userId, files, totalFiles, completedFiles)"; "ReminderLog (userId, productId, productName, recipientEmail, sentAt, status)".
>
> Draw crow's foot relationship lines: User to Receipt labelled "1 to many", Receipt to Product labelled "1 to many", User to Product labelled "1 to many", User to Category labelled "1 to many", User to Activity labelled "1 to many", User to BatchUpload labelled "1 to many", Product to ReminderLog labelled "1 to many". Place User on the left as the central parent entity.

**Option B — Mermaid code**

```mermaid
erDiagram
    USER ||--o{ RECEIPT : "owns"
    USER ||--o{ PRODUCT : "owns"
    USER ||--o{ CATEGORY : "defines"
    USER ||--o{ ACTIVITY : "generates"
    USER ||--o{ BATCHUPLOAD : "starts"
    USER ||--o{ REMINDERLOG : "receives"
    RECEIPT ||--o{ PRODUCT : "contains line items"
    PRODUCT ||--o{ REMINDERLOG : "triggers"

    USER {
        ObjectId _id PK
        String name
        String email UK
        String password
        String timezone
        String defaultCurrency
        Object notificationPreferences
    }
    RECEIPT {
        ObjectId _id PK
        ObjectId userId FK
        String publicToken UK
        String storeName
        String invoiceNumber
        Date purchaseDate
        Number subtotal
        Number taxAmount
        Number grandTotal
        String currency
        String fileType
        String status
    }
    PRODUCT {
        ObjectId _id PK
        ObjectId receiptId FK
        ObjectId userId FK
        String productName
        String brand
        String category
        Number quantity
        Number unitPrice
        Number lineTotal
        Date warrantyExpiryDate
        String warrantyStatus
        Boolean reminderEnabled
    }
    CATEGORY {
        ObjectId _id PK
        ObjectId userId FK
        String name
    }
    ACTIVITY {
        ObjectId _id PK
        ObjectId userId FK
        String type
        String title
        String message
        ObjectId refId
    }
    BATCHUPLOAD {
        ObjectId _id PK
        ObjectId userId FK
        Array files
        Number totalFiles
        Number completedFiles
    }
    REMINDERLOG {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId productId FK
        String productName
        String recipientEmail
        Date sentAt
        String status
    }
```

---

## 3. Data Flow Diagram — Level 0 (Context) — Figure 3

**Option A — AI image prompt**

> Create a simple Level 0 context data flow diagram on a white background, flat professional style. One large navy circle in the centre labelled "0 — BillBox System". On the left, a grey rectangle labelled "User". On the right, two grey rectangles labelled "Google Gemini AI" and "Email Service".
>
> Draw labelled arrows: from User to the circle reading "Receipt image / PDF, login details, edits"; from the circle to User reading "Dashboard, warranty status, spending reports"; from the circle to Google Gemini AI reading "Document for reading"; from Gemini back to the circle reading "Extracted fields and line items"; from the circle to Email Service reading "Warranty expiry reminder". Use readable sans-serif labels.

**Option B — Mermaid code**

```mermaid
graph LR
    U["User"]
    S((("0<br/>BillBox<br/>System")))
    G["Google Gemini AI"]
    E["Email Service"]

    U -->|"Receipt image / PDF, login details, manual edits"| S
    S -->|"Dashboard, warranty status, spending reports"| U
    S -->|"Document for reading"| G
    G -->|"Extracted fields and line items"| S
    S -->|"Warranty expiry reminder"| E
```

---

## 4. Data Flow Diagram — Level 1 — Figure 4

**Option A — AI image prompt**

> Create a Level 1 data flow diagram on a white background in flat professional style. Use navy circles for processes, grey rectangles for external entities, and open-ended grey bars for data stores.
>
> External entity on the left: "User". Processes as numbered circles: "1 Manage Account", "2 Upload and Read Receipt", "3 Review and Save Receipt", "4 Track Warranty", "5 View Reports and Analytics", "6 Send Reminders". Data stores as open bars: "D1 Users", "D2 Receipts", "D3 Products", "D4 Reminder Logs".
>
> Connect with labelled arrows: User to process 1 "credentials"; process 1 to D1 "user record"; User to process 2 "receipt file"; process 2 to process 3 "extracted draft data"; process 3 to D2 "receipt record" and to D3 "product line items"; D3 to process 4 "warranty dates"; process 4 to User "expiry status"; D2 and D3 to process 5 "spending data"; process 5 to User "charts and totals"; D3 to process 6 "expiring products"; process 6 to D4 "reminder log"; process 6 to User "reminder email".

**Option B — Mermaid code**

```mermaid
graph TD
    U["User"]
    P1(("1<br/>Manage<br/>Account"))
    P2(("2<br/>Upload and<br/>Read Receipt"))
    P3(("3<br/>Review and<br/>Save Receipt"))
    P4(("4<br/>Track<br/>Warranty"))
    P5(("5<br/>View Reports<br/>and Analytics"))
    P6(("6<br/>Send<br/>Reminders"))
    D1[("D1 Users")]
    D2[("D2 Receipts")]
    D3[("D3 Products")]
    D4[("D4 Reminder Logs")]

    U -->|"credentials"| P1
    P1 -->|"user record"| D1
    U -->|"receipt image or PDF"| P2
    P2 -->|"extracted draft data"| P3
    P3 -->|"receipt record"| D2
    P3 -->|"product line items"| D3
    D3 -->|"warranty dates"| P4
    P4 -->|"expiry status"| U
    D2 -->|"spending data"| P5
    D3 -->|"category data"| P5
    P5 -->|"charts and totals"| U
    D3 -->|"expiring products"| P6
    P6 -->|"reminder record"| D4
    P6 -->|"reminder email"| U
```

---

## 5. Use Case Diagram — Figure 5

**Option A — AI image prompt**

> Create a UML use case diagram on a white background in flat professional style. A stick figure labelled "Registered User" on the left and a stick figure labelled "Guest with Share Link" on the bottom left. A large rounded rectangle boundary box labelled "BillBox" containing light blue ovals.
>
> Ovals: "Register / Login", "Upload Receipt", "Batch Upload Receipts", "Review Extracted Data", "Edit Receipt Details", "View Dashboard", "Search and Filter Receipts", "Track Warranty Status", "Configure Reminders", "View Store Analytics", "Export Data as CSV / JSON", "Share Receipt via Link", "Manage Profile and Settings", "View Shared Receipt".
>
> Connect "Registered User" with solid lines to every oval except "View Shared Receipt". Connect "Guest with Share Link" with a solid line only to "View Shared Receipt". Add a dashed arrow labelled "includes" from "Upload Receipt" to "Review Extracted Data".

**Option B — Mermaid code**

```mermaid
graph LR
    USER(["Registered User"])
    GUEST(["Guest with Share Link"])

    subgraph BILLBOX["BillBox System"]
        UC1["Register / Login"]
        UC2["Upload Receipt"]
        UC3["Batch Upload Receipts"]
        UC4["Review Extracted Data"]
        UC5["Edit Receipt Details"]
        UC6["View Dashboard"]
        UC7["Search and Filter Receipts"]
        UC8["Track Warranty Status"]
        UC9["Configure Reminders"]
        UC10["View Store Analytics"]
        UC11["Export Data as CSV / JSON"]
        UC12["Share Receipt via Link"]
        UC13["Manage Profile and Settings"]
        UC14["View Shared Receipt"]
    end

    USER --- UC1
    USER --- UC2
    USER --- UC3
    USER --- UC5
    USER --- UC6
    USER --- UC7
    USER --- UC8
    USER --- UC9
    USER --- UC10
    USER --- UC11
    USER --- UC12
    USER --- UC13
    GUEST --- UC14
    UC2 -.->|"includes"| UC4
    UC3 -.->|"includes"| UC4
```

---

## 6. Receipt Upload Sequence Diagram — Figure 6

**Option A — AI image prompt**

> Create a UML sequence diagram on a white background in clean flat professional style. Six vertical lifelines with labelled boxes at the top: "User", "React Upload Page", "Express API", "Gemini AI Service", "MongoDB", "React Review Form". Draw horizontal arrows between lifelines in time order, numbered 1 to 10, with short readable labels.
>
> Order of messages: 1 User drops receipt file on React Upload Page; 2 React Upload Page sends POST /api/upload/single with the file to Express API; 3 Express API verifies the JWT token and saves the file temporarily; 4 Express API sends the document to Gemini AI Service; 5 Gemini AI Service returns store name, date, totals and line items; 6 Express API returns the extracted draft to React Review Form; 7 User checks and corrects the fields; 8 React Review Form sends POST /api/receipts to Express API; 9 Express API writes the receipt and its product line items to MongoDB, calculating warranty expiry dates; 10 Express API confirms saved and React redirects to the receipt detail page. Use a dashed line style for return messages.

**Option B — Mermaid code**

```mermaid
sequenceDiagram
    actor User
    participant UI as React Upload Page
    participant API as Express API
    participant AI as Gemini AI Service
    participant DB as MongoDB
    participant RF as React Review Form

    User->>UI: 1. Drop receipt image or PDF
    UI->>API: 2. POST /api/upload/single (multipart file)
    API->>API: 3. Verify JWT, store file, read buffer
    API->>AI: 4. Send document for field extraction
    AI-->>API: 5. Store name, date, totals, line items
    API-->>RF: 6. Return extracted draft data
    User->>RF: 7. Check and correct fields
    RF->>API: 8. POST /api/receipts (final data)
    API->>DB: 9. Save receipt + products, compute warranty expiry
    DB-->>API: Saved document IDs
    API-->>UI: 10. Success, redirect to receipt detail
```

---

## 7. React Component Hierarchy — Figure 7

**Option A — AI image prompt**

> Create a clean top-down component tree diagram on a white background, flat professional style with rounded rectangles in light blue and thin grey connector lines, arranged as a hierarchy.
>
> Root: "App". Below App: "BrowserRouter", "AuthProvider", "ErrorBoundary", "Toaster". Below those: "AppLayout". Below AppLayout, three children: "Navbar", "Sidebar", "Routes". Below Navbar: "NotificationBell". Below Routes, a row of page boxes: "Dashboard", "Receipts", "AddReceipt", "ProductDetail", "Settings", each wrapped in a small box labelled "ProtectedRoute". Below Dashboard: "StatCard", "SpendingChart", "WarrantyTimelineWidget", "UpcomingExpiriesWidget", "ActivityFeedWidget". Below Receipts: "ReceiptCard", "WarrantyBadge", "ShareModal". Below AddReceipt: "ReceiptUploader", "ReceiptReviewForm", "ProductListForm". Label the diagram "React Component Hierarchy".

**Option B — Mermaid code**

```mermaid
graph TD
    APP["App"] --> BR["BrowserRouter"]
    BR --> AP["AuthProvider<br/>(session context)"]
    AP --> EB["ErrorBoundary"]
    AP --> TO["Toaster<br/>(notifications)"]
    EB --> AL["AppLayout"]
    AL --> NAV["Navbar"]
    AL --> SB["Sidebar"]
    AL --> RT["Routes"]
    NAV --> NB["NotificationBell"]

    RT --> PR1["ProtectedRoute"] --> DASH["Dashboard"]
    RT --> PR2["ProtectedRoute"] --> REC["Receipts"]
    RT --> PR3["ProtectedRoute"] --> ADD["AddReceipt"]
    RT --> PR4["ProtectedRoute"] --> PROD["ProductDetail"]
    RT --> LOG["Login / Register"]

    DASH --> SC["StatCard"]
    DASH --> SPC["SpendingChart"]
    DASH --> WTW["WarrantyTimelineWidget"]
    DASH --> UEW["UpcomingExpiriesWidget"]
    DASH --> AFW["ActivityFeedWidget"]

    REC --> RC["ReceiptCard"]
    RC --> WB["WarrantyBadge"]
    REC --> SM["ShareModal"]

    ADD --> RU["ReceiptUploader"]
    ADD --> RRF["ReceiptReviewForm"]
    RRF --> PLF["ProductListForm"]
```

---

## 8. Express Request Pipeline — Figure 8

**Option A — AI image prompt**

> Create a clean left-to-right horizontal pipeline diagram on a white background, flat professional style, using navy rounded rectangles connected by grey arrows, like a processing conveyor.
>
> Boxes in order: "Incoming HTTP Request", "CORS Check", "JSON Body Parser", "Database Connection Check", "Route Match", "JWT Auth Middleware", "Multer File Upload (upload routes only)", "Validation Middleware", "Controller Function", "Service Layer", "MongoDB via Mongoose", "JSON Response".
>
> Add a separate branch arrow from "JWT Auth Middleware" pointing down to a red-outlined box labelled "401 Unauthorised Response", and another from "Validation Middleware" down to a red-outlined box labelled "400 Validation Error Response". At the far right add a box labelled "Global Error Handler" with a dashed arrow into it from the controller box.

**Option B — Mermaid code**

```mermaid
graph LR
    REQ["Incoming<br/>HTTP Request"] --> CORS["CORS<br/>Check"]
    CORS --> BP["JSON Body<br/>Parser"]
    BP --> DBC["Database<br/>Connection Check"]
    DBC --> RM["Route<br/>Match"]
    RM --> JWT["JWT Auth<br/>Middleware"]
    JWT --> MUL["Multer File Upload<br/>(upload routes only)"]
    MUL --> VAL["Validation<br/>Middleware"]
    VAL --> CTRL["Controller<br/>Function"]
    CTRL --> SVC["Service<br/>Layer"]
    SVC --> DB[("MongoDB<br/>via Mongoose")]
    DB --> RES["JSON<br/>Response"]

    JWT -.->|"no / bad token"| E401["401 Unauthorised"]
    VAL -.->|"bad input"| E400["400 Validation Error"]
    CTRL -.->|"unexpected error"| GEH["Global Error Handler<br/>500 Response"]
```

---

## 9. Warranty Lifecycle State Diagram — Figure 9

**Option A — AI image prompt**

> Create a UML state machine diagram on a white background in flat professional style, with rounded state boxes and labelled transition arrows. Use a green box for "Active", an amber box for "Expiring Soon", a red box for "Expired" and a grey box for "No Warranty".
>
> A solid black start dot points to a decision point labelled "Warranty period provided?". A "No" arrow goes to the grey "No Warranty" state. A "Yes" arrow goes to the green "Active" state, with a note reading "expiry = purchase date + warranty period".
>
> From "Active" an arrow labelled "30 days or fewer remaining" goes to amber "Expiring Soon". From "Expiring Soon" an arrow labelled "expiry date passes" goes to red "Expired". From "Expiring Soon" an arrow labelled "reminder emails sent at 30, 15, 7 and 1 days" loops back onto itself. From "Expired" an arrow points to a black and white end dot. Add an arrow from "No Warranty" to "Active" labelled "user adds warranty manually".

**Option B — Mermaid code**

```mermaid
stateDiagram-v2
    [*] --> CheckWarranty
    CheckWarranty : Warranty period provided?
    CheckWarranty --> None : No period found
    CheckWarranty --> Active : Yes — expiry = purchase date + period

    None : No Warranty
    Active : Active<br/>more than 30 days left
    Soon : Expiring Soon<br/>30 days or fewer left
    Expired : Expired<br/>expiry date has passed

    None --> Active : User adds warranty manually
    Active --> Soon : 30 days or fewer remaining
    Soon --> Soon : Reminder emails at 30, 15, 7 and 1 days
    Soon --> Expired : Expiry date passes
    Active --> Expired : Expiry date passes
    Expired --> [*]
```

---

## 10. Deployment Diagram — Figure 10

**Option A — AI image prompt**

> Create a clean cloud deployment diagram on a white background in flat professional style with rounded boxes, light blue and navy colours, and thin grey arrows.
>
> On the left, a box labelled "User Browser" containing "React build (HTML, CSS, JavaScript)". In the centre, a large rounded boundary box labelled "Vercel Platform" containing two boxes: "Static Hosting — client/dist" and "Serverless Function — api/index.js running Express". On the right, three separate cloud-shaped boxes: "MongoDB Atlas Cluster", "Google Gemini API", "SMTP Email Provider".
>
> Draw labelled arrows: User Browser to Static Hosting reading "loads app over HTTPS"; User Browser to Serverless Function reading "/api/* requests"; Serverless Function to MongoDB Atlas reading "database queries"; Serverless Function to Google Gemini API reading "receipt reading"; Serverless Function to SMTP Email Provider reading "reminder emails". Add a small note box reading "Single domain — rewrites in vercel.json route /api/* to the serverless function".

**Option B — Mermaid code**

```mermaid
graph LR
    subgraph BROWSER["User Browser"]
        B1["React build<br/>HTML · CSS · JavaScript"]
    end

    subgraph VERCEL["Vercel Platform — single domain"]
        V1["Static Hosting<br/>client/dist"]
        V2["Serverless Function<br/>api/index.js running Express"]
    end

    subgraph EXTERNAL["External Managed Services"]
        E1[("MongoDB Atlas<br/>Cluster")]
        E2["Google Gemini API"]
        E3["SMTP Email Provider"]
    end

    B1 -->|"loads app over HTTPS"| V1
    B1 -->|"/api/* requests"| V2
    V2 -->|"database queries"| E1
    V2 -->|"receipt reading"| E2
    V2 -->|"reminder emails"| E3
```

---

## How to insert a diagram into the report

1. Generate the diagram and save it as a PNG.
2. Open `BillBox_Project_Report.docx` and find the matching grey placeholder box (for example *"Figure 1 — System Architecture"*).
3. Click inside the placeholder box, delete the instruction line, then go to **Insert → Pictures** and choose your PNG.
4. With the image selected, set **Wrap Text → In Line with Text** and drag a corner handle until the image fits the page width.
5. Leave the caption line underneath exactly as it is, so figure numbering stays consistent.
