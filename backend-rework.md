# Backend Architecture Rework Summary

**Date:** 2026-01-30  
**Context:** Architecture review for Kebab Koordynator real-time order management system  
**Current Scale:** Single Docker instance, max 100 concurrent users  
**Future Requirements:** User accounts, group isolation

---

## 1. Current Implementation

### Architecture
```
Frontend (React) ──SSE──► Backend (FastAPI) ──► Firestore
```

- **Real-time:** Server-Sent Events (SSE) via `/api/orders/stream`
- **Backend maintains:** In-memory queues (`sse_client_queues`) for each client
- **Updates:** Backend broadcasts events (`new_order`, `update_order`, `delete_order`) on API calls
- **Initial load:** HTTP GET `/api/orders`

### Current Backend Responsibilities
1. SSE streaming for real-time updates
2. PDF generation (ReportLab)
3. Static file serving
4. Firestore CRUD operations

---

## 2. Issues Identified

### Critical Issues
1. **No Firestore Listeners:** If data changes directly in Firestore (bypassing API), clients won't be notified
2. **Memory Leak Risk:** Abrupt client disconnects may leave queues in memory
3. **No Scalability:** In-memory queues won't work with multiple instances (though not applicable for single instance)

### Production Gaps
- No heartbeat/keep-alive for SSE connections
- No auto-reconnect logic in frontend
- No Last-Event-ID for resuming missed events
- Race condition between initial fetch and SSE connection

---

## 3. Devil's Advocate Critique

### Counter-Arguments to "Improvements"

**Firestore Listeners - Cost Problem:**
- 100 users + backend listener = 101 active listeners
- 1000 orders × 101 listeners = 101,000 reads
- Cost: ~$6/day just for listeners

**SSE + Firestore Listener = Duplication:**
- Building custom pub/sub on top of database that already has pub/sub
- Contradiction in architecture

**Heartbeat - Unnecessary:**
- SSE has built-in TCP keepalive
- Application-level heartbeat adds complexity without real benefit

**Auto-Reconnect - State Nightmare:**
- Without event history, reconnection is useless
- Client must re-fetch anyway, making SSE pointless
- Adds timing complexity

**Race Condition - Overblown:**
- Orders change slowly (humans create them)
- Millisecond gap between fetch and connect is negligible for kebab orders

### Better Alternatives Ignored
1. **Firestore client SDK directly in frontend** - eliminates backend SSE entirely
2. **Simple polling every 5 seconds** - zero complexity, works for 100 users
3. **Keep current SSE as-is** - it works, don't fix what isn't broken

---

## 4. Future Requirements Impact

### User Accounts & Group Isolation

**Challenge:** Broadcasting to all clients won't work
- Users must only see their group's orders
- SSE needs per-group filtering
- Backend must authenticate SSE connections
- Memory usage scales with groups × users

**Options with Auth:**
- One SSE stream per group (complex connection management)
- Per-user SSE with server-side filtering (resource intensive)
- Switch to Firestore SDK with security rules (simpler)

**Firestore Security Rules Required:**
```javascript
match /orders/{orderId} {
  allow read: if request.auth != null && 
              resource.data.groupId == getUserGroup(request.auth.uid);
}
```

**Data Model Changes:**
```typescript
interface KebabOrder {
  id: string;
  customerName: string;
  // ... existing fields
  groupId: string;        // NEW - for isolation
  createdBy: string;      // NEW - user ID
  createdAt: timestamp;   // NEW - for sorting
}
```

---

## 5. Can We Go Backend-Less?

### Current Backend Functions Analysis

| Function | Can Move to Frontend? | Alternative |
|----------|----------------------|-------------|
| SSE Streaming | ✅ Yes | Firestore SDK onSnapshot |
| Static File Serving | ✅ Yes | Firebase Hosting |
| Firestore Operations | ✅ Yes | Firestore SDK |
| **PDF Generation** | ❌ **No** | **Only blocker** |

### PDF Generation Options

**Option A: Client-side PDF (jsPDF, html2pdf.js)**
- ✅ No backend needed
- ❌ Limited formatting (no complex tables)
- ❌ Browser performance issues with large lists
- ❌ Font embedding issues (Polish characters)

