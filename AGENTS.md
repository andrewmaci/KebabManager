# AGENTS.md - Kebab Koordynator

> **AI Agent Navigation Guide** - This document provides comprehensive information for AI agents working on this codebase.

---

## 1. Project Overview

**Kebab Koordynator** is a real-time kebab order management application designed for groups to coordinate food orders. It features a festive Christmas theme, admin controls, PDF export, and statistics tracking.

### Core Purpose
- Collect and organize kebab orders from multiple users
- Real-time synchronization across all connected clients
- Date-based order organization with historical tracking
- Admin mode for order management (edit/delete)

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI framework |
| TypeScript | 5.7.2 | Type safety |
| Vite | 6.2.0 | Build tool & dev server |
| React Router DOM | 6.25.1 | Client-side routing |
| Tailwind CSS | CDN | Utility-first styling |
| Recharts | 2.12.7 | Data visualization |
| jsPDF | 2.5.1 | Client-side PDF generation |
| react-icons | 5.5.0 | Icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | Latest | Python web framework |
| Uvicorn | Latest | ASGI server |
| Google Cloud Firestore | Latest | NoSQL database |
| ReportLab | Latest | PDF generation |
| Pydantic | Latest | Data validation |
| Starlette | Latest | ASGI toolkit |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Node.js 22-slim | Frontend build stage |
| Python 3.11-slim | Backend runtime |

---

## 3. File Tree Structure

```
/home/andrew/Work/MyProjects/KebabManager/
├── .git/                          # Git repository
├── .gitignore                     # Git ignore rules
├── README.md                      # User documentation
├── AGENTS.md                      # This file - AI agent guide
├── metadata.json                  # Project metadata
│
├── Frontend Configuration
├── package.json                   # Node.js dependencies
├── package-lock.json              # Locked dependency versions
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
├── index.html                     # HTML entry point
├── index.tsx                      # React bootstrap
├── index.css                      # Global styles & animations
├── types.ts                       # TypeScript type definitions
├── App.tsx                        # Main application component
│
├── Backend
├── main.py                        # FastAPI backend application
├── requirements.txt               # Python dependencies
│
├── DevOps
├── Dockerfile                     # Multi-stage Docker build
├── docker-compose.yaml            # Docker Compose configuration
│
├── Static Assets
├── public/
│   └── logo.png                   # Application logo
│
└── Components
    ├── DateSelector.tsx           # Date picker component
    ├── NavigationBar.tsx          # Top navigation with admin toggle
    ├── OrderForm.tsx              # Order submission form
    ├── OrderItem.tsx              # Individual order display/edit
    ├── OrderList.tsx              # Order list with actions
    ├── Statistics.tsx             # Statistics dashboard
    └── icons/                     # Custom SVG icon components
        ├── CalendarIcon.tsx
        ├── ChartIcon.tsx
        ├── EditIcon.tsx
        ├── EmptyStateIcon.tsx
        ├── KebabIcon.tsx
        ├── PdfIcon.tsx
        ├── PodiumIcon.tsx
        ├── TrashIcon.tsx
        ├── TrophyIcon.tsx
        └── XIcon.tsx
```

---

## 4. Architecture Overview

### Data Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │◄───►│  FastAPI    │◄───►│  Firestore  │
│  (React)    │ SSE │  Backend    │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                                      ▲
       │                                      │
       └─────────────── SSE ──────────────────┘
                    (Real-time updates)
