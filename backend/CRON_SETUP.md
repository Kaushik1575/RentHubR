# Reminder Email Cron Job Setup Guide

## 🎯 Choose Your Approach

You have **two options** for running the reminder check:

### Option 1: Internal Scheduler (Built-in `setInterval`)
✅ Best for: Render, Heroku, Railway, VPS
✅ Simpler setup
❌ Doesn't work on: Vercel, Netlify Functions

### Option 2: External Cron Job
✅ Best for: Vercel, serverless platforms
✅ More reliable and scalable
✅ Works everywhere

---

## 📋 Option 1: Internal Scheduler (Default)

### Setup

Add to your `.env` file:
```env
USE_INTERNAL_CRON=true
```

### How it works
- Server runs `checkAndSendReminders()` every 15 minutes automatically
- No external service needed
- Starts when server starts

### Server logs
```
🔔 Starting internal reminder email scheduler...
✅ Internal reminder scheduler active (checking every 15 minutes)
```

---

## 🌐 Option 2: External Cron Job (Recommended for Vercel)

### Setup

**Step 1**: Disable internal cron

In your `.env` file:
```env
USE_INTERNAL_CRON=false
```

Or simply don't set it (defaults to false)

**Step 2**: Choose an external cron service

---

### 2A. Vercel Cron (Easiest for Vercel deployments)

**File**: `backend/vercel.json`

```json
{
  "crons": [{
    "path": "/api/cron/check-reminders",
    "schedule": "*/15 * * * *"
  }]
}
```

**Create cron endpoint**: `backend/api/cron/check-reminders.js`

```javascript
const { checkAndSendReminders } = require('../../services/reminderService');

module.exports = async (req, res) => {
    // Verify this is a Vercel cron request
    if (req.headers['x-vercel-cron-id']) {
        try {
            const result = await checkAndSendReminders();
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};
```

**Deploy**: Vercel will automatically run this every 15 minutes!

---

### 2B. cron-job.org (Free external service)

1. **Go to**: https://cron-job.org
2. **Sign up** for free account
3. **Create new cron job**:
   - **Title**: RentHub Reminder Check
   - **URL**: `https://your-backend.com/api/admin/check-reminders`
   - **Schedule**: `*/15 * * * *` (every 15 minutes)
   - **Request method**: POST
   - **Headers**: 
     ```
     Authorization: Bearer YOUR_ADMIN_TOKEN
     Content-Type: application/json
     ```

4. **Save** and activate

---

### 2C. Supabase Edge Function with Cron

**Create function**: `supabase/functions/check-reminders/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const response = await fetch('https://your-backend.com/api/admin/check-reminders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ADMIN_TOKEN')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
```

**Add cron trigger** in Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'check-booking-reminders',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/check-reminders',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

### 2D. GitHub Actions (Free)

**File**: `.github/workflows/reminder-cron.yml`

```yaml
name: Reminder Email Cron

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  check-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminder check
        run: |
          curl -X POST https://your-backend.com/api/admin/check-reminders \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}" \
            -H "Content-Type: application/json"
```

**Add secret**: Go to GitHub repo → Settings → Secrets → Add `ADMIN_TOKEN`

---

## 🔍 How to Test

### Test Internal Cron
```bash
# Set in .env
USE_INTERNAL_CRON=true

# Restart server
npm start

# Look for this in logs:
# ✅ Internal reminder scheduler active (checking every 15 minutes)
```

### Test External Cron
```bash
# Set in .env
USE_INTERNAL_CRON=false

# Restart server
npm start

# Look for this in logs:
# ℹ️  Internal cron disabled. Use external cron job to call /api/admin/check-reminders

# Test manually:
curl -X POST http://localhost:3005/api/admin/check-reminders \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📊 Comparison

| Feature | Internal Cron | External Cron |
|---------|--------------|---------------|
| **Setup** | Easy (1 env var) | Medium (configure service) |
| **Reliability** | Depends on server uptime | Very reliable |
| **Serverless** | ❌ No | ✅ Yes |
| **Cost** | Free | Free (most services) |
| **Monitoring** | Server logs only | External dashboard |
| **Scalability** | Limited | Excellent |

---

## 💡 Recommendations

### Use Internal Cron if:
- ✅ Deploying to Render, Heroku, Railway
- ✅ You want simplest setup
- ✅ Your server runs 24/7

### Use External Cron if:
- ✅ Deploying to Vercel
- ✅ You want better reliability
- ✅ You want monitoring dashboard
- ✅ Your backend is serverless

---

## 🔧 Cron Schedule Syntax

```
*/15 * * * *
│   │ │ │ │
│   │ │ │ └─── Day of week (0-7, 0 and 7 = Sunday)
│   │ │ └───── Month (1-12)
│   │ └─────── Day of month (1-31)
│   └───────── Hour (0-23)
└─────────────── Minute (0-59)
```

**Examples**:
- `*/15 * * * *` - Every 15 minutes
- `*/10 * * * *` - Every 10 minutes
- `0 * * * *` - Every hour (at minute 0)
- `0 */2 * * *` - Every 2 hours
- `*/5 * * * *` - Every 5 minutes

---

## ✅ Quick Decision Guide

**Where is your backend deployed?**

- **Render/Heroku/Railway** → Use Internal Cron (`USE_INTERNAL_CRON=true`)
- **Vercel** → Use Vercel Cron (Option 2A)
- **Not sure** → Use cron-job.org (Option 2B) - works everywhere!

---

## 🐛 Troubleshooting

### Internal cron not running
```bash
# Check .env file
cat .env | grep USE_INTERNAL_CRON

# Should show: USE_INTERNAL_CRON=true

# Check server logs for:
# ✅ Internal reminder scheduler active
```

### External cron not working
```bash
# Test endpoint manually first
curl -X POST https://your-backend.com/api/admin/check-reminders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Should return:
# {"success":true,"remindersSent":0}
```

---

**You're all set!** Choose the option that works best for your deployment platform. 🎉
