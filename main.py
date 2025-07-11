import asyncio
import json
import uuid
from typing import List

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.responses import FileResponse

# --- Models ---
class KebabOrderData(BaseModel):
    customerName: str
    kebabType: str
    size: str
    sauce: str
    meatType: str

class KebabOrder(KebabOrderData):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

# --- In-memory database & SSE Client Queues ---
db: List[KebabOrder] = []
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
async def get_orders():
    return db

@app.post("/api/orders", response_model=KebabOrder)
async def add_order(order_data: KebabOrderData):
    new_order = KebabOrder(**order_data.dict())
    db.append(new_order)
    # Notify all clients of the new order
    await send_update("new_order", new_order.dict())
    return new_order

@app.put("/api/orders/{order_id}", response_model=KebabOrder)
async def edit_order(order_id: str, order_data: KebabOrderData):
    for i, order in enumerate(db):
        if order.id == order_id:
            updated_order = KebabOrder(id=order_id, **order_data.dict())
            db[i] = updated_order
            # Notify all clients of the update
            await send_update("update_order", updated_order.dict())
            return updated_order
    raise HTTPException(status_code=404, detail="Order not found")

@app.delete("/api/orders/{order_id}")
async def delete_order(order_id: str):
    for i, order in enumerate(db):
        if order.id == order_id:
            del db[i]
            # Notify all clients of the deletion
            await send_update("delete_order", {"id": order_id})
            return {"message": "Order deleted"}
    raise HTTPException(status_code=404, detail="Order not found")

# --- Static Files and App Serving ---
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    return FileResponse("static/index.html")