```

### Communication Pattern
1. **Client → Server**: HTTP REST API calls (POST/PUT/DELETE)
2. **Server → Client**: Server-Sent Events (SSE) for real-time updates
3. **Database**: Firestore document-based storage

### Key Architectural Decisions
- **No traditional WebSocket**: Uses SSE for server→client streaming (simpler, auto-reconnect)
- **No state management library**: Uses React hooks (useState, useEffect) + SSE
- **Single Docker container**: Frontend built and served by backend (simplified deployment)
- **Firestore**: Serverless NoSQL with real-time capabilities

---

## 5. Key Features

### 5.1 Real-Time Synchronization
- Uses Server-Sent Events (SSE) endpoint `/api/orders/stream`
- Automatic reconnection on connection loss
- All clients receive updates when any client modifies data

### 5.2 Admin Mode
- Toggle switch in navigation bar
- Password protection: `kebabadmin`
- Enables edit/delete functionality on orders
- Persists in localStorage

### 5.3 Date-Based Organization
- Orders grouped by date
- Polish locale formatting ("Dzisiaj", "Wczoraj", dates)
- Date selector with calendar navigation

### 5.4 PDF Export
- Server-side generation via ReportLab
- Unicode support (DejaVuSans font)
- Order summary with all details

### 5.5 Statistics Dashboard
- Leaderboard: Top kebab consumers
- Time-series charts (day/week/month views)
- Total order counts

### 5.6 Christmas Theme
- Animated snowfall effect
- Twinkling lights animation
- Festive color scheme
- Dark mode support

---

## 6. Development Guidelines

### 6.1 React Best Practices

#### Component Structure
```typescript
// Use functional components with explicit return type
const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks at the top
  const [state, setState] = useState<string>('');
  
  // Effects
  useEffect(() => {
    // Cleanup functions for SSE, intervals, etc.
    return () => {
      // cleanup
    };
  }, [dependency]);
  
  // Handlers
  const handleAction = useCallback(() => {
    // Implementation
  }, [dependency]);
  
  return (
    // JSX
  );
};
```

#### Props Interface Pattern
```typescript
interface ComponentProps {
  // Required props first
  order: KebabOrder;
  onUpdate: (order: KebabOrder) => void;
  
  // Optional props with defaults
  isAdmin?: boolean;
  className?: string;
}
```

#### Hook Rules
- Always use hooks at the top level
- Never call hooks inside loops, conditions, or nested functions
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive computations

### 6.2 TypeScript Best Practices

#### Strict Mode Enabled
- Always define explicit types for function parameters and returns
- Avoid `any` type - use `unknown` if type is truly unknown
- Use interfaces for object shapes, types for unions/intersections

#### Type Definitions Location
```typescript
// types.ts - Central type definitions
export interface KebabOrder {
  id: string;
  name: string;
  type: string;
  size: string;
  sauce: string;
  meat: string;
  timestamp: string;
  date: string;
}

export interface KebabOrderData {
  name: string;
  type: string;
  size: string;
  sauce: string;
  meat: string;
}
```

### 6.3 FastAPI Best Practices

#### Endpoint Pattern
```python
@app.get("/api/orders")
async def get_orders() -> List[KebabOrder]:
    """Get all orders with proper typing and docstrings."""
    try:
        # Implementation
        return orders
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

#### SSE Implementation
```python
@app.get("/api/orders/stream")
async def orders_stream(request: Request):
    """Stream real-time order updates."""
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            # Check for updates and yield
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(1)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

### 6.4 Styling Guidelines

#### Tailwind CSS Conventions
- Use utility classes directly in JSX
- Group related classes logically
- Extract repeated patterns to component-level constants
- Dark mode: Use `dark:` prefix for dark variants

```tsx
// Good example
<div className="
  bg-white dark:bg-slate-800
  rounded-lg shadow-md
  p-4 mb-4
  transition-all duration-200
