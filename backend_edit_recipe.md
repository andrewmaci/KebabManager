# Backend Edit Recipe - Fix Order Update Bug

## Problem Summary

When an admin edits an order, the `date` field is lost because:
1. Frontend sends `KebabOrderData` without the `date` field during edits
2. Backend PUT endpoint overwrites the entire Firestore document
3. Order disappears from the current day's view since `date` becomes `null`

## Solution Overview

**Approach**: Backend preserves existing fields during partial updates
**HTTP Method**: Change from PUT to PATCH (semantic correctness)
**Key Principle**: Backend is the source of truth, defensively preserves critical fields

---

## Implementation Steps

### Step 1: Update `main.py` - Modify the Edit Endpoint

**File**: `/home/andrew/Work/MyProjects/KebabManager/main.py`

**Changes**:
1. Change route decorator from `@app.put` to `@app.patch`
2. Fetch existing document before updating
3. Preserve `date` field if not provided in request
4. Optionally preserve other system fields (future-proofing)

**Code Changes**:

```python
# OLD CODE (lines 175-185):
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

# NEW CODE:
@app.patch("/api/orders/{order_id}", response_model=KebabOrder)
async def edit_order(order_id: str, order_data: KebabOrderData):
    doc_ref = orders_collection.document(order_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get existing data to preserve fields not sent by client
    existing_data = doc.to_dict()
    
    # Prepare update data, preserving date if not provided
    update_data = order_data.dict()
    if update_data.get('date') is None:
        update_data['date'] = existing_data.get('date')
    
    # Create updated order with preserved fields
    updated_order = KebabOrder(id=order_id, **update_data)
    
    # Update the document (still using set for full replacement, but with preserved data)
    doc_ref.set(updated_order.dict())
    
    # Notify all clients of the update
    await send_update("update_order", updated_order.dict())
    return updated_order
```

---

### Step 2: Update `App.tsx` - Change HTTP Method

**File**: `/home/andrew/Work/MyProjects/KebabManager/App.tsx`

**Changes**:
1. Change `handleEditOrder` to use PATCH instead of PUT

**Code Changes**:

```typescript
// OLD CODE (lines 189-199):
const handleEditOrder = async (id: string, data: KebabOrderData) => {
  try {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Failed to edit order:", error);
  }
};

// NEW CODE:
const handleEditOrder = async (id: string, data: KebabOrderData) => {
  try {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Failed to edit order:", error);
  }
};
```

---

## Why This Approach?

### 1. **Semantic Correctness**
- **PUT**: Should replace the entire resource (idempotent)
- **PATCH**: Should apply partial modifications (what we're actually doing)
- This follows HTTP/REST best practices

### 2. **Defensive Programming**
- Backend validates and preserves critical fields
- Works even if frontend forgets to send certain fields
- Prevents data corruption from malformed requests

### 3. **Maintainability**
- Explicit logic that's easy to understand
- Self-documenting: "if date not provided, use existing"
- Easy to extend (e.g., add `updatedAt` timestamp preservation)

### 4. **Production-Ready**
- Handles edge cases (missing fields, null values)
- Clear error handling (404 if order not found)
- Audit-friendly (can log what changed)

---

## Testing Checklist

After implementation, verify:

- [ ] Edit an order as admin - it stays in today's list
- [ ] Edit an order and change the date - new date is respected
- [ ] Edit an order without changing date - original date preserved
- [ ] Try to edit non-existent order - returns 404
- [ ] SSE events still propagate correctly to all clients
- [ ] PDF generation still works with updated orders
- [ ] Statistics page reflects updated orders correctly

---

## Future Enhancements

Consider adding these for even more robustness:

1. **Audit Trail**: Add `createdAt` and `updatedAt` timestamps
   ```python
   from datetime import datetime
   update_data['updatedAt'] = datetime.now().isoformat()
   ```

2. **Optimistic Locking**: Add `version` field to prevent concurrent edit conflicts

3. **Field Validation**: Validate that `date` format is `YYYY-MM-DD`

4. **Partial Update with Firestore `update()`**: 
   - Use `doc_ref.update()` instead of `set()` for true partial updates
   - More efficient but requires careful handling of nested objects

---

## Related Files

- `main.py` - Backend API (lines 175-185)
- `App.tsx` - Frontend API call (lines 189-199)
- `OrderItem.tsx` - Edit form component
- `types.ts` - Type definitions

---

**Estimated Implementation Time**: 5 minutes
**Risk Level**: Low (simple, well-understood change)
**Rollback Plan**: Revert to PUT method if issues arise
