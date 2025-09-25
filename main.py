import asyncio
import json
import os
import uuid
from typing import List
from io import BytesIO
from fastapi.responses import StreamingResponse
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.responses import FileResponse
from google.cloud import firestore
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
# --- Models ---
class KebabOrderData(BaseModel):
    customerName: str
    kebabType: str
    size: str
    sauce: str
    meatType: str
    date: str | None = None

class KebabOrder(KebabOrderData):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

# --- Firestore Client ---
# Initialize Firestore client
db = firestore.Client()
orders_collection = db.collection('orders')

# --- SSE Client Queues ---
sse_client_queues: List[asyncio.Queue] = []

# --- FastAPI app ---
app = FastAPI()

# --- Utility to send updates to clients ---
async def send_update(event: str, data: dict):
    """Puts an event and data into each client's queue."""
    for queue in sse_client_queues:
        await queue.put({"event": event, "data": data})

# --- SSE Stream Endpoint ---
async def order_events_generator(request: Request):
    """Yields server-sent events for order updates."""
    queue = asyncio.Queue()
    sse_client_queues.append(queue)
    try:
        while True:
            # Check if client is still connected
            if await request.is_disconnected():
                break
            
            # Wait for an event to be put on the queue
            event_data = await queue.get()
            event = event_data["event"]
            data = event_data["data"]
            
            # Yield the event in SSE format
            yield f"event: {event}\ndata: {json.dumps(data)}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        # Clean up queue when client disconnects
        sse_client_queues.remove(queue)


@app.get("/api/orders/stream")
async def order_stream(request: Request):
    return StreamingResponse(order_events_generator(request), media_type="text/event-stream")

# --- Standard API Routes ---
@app.get("/api/orders", response_model=List[KebabOrder])
def get_orders(date: str | None = None):
    orders = []
    query = orders_collection
    if date:
        query = query.where('date', '==', date)
    for doc in query.stream():
        orders.append(KebabOrder(**doc.to_dict()))
    return orders

@app.post("/api/orders", response_model=KebabOrder)
async def add_order(order_data: KebabOrderData):
    new_order = KebabOrder(**order_data.dict())
    orders_collection.document(new_order.id).set(new_order.dict())
    # Notify all clients of the new order
    await send_update("new_order", new_order.dict())
    return new_order

# --- Static Files and App Serving ---

# --- PDF Font Setup ---
import pathlib
FONT_PATH = str(pathlib.Path(__file__).parent / "static" / "assets" / "DejaVuSans.ttf")
if os.path.exists(FONT_PATH):
    pdfmetrics.registerFont(TTFont("DejaVuSans", FONT_PATH))
    FONT_NAME = "DejaVuSans"
else:
    FONT_NAME = "Helvetica"  # fallback

@app.post("/api/orders/pdf")
async def generate_orders_pdf(orders: list[KebabOrderData]):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()
    # Use DejaVuSans for all text if available
    styles['Title'].fontName = FONT_NAME
    styles['Normal'].fontName = FONT_NAME
    elements = []

    # Title
    elements.append(Paragraph("Kebab Order Report", styles['Title']))
    # Add date subtitle if available
    if orders and hasattr(orders[0], 'date') and orders[0].date:
        elements.append(Paragraph(f"Orders for: {orders[0].date}", styles['Normal']))
    elements.append(Spacer(1, 12))

    # Table headers (matching jsPDF)
    data = [["Imię", "Typ", "Rozmiar", "Sos", "Mięso"]]
    for order in orders:
        data.append([
            order.customerName,
            order.kebabType,
            order.size,
            order.sauce,
            order.meatType
        ])

    # Calculate column widths to span the page width
    page_width = A4[0] - doc.leftMargin - doc.rightMargin
    col_count = len(data[0])
    col_width = page_width / col_count
    col_widths = [col_width] * col_count

    table = Table(data, repeatRows=1, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.85, 0.47, 0.02)),  # amber-600
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), FONT_NAME),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=orders.pdf"})

@app.put("/api/orders/{order_id}", response_model=KebabOrder)
async def edit_order(order_id: str, order_data: KebabOrderData):
    doc_ref = orders_collection.document(order_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Order not found")
    
    updated_order = KebabOrder(id=order_id, **order_data.dict())
    doc_ref.set(updated_order.dict())
    # Notify all clients of the update
    await send_update("update_order", updated_order.dict())
    return updated_order

@app.delete("/api/orders/{order_id}")
async def delete_order(order_id: str):
    doc_ref = orders_collection.document(order_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_data = doc.to_dict()
    doc_ref.delete()
    # Notify all clients of the deletion
    await send_update("delete_order", {"id": order_id, "date": order_data.get("date")})
    return {"message": "Order deleted"}

# --- Static Files and App Serving ---
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    return FileResponse("static/index.html")