">
```

#### Animation Classes
Defined in `index.css`:
- `.snowfall` - Snow animation
- `.twinkle` - Light twinkling
- `.bounce-gentle` - Subtle bounce
- `.glow` - Glow effect

---

## 7. Component Guide

### 7.1 App.tsx
**Purpose**: Main application component with routing and global state

**Key Responsibilities**:
- SSE connection management
- Admin authentication state
- Route configuration
- Christmas theme effects (snowfall)

**State**:
```typescript
const [orders, setOrders] = useState<KebabOrder[]>([]);
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [isAdmin, setIsAdmin] = useState<boolean>(false);
const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
```

### 7.2 NavigationBar.tsx
**Purpose**: Top navigation with admin toggle

**Props**:
```typescript
interface NavigationBarProps {
  isAdmin: boolean;
  onAdminToggle: (enabled: boolean) => void;
  currentView: 'orders' | 'statistics';
  onViewChange: (view: 'orders' | 'statistics') => void;
}
```

### 7.3 DateSelector.tsx
**Purpose**: Date picker with Polish locale

**Props**:
```typescript
interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}
```

**Features**:
- "Dzisiaj" (Today) and "Wczoraj" (Yesterday) labels
- Calendar navigation
- Date formatting for display

### 7.4 OrderForm.tsx
**Purpose**: Form for submitting new orders

**Fields**:
- Name (text input)
- Type (dropdown: "Na miejscu", "Na wynos")
- Size (dropdown: "Mały", "Średni", "Duży")
- Sauce (dropdown: "Łagodny", "Ostry", "Mieszany")
- Meat (dropdown: "Kurczak", "Wołowina", "Mieszane")

**Props**:
```typescript
interface OrderFormProps {
  onSubmit: (order: KebabOrderData) => void;
}
```

### 7.5 OrderList.tsx
**Purpose**: Display orders for selected date

**Props**:
```typescript
interface OrderListProps {
  orders: KebabOrder[];
  selectedDate: Date;
  isAdmin: boolean;
  onEdit: (order: KebabOrder) => void;
  onDelete: (id: string) => void;
  onImport: (orders: KebabOrder[]) => void;
}
```

**Features**:
- PDF generation
- JSON import (admin only)
- Empty state display

### 7.6 OrderItem.tsx
**Purpose**: Individual order display with edit/delete

**Props**:
```typescript
interface OrderItemProps {
  order: KebabOrder;
  isAdmin: boolean;
  onEdit: (order: KebabOrder) => void;
  onDelete: (id: string) => void;
}
```

**Features**:
- Inline editing form
- Delete confirmation
- Admin-only action buttons

### 7.7 Statistics.tsx
**Purpose**: Analytics dashboard

**Props**:
```typescript
interface StatisticsProps {
  orders: KebabOrder[];
}
```

**Features**:
- Leaderboard (top customers)
- Total statistics
- Line chart with time range selection (day/week/month)

---

## 8. API Reference

### 8.1 Endpoints

#### GET /api/orders
Returns all orders.

**Response**: `List[KebabOrder]`

#### GET /api/orders/stream
SSE endpoint for real-time updates.

**Response**: `text/event-stream`

#### POST /api/orders
Create new order.

**Request Body**: `KebabOrderData`

**Response**: `KebabOrder`

#### PUT /api/orders/{order_id}
Update existing order.

**Request Body**: `KebabOrderData`

**Response**: `KebabOrder`

#### DELETE /api/orders/{order_id}
Delete order.

**Response**: `{"message": "Order deleted"}`

#### GET /api/orders/pdf
Generate PDF for selected date.

**Query Params**: `date` (YYYY-MM-DD)

**Response**: `application/pdf`

### 8.2 Data Models

#### KebabOrder
```typescript
{
  id: string;           // Firestore document ID
  name: string;         // Customer name
  type: string;         // "Na miejscu" | "Na wynos"
  size: string;         // "Mały" | "Średni" | "Duży"
  sauce: string;        // "Łagodny" | "Ostry" | "Mieszany"
  meat: string;         // "Kurczak" | "Wołowina" | "Mieszane"
  timestamp: string;    // ISO 8601 datetime
  date: string;         // YYYY-MM-DD
}
```

#### KebabOrderData
```typescript
{
  name: string;
  type: string;
  size: string;
  sauce: string;
  meat: string;
}
```

---

## 9. Database Schema

### Firestore Structure

```
orders (collection)
  └── {order_id} (document)
        ├── name: string
        ├── type: string
        ├── size: string
        ├── sauce: string
        ├── meat: string
        ├── timestamp: timestamp
        └── date: string (YYYY-MM-DD)
