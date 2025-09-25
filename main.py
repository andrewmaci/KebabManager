import asyncio
import json
import os
import uuid
from typing import List

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.responses import FileResponse
from google.cloud import firestore

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
