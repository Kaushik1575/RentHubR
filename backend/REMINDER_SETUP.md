# Quick Start Guide - Reminder Email System

## 🚀 Setup (5 minutes)

### Step 1: Run Database Migration

1. Open Supabase Dashboard
2. Go to **SQL Editor** → **New Query**
3. Copy and paste this SQL:

```sql
-- Add reminder tracking columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_check 
ON bookings(status, reminder_sent, start_date, start_time) 
WHERE status = 'confirmed' AND (reminder_sent IS NULL OR reminder_sent = FALSE);
```

4. Click **Run** ✅

### Step 2: Restart Backend Server

```bash
cd backend
npm start
```

Look for this in the logs:
```
🔔 Starting reminder email scheduler...
✅ Reminder scheduler active (checking every 15 minutes)
```

---

## ✅ Quick Test (2 minutes)

### Test Immediate Reminder (< 2 hours)

1. **Create a booking** with pickup time **1.5 hours from now**
   - Example: If it's 2:00 PM now, set pickup for 3:30 PM

2. **Admin confirms the booking**

3. **Check your email** - You should receive:
   ```
   Subject: 🔔 Reminder: Your [Vehicle] pickup is in less than 2 hours!
   ```

4. **Verify in database**:
   ```sql
   SELECT id, start_date, start_time, reminder_sent, reminder_sent_at 
   FROM bookings 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   
   Should show: `reminder_sent = true`

---

## 🧪 Test Scenarios

### Scenario 1: Booking < 1 Hour Before Pickup
- **Setup**: Create booking for 45 minutes from now
- **Expected**: Immediate urgent reminder
- **Subject**: "Your [Vehicle] pickup is very soon!"
- **Message**: "Your booking starts very soon! Please be ready for pickup."

### Scenario 2: Booking 1-2 Hours Before Pickup
- **Setup**: Create booking for 1.5 hours from now
- **Expected**: Immediate reminder
- **Subject**: "Your [Vehicle] pickup is in less than 2 hours!"
- **Message**: "Your booking starts in less than 2 hours."

### Scenario 3: Booking > 2 Hours Before Pickup
- **Setup**: Create booking for 3 hours from now
- **Expected**: Reminder sent by scheduled job ~2 hours before pickup
- **Subject**: "Your [Vehicle] pickup is in 2 hours!"
- **Message**: "Your booking starts in 2 hours."

---

## 🔍 Manual Testing

### Trigger Reminder Check Manually

Use this API endpoint to test without waiting:

```bash
curl -X POST http://localhost:3005/api/admin/check-reminders \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "remindersSent": 1,
  "errors": null
}
```

---

## 📊 Monitor Logs

### Successful Reminder
```
⏰ Running scheduled reminder check...
🔍 Checking for bookings that need reminder emails...
📋 Found 3 bookings to check
📅 Booking #45: 1.85 hours until pickup
✅ Reminder sent for booking #45 to user@example.com
✅ Reminder check complete. Sent 1 reminders.
```

### No Reminders Needed
```
⏰ Running scheduled reminder check...
🔍 Checking for bookings that need reminder emails...
✅ No bookings need reminders at this time.
```

---

## ⚠️ Troubleshooting

### Problem: No reminder email received

**Check 1**: Database columns exist
```sql
\d bookings
-- Look for: reminder_sent, reminder_sent_at
```

**Check 2**: Server is running with scheduler
```
✅ Reminder scheduler active (checking every 15 minutes)
```

**Check 3**: Booking status is 'confirmed'
```sql
SELECT id, status FROM bookings WHERE id = YOUR_BOOKING_ID;
```

**Check 4**: Email service is working
- Check `.env` file has `RESEND_API_KEY`
- Test with regular booking confirmation email

### Problem: Duplicate emails

**Solution**: Reset reminder flag
```sql
UPDATE bookings 
SET reminder_sent = FALSE, reminder_sent_at = NULL 
WHERE id = YOUR_BOOKING_ID;
```

---

## 📝 Configuration

### Change Reminder Time (from 2 hours to X hours)

Edit `backend/services/reminderService.js` line ~140:

```javascript
// Current: 2 hours
if (hoursUntilPickup <= 2 && hoursUntilPickup >= 0) {
    shouldSendReminder = true;
}

// Change to 3 hours:
if (hoursUntilPickup <= 3 && hoursUntilPickup >= 0) {
    shouldSendReminder = true;
}
```

### Change Check Frequency (from 15 minutes to X minutes)

Edit `backend/server-supabase.js` line ~2798:

```javascript
// Current: 15 minutes
const REMINDER_CHECK_INTERVAL = 15 * 60 * 1000;

// Change to 10 minutes:
const REMINDER_CHECK_INTERVAL = 10 * 60 * 1000;
```

---

## ✅ Verification Checklist

Before going to production:

- [ ] Database migration completed successfully
- [ ] Server shows "Reminder scheduler active" message
- [ ] Test booking < 1 hour: Immediate urgent reminder ✅
- [ ] Test booking 1-2 hours: Immediate reminder ✅
- [ ] Test booking > 2 hours: Scheduled reminder works ✅
- [ ] No duplicate emails sent ✅
- [ ] Manual trigger endpoint works ✅
- [ ] Email template looks good on mobile ✅

---

## 🎯 Production Deployment

### If using Render/Heroku/Railway:
✅ **No changes needed** - Current implementation works!

### If using Vercel:
⚠️ **Need to modify** - See walkthrough.md for Vercel Cron setup

---

## 📞 Need Help?

1. Check `walkthrough.md` for detailed documentation
2. Review server logs for error messages
3. Test manual trigger endpoint first
4. Verify database migration completed

---

**You're all set! 🎉**

The reminder email system is now active and will automatically send emails 2 hours before pickup time.