```

### Query Patterns
- **Get by date**: `where("date", "==", "YYYY-MM-DD")`
- **Get all**: No filter, ordered by timestamp desc
- **Real-time**: Firestore on_snapshot listeners

---

## 10. Environment Setup

### 10.1 Docker Development

**Build image**:
```bash
docker build -t kebab-app .
```

**Run container**:
```bash
docker run -p 8000:8000 kebab-app
```

**Docker Compose**:
```bash
docker-compose up
```

### 10.2 Local Development

**Prerequisites**:
- Node.js 22+
- Python 3.11+
- Google Cloud credentials (for Firestore)

**Frontend**:
```bash
npm install
npm run dev
```

**Backend**:
```bash
pip install -r requirements.txt
python main.py
```

### 10.3 Environment Variables

```bash
# Backend
PORT=8080                    # Server port
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Frontend (via Vite)
VITE_API_URL=http://localhost:8000
```

### 10.4 Local Development with Firestore Emulator

For fully local development without cloud dependencies:

**Prerequisites:**
- Docker and Docker Compose installed
- `orders_export.csv` file present in project root (for seeding)

**How It Works:**
- `docker-compose.yml` - Production configuration (no emulator)
- `docker-compose.override.yml` - Local emulator config (**git-ignored**, never committed)

Docker Compose automatically merges `docker-compose.override.yml` with the main config.

**Start the development environment:**
```bash
docker-compose up
```

This starts three services:
1. **Firestore Emulator** (port 8080) - Local Firestore database
2. **Emulator UI** (port 4000) - Web interface to view/edit data
3. **Kebab App** (port 8000) - Full application stack

**Seed Database with CSV Data:**
To import `orders_export.csv` into the emulator (runs once per fresh start):
```bash
docker-compose --profile seed up seed-data
```

Or combine both commands:
```bash
docker-compose up -d && docker-compose --profile seed up seed-data
```

**Access points:**
- Application: http://localhost:8000
- Emulator UI: http://localhost:4000
- Firestore API: http://localhost:8080

**Data Persistence:**
- Emulator data persists in Docker volume `firestore-data`
- Data survives container restarts
- To reset data: `docker-compose down -v`

**Production Safety:**
- `docker-compose.override.yml` is git-ignored and never pushed to main
- Production deployments use only `docker-compose.yml` (no emulator)
- The emulator is activated automatically via `FIRESTORE_EMULATOR_HOST` env var
- When this variable is NOT set (production), the app uses real Firestore

---

## 11. State Management

### 11.1 React State

**Local Component State**:
- Form inputs
- UI toggles (modals, dropdowns)
- Loading states

**Global State (App.tsx)**:
- `orders`: All orders from server
- `selectedDate`: Currently selected date
- `isAdmin`: Admin mode status

### 11.2 SSE Implementation

**Connection Setup** (App.tsx):
```typescript
useEffect(() => {
  const eventSource = new EventSource('/api/orders/stream');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setOrders(data.orders);
  };
  
  eventSource.onerror = () => {
    // Auto-reconnect after error
    eventSource.close();
  };
  
  return () => {
    eventSource.close();
  };
}, []);
```

**Backend SSE** (main.py):
```python
@app.get("/api/orders/stream")
async def orders_stream(request: Request):
    async def event_generator():
        last_orders = None
        while True:
            if await request.is_disconnected():
                break
                
            current_orders = await fetch_orders()
            if current_orders != last_orders:
                yield f"data: {json.dumps({'orders': current_orders})}\n\n"
                last_orders = current_orders
                
            await asyncio.sleep(1)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

### 11.3 Data Flow

1. User action → API call to backend
2. Backend updates Firestore
3. SSE detects change → broadcasts to all clients
4. All clients receive update → React re-renders

---

## 12. Testing Strategy

### 12.1 Current State
**No tests are currently implemented** in this codebase.

### 12.2 Recommended Testing Approach

#### Frontend Testing (Jest + React Testing Library)
```typescript
// Component test example
describe('OrderForm', () => {
  it('submits order with correct data', () => {
    const onSubmit = jest.fn();
    render(<OrderForm onSubmit={onSubmit} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John' }
    });
    
    // Submit
    fireEvent.click(screen.getByText('Submit'));
    
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John',
      // ... other fields
    });
  });
});
```

#### Backend Testing (pytest)
```python
# API test example
def test_create_order(client):
    response = client.post("/api/orders", json={
        "name": "John",
        "type": "Na miejscu",
        "size": "Duży",
        "sauce": "Łagodny",
        "meat": "Kurczak"
    })
    assert response.status_code == 200
    assert response.json()["name"] == "John"
```

