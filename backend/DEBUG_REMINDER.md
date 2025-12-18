# Debugging Reminder Email - Quick Checklist

## ❓ Reminder not coming for booking < 1 hour?

Let's debug step by step:

### ✅ Step 1: Did you run the database migration?

**Check in Supabase SQL Editor:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('reminder_sent', 'reminder_sent_at');
```

**Expected result:** Should show 2 rows
- `reminder_sent`
- `reminder_sent_at`

**If empty:** Run the migration from `scripts/add-reminder-columns.sql`

---

### ✅ Step 2: Check server logs

Look for this when admin confirms booking:
```
✅ Immediate reminder sent for booking #123
```

Or any errors like:
```
❌ Error sending immediate reminder: ...
```

---

### ✅ Step 3: Verify booking details

**Check in Supabase:**
```sql
SELECT id, start_date, start_time, status, reminder_sent, reminder_sent_at
FROM bookings
ORDER BY created_at DESC
LIMIT 1;
```

**Should show:**
- `status` = 'confirmed'
- `reminder_sent` = true (after admin confirms)
- `reminder_sent_at` = timestamp

---

### ✅ Step 4: Check email service

**Test if email service works:**
```sql
-- Check if booking confirmation email was sent
-- If confirmation email works, reminder should too
```

---

### ✅ Step 5: Manual test

**Test the reminder function manually:**

1. Open browser console on admin panel
2. Get your admin token from localStorage
3. Run this in terminal:

```bash
curl -X POST http://localhost:3005/api/admin/check-reminders \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "success": true,
  "remindersSent": 1,
  "errors": null
}
```

---

## 🐛 Common Issues

### Issue 1: Database columns missing
**Solution:** Run migration in Supabase SQL Editor

### Issue 2: Email service not configured
**Solution:** Check `.env` has `RESEND_API_KEY`

### Issue 3: Booking status not 'confirmed'
**Solution:** Admin must confirm the booking first

### Issue 4: Server not restarted after code changes
**Solution:** Stop and restart `npm start`

---

## 📝 Test Scenario

**To test < 1 hour reminder:**

1. **Create booking** with pickup time 45 minutes from now
   - Example: If now is 12:00 PM, set pickup for 12:45 PM
   
2. **Admin confirms** the booking
   
3. **Check server logs** immediately for:
   ```
   ✅ Immediate reminder sent for booking #X
   ```
   
4. **Check email** inbox

5. **Check database:**
   ```sql
   SELECT reminder_sent, reminder_sent_at 
   FROM bookings 
   WHERE id = YOUR_BOOKING_ID;
   ```
   Should show: `reminder_sent = true`

---

## 🔍 Debug Commands

**Check server is running:**
```bash
curl http://localhost:3005/
```

**Check if endpoint exists:**
```bash
curl -X POST http://localhost:3005/api/admin/check-reminders \
  -H "Content-Type: application/json"
```

**Check database connection:**
- Look for "Server is running on port 3005" in logs

---

**What error are you seeing?** Share the server logs or error message!