**Option B: Firebase Cloud Functions (serverless)**
- ✅ No server maintenance
- ✅ Keep ReportLab quality
- ❌ Cold start latency (~1-3 seconds)
- ❌ Pay per invocation (~$0.40 per million)

### Future Features Requiring Backend

| Feature | Frontend-Only? | Solution |
|---------|---------------|----------|
| Payment (Stripe) | ❌ No | Needs webhook security |
| Email notifications | ⚠️ Maybe | Firebase Functions |
| Scheduled reports | ❌ No | Firebase scheduled functions |
| Image uploads | ⚠️ Maybe | Firebase Storage + rules |
| Complex analytics | ✅ Yes | Compute in browser |
| API integrations | ❌ No | Can't hide API keys |

---

## 6. Final Recommendation

### Architecture: Frontend + Minimal Backend (Cloud Function)

```
Frontend (Firebase Hosting) ──► Firestore (real-time via SDK)
         │
         └──► Cloud Function (PDF only)
              OR
         └──► Tiny Python Backend (PDF only)
```

### Why This Is Cheapest

| Component | Monthly Cost (100 users) |
|-----------|------------------------|
| Firebase Auth | **$0** (within free tier: 10k users/month) |
| Firestore | **~$5-10** (reads: 100 users × small dataset) |
| Firebase Hosting | **$0** (within free tier: 10GB/month) |
| Cloud Function (PDF) | **~$0** (2M free invocations/month) |
| **Total** | **~$5-10/month** |

### Implementation Phases

**Phase 1: Migrate to Firestore SDK**
- Remove SSE code from backend
- Add Firebase SDK to frontend
- Frontend listens directly:
  ```javascript
  db.collection('orders')
    .where('groupId', '==', currentGroupId)
    .onSnapshot(...)
  ```

**Phase 2: Add Firebase Auth**
- Use Firebase Auth (free tier)
- Store user-group mapping in Firestore
- Security rules enforce isolation

**Phase 3: Minimize Backend**
- Backend only handles PDF generation
- Verify Firebase Auth tokens
- Or replace with Cloud Function

### Trade-offs

**✅ Pros:**
- Lowest maintenance (Firebase handles auth, real-time, security)
- Scales automatically
- Group isolation via security rules
- Can host frontend on Firebase Hosting (free)
- 90% of code moves to frontend

**❌ Cons:**
- Vendor lock-in to Firebase
- Need to refactor current code
- PDF generation has 1-3s cold start (if using Cloud Functions)
- Or keep tiny Python backend for instant PDFs ($5-10/month more)

### Decision Matrix

| Approach | Monthly Cost | Maintenance | PDF Quality | Best For |
|----------|--------------|-------------|-------------|----------|
| **Full Frontend** | ~$5 | Ultra-low | Poor | No PDFs needed |
| **Frontend + Cloud Function** | ~$5-8 | Low | Good (3s delay) | Acceptable delay |
| **Frontend + Tiny Backend** | ~$10-15 | Medium | Excellent | Instant PDFs required |
| Keep Current SSE | ~$10-20 | High | Excellent | Don't refactor |

---

## 7. Key Decisions Needed

1. **Is 1-3 second PDF generation delay acceptable?**
   - Yes → Use Cloud Function
   - No → Keep tiny Python backend

2. **Timeline for user accounts?**
   - Soon (< 6 months) → Start migration now
   - Later (> 1 year) → Keep current, refactor when needed

3. **Vendor lock-in concern?**
   - Yes → Consider keeping minimal backend
   - No → Full Firebase ecosystem

---

## 8. Action Items

- [ ] Decide on PDF delay tolerance
- [ ] Confirm Firebase/Google Cloud as platform
- [ ] Estimate Firestore read costs with projected user count
- [ ] Plan migration timeline
- [ ] Document security rules for group isolation

---

## 9. Summary

**For lowest maintenance + infrastructure cost with future user accounts:**

→ **Migrate to Firestore SDK in frontend**  
→ **Use Firebase Auth for user management**  
→ **Minimize backend to PDF generation only**  
→ **Total cost: ~$5-15/month**  
→ **Maintenance: Near zero**

This approach scales automatically, handles group isolation natively via security rules, and requires minimal ongoing maintenance compared to managing SSE connections and authentication in a custom backend.