#### E2E Testing (Playwright/Cypress)
- Test complete user flows
- Admin mode functionality
- Real-time updates across multiple sessions

### 12.3 Testing Commands to Add

```json
// package.json additions
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test"
  }
}
```

---

## 13. Common Tasks for AI Agents

### 13.1 Adding a New Field to Orders

1. Update `types.ts` - Add field to `KebabOrder` and `KebabOrderData`
2. Update `OrderForm.tsx` - Add input for new field
3. Update `OrderItem.tsx` - Display and edit new field
4. Update `main.py` - Handle new field in API endpoints
5. Update PDF generation - Include new field in PDF output

### 13.2 Adding a New Route/Page

1. Create new component in `components/`
2. Add route in `App.tsx` using React Router
3. Add navigation link in `NavigationBar.tsx`
4. Add FastAPI endpoint if backend data needed

### 13.3 Modifying the Theme

1. Update Tailwind classes in components
2. Modify `index.css` for animation changes
3. Update color scheme constants

### 13.4 Adding a New Icon

1. Create new component in `components/icons/`
2. Use SVG format, 24x24 viewBox
3. Export and import in parent component
4. Follow existing icon component pattern

---

## 14. Troubleshooting

### 14.1 Common Issues

**SSE not updating**:
- Check browser console for connection errors
- Verify backend `/api/orders/stream` endpoint
- Check Firestore connection

**PDF generation fails**:
- Verify DejaVuSans font is loaded
- Check ReportLab installation
- Verify Unicode text handling

**Admin mode not persisting**:
- Check localStorage implementation
- Verify password constant

### 14.2 Debug Mode

Enable verbose logging:
```python
# main.py
logging.basicConfig(level=logging.DEBUG)
```

---

## 15. Security Considerations

### 15.1 Current Security Model
- **Admin password**: Hardcoded as `kebabadmin` (not for production)
- **No authentication**: Open access to order creation
- **No rate limiting**: Susceptible to spam

### 15.2 Production Recommendations
- Implement proper authentication (JWT/OAuth)
- Add rate limiting (slowapi)
- Move admin password to environment variable
- Add input validation and sanitization
- Implement CORS properly

---

## 16. Deployment Notes

### 16.1 Docker Build
Multi-stage build optimized for size:
1. Stage 1: Node.js - Build frontend
2. Stage 2: Python - Runtime with compiled frontend

### 16.2 Cloud Deployment
**Google Cloud Run**:
```bash
gcloud run deploy kebab-koordynator \
  --source . \
  --region europe-central2 \
  --allow-unauthenticated
```

**Environment variables for Cloud Run**:
- Set `GOOGLE_APPLICATION_CREDENTIALS` via Secret Manager
- Configure `PORT` (Cloud Run sets this automatically)

---

## 17. Contributing Guidelines

### 17.1 Code Style
- Follow existing component patterns
- Use TypeScript strict mode
- Add JSDoc comments for complex functions
- Keep components under 200 lines (refactor if larger)

### 17.2 Commit Messages
```
feat: add new sauce option
fix: resolve SSE reconnection issue
docs: update AGENTS.md with new endpoint
refactor: split OrderList into smaller components
```

### 17.3 Before Submitting
- [ ] Code compiles without errors
- [ ] No console errors in browser
- [ ] Admin mode works correctly
- [ ] PDF generation works
- [ ] SSE updates propagate
- [ ] Dark mode displays correctly

---

## Quick Reference

| Task | File | Key Function/Component |
|------|------|------------------------|
| Add order field | `types.ts`, `OrderForm.tsx`, `main.py` | Interface + Form + API |
| Change theme | `index.css`, `App.tsx` | CSS + Theme logic |
| Add API endpoint | `main.py` | FastAPI decorator |
| Modify order display | `OrderItem.tsx` | Component JSX |
| Update navigation | `NavigationBar.tsx` | Navigation links |
| Fix real-time updates | `App.tsx`, `main.py` | SSE implementation |
| Change admin password | `App.tsx` | Password constant |
| Update PDF layout | `main.py` | ReportLab canvas |

---

**Last Updated**: 2026-01-30  
**Version**: 1.0.0  
**Maintainer**: AI Agent Guide
