# Kebab Koordynator

An application to gather and organize kebab orders from a group of people. Real-time order list shared between all users with admin controls for editing and deleting.

## Features

- **Real-time Order List**: All users see orders update instantly using Server-Sent Events
- **Order Management**: Add orders with customer name, kebab type, size, sauce, and meat type
- **Date Selection**: View and organize orders by date
- **Admin Mode**: Password-protected mode to edit or delete existing orders
- **Statistics Dashboard**: Leaderboard of top customers, total order counts, and time-series charts
- **PDF Export**: Generate PDF reports of orders for the selected date
- **JSON Import**: Import orders from JSON files (admin only)
- **Dark Mode**: Toggle between light and dark themes

## Quick Start with Docker

**Prerequisites:**
- [Docker](https://www.docker.com/get-started) and Docker Compose

**Run with Docker Compose (recommended for local development):**

```bash
docker-compose up
```

This starts:
- Application on http://localhost:8000
- Firestore Emulator UI on http://localhost:4000

**Or build and run manually:**

```bash
docker build -t kebab-app .
docker run -p 8000:8000 kebab-app
```

Then open http://localhost:8000

## Local Development

**Prerequisites:**
- Node.js 22+
- Python 3.11+
- Google Cloud credentials (for production Firestore)

**Frontend:**
```bash
npm install
npm run dev
```

**Backend:**
```bash
pip install -r requirements.txt
python main.py
```

For local development with Firestore emulator, use Docker Compose as shown above.

## Using Admin Mode

To edit or delete orders, enable Admin Mode:

1. Click the **"Tryb Admina"** toggle in the header
2. Enter the password: `kebabadmin`
3. Edit and Delete buttons will appear on each order
4. Your admin status persists across page refreshes

## API Endpoints

- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order
- `GET /api/orders/stream` - Server-Sent Events for real-time updates
- `POST /api/orders/pdf` - Generate PDF report

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend**: FastAPI, Python 3.11
- **Database**: Google Cloud Firestore (or emulator for local development)
- **Container**: Docker, Docker Compose

## License

MIT
