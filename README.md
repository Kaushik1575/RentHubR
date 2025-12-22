<div align="center">

# 🚲 RentHub - Vehicle Rental Management System

### *Your Complete Solution for Modern Vehicle Rental Management*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A comprehensive, full-stack vehicle rental platform with real-time booking, payment integration, automated notifications, and advanced admin controls.**

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-api-documentation) • [🎯 Features](#-features) • [🤝 Contributing](#-contributing)

---

</div>

## 📋 Table of Contents

- [✨ Features](#-features)
- [🎬 Demo](#-demo)
- [🛠 Tech Stack](#-tech-stack)
- [📦 Prerequisites](#-prerequisites)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🎯 Usage](#-usage)
- [🌐 Deployment](#-deployment)
- [📚 API Documentation](#-api-documentation)
- [📁 Project Structure](#-project-structure)
- [🔧 Troubleshooting](#-troubleshooting)
- [❓ FAQ](#-faq)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)
- [🙏 Acknowledgments](#-acknowledgments)

## ✨ Features

### 🎯 Core Features

<details open>
<summary><b>User Features</b></summary>

- 🔐 **Secure Authentication**
  - JWT-based user registration and login
  - Password reset via OTP email verification
  - Session management with secure tokens

- 🚗 **Vehicle Browsing & Booking**
  - Browse bikes, cars, and scooters with detailed information
  - Real-time availability checking
  - Hourly-based rental pricing
  - Intelligent booking conflict detection with date/time suggestions
  - Terms and Conditions acceptance flow

- 💳 **Payment Integration**
  - Razorpay payment gateway integration
  - Secure transaction processing
  - 30% advance payment system
  - Automatic invoice generation with QR codes
  - Transaction history tracking

- 📱 **Booking Management**
  - View all bookings in "My Bookings" dashboard
  - Real-time booking status updates
  - Booking cancellation with automatic refund calculation
  - Downloadable booking invoices (PDF)
  - Email confirmations for all booking actions

- 🆘 **SOS Emergency Feature**
  - One-click SOS activation during active rentals
  - Real-time GPS location tracking
  - Automated emergency email alerts to admin
  - Google Maps integration for precise location sharing

- 📧 **Automated Notifications**
  - Booking confirmation emails
  - Pickup reminder emails (2 hours before)
  - Cancellation and refund notifications
  - Password reset OTP emails

- 📱 **Responsive Design**
  - Mobile-first responsive interface
  - Cross-browser compatibility
  - Optimized for all screen sizes

</details>

<details>
<summary><b>Admin Features</b></summary>

- 📊 **Comprehensive Dashboard**
  - Real-time statistics and analytics
  - Total revenue tracking
  - Active bookings overview
  - User growth metrics
  - Vehicle utilization reports

- 👥 **User Management**
  - View all registered users
  - Edit user information
  - Block/unblock user accounts
  - User activity monitoring
  - Search and filter capabilities

- 🚙 **Vehicle Management**
  - Add new vehicles with images
  - Edit vehicle details and pricing
  - Delete vehicles from inventory
  - Track vehicle availability status
  - Manage vehicle categories (bike/car/scooter)

- 📅 **Booking Management**
  - View all bookings with filters
  - Confirm pending bookings
  - Reject invalid bookings
  - Cancel bookings with refund processing
  - Booking conflict resolution
  - Transaction verification

- 💰 **Refund Processing**
  - Automated refund calculation based on cancellation time
  - Time-based deduction rules:
    - 24+ hours before: 100% refund
    - 12-24 hours: 50% refund
    - Less than 12 hours: No refund
  - Razorpay auto-refund integration
  - Refund status tracking

- 📧 **Email Notifications**
  - Booking confirmation emails to users
  - SOS emergency alerts
  - Custom email templates
  - Bulk notification capabilities

- 📝 **Activity Logging**
  - Comprehensive activity logs
  - Admin action tracking
  - System event monitoring
  - Audit trail for compliance

- ⏰ **Automated Reminders**
  - Cron job for pickup reminders
  - Scheduled email notifications
  - Automated booking status updates

</details>

<details>
<summary><b>System Features</b></summary>

- 🔒 **Security**
  - JWT token-based authentication
  - bcryptjs password hashing
  - Role-based access control (RBAC)
  - Secure API endpoints
  - CORS configuration
  - Environment variable protection

- 🗄️ **Database**
  - Supabase PostgreSQL database
  - Efficient data modeling
  - Real-time data synchronization
  - Database migrations support

- 📧 **Email Service**
  - Resend API integration
  - HTML email templates
  - Reliable email delivery
  - Error handling and retry logic

- 🔄 **Real-time Features**
  - Live booking conflict detection
  - Real-time availability updates
  - Instant notification delivery
  - Dynamic pricing calculations

- 🎨 **Modern UI/UX**
  - React 19.2 with Vite
  - Hot module replacement (HMR)
  - Optimized build process
  - Fast page loads
  - Smooth animations

- 🚀 **Performance**
  - Compression middleware
  - Optimized API responses
  - Efficient database queries
  - CDN-ready static assets

</details>

## 🎬 Demo

### Key Features Showcase

**🎯 User Journey**
- Browse available vehicles (bikes, cars, scooters)
- Select vehicle and check real-time availability
- Book with Razorpay payment integration
- Receive instant email confirmation
- Get pickup reminder 2 hours before rental
- Use SOS feature during rental for emergencies
- Cancel booking with automatic refund processing

**👨‍💼 Admin Capabilities**
- Monitor dashboard with real-time statistics
- Manage users, vehicles, and bookings
- Process refunds with time-based calculations
- Track all transactions and activities
- Send automated email notifications

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose | Version |
|------------|---------|----------|
| **Node.js** | Runtime environment | 18+ |
| **Express.js** | Web framework | 4.x |
| **Supabase** | PostgreSQL database & auth | 2.38+ |
| **JWT** | Token-based authentication | 9.0+ |
| **bcryptjs** | Password hashing | 2.4+ |
| **Resend** | Email service | 6.6+ |
| **Razorpay** | Payment gateway | 2.9+ |
| **Multer** | File upload handling | 1.4+ |
| **PDFKit** | Invoice generation | 0.13+ |
| **QRCode** | QR code generation | 1.5+ |
| **Day.js** | Date/time manipulation | 1.11+ |

### Frontend
| Technology | Purpose | Version |
|------------|---------|----------|
| **React** | UI library | 19.2 |
| **Vite** | Build tool & dev server | 7.2+ |
| **React Router** | Client-side routing | 7.10+ |
| **React Hot Toast** | Toast notifications | 2.6+ |
| **CSS3** | Modern styling | - |
| **ESLint** | Code linting | 9.39+ |

### DevOps & Tools
- **Git** - Version control
- **npm** - Package management
- **Nodemon** - Development auto-reload
- **Compression** - Response compression
- **CORS** - Cross-origin resource sharing

## 📦 Prerequisites

Before you begin, ensure you have the following:

### Required Software
- ✅ **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- ✅ **npm** (comes with Node.js) or **yarn**
- ✅ **Git** - [Download](https://git-scm.com/)

### Required Accounts & API Keys
- ✅ **Supabase Account** - [Sign up](https://supabase.com/) (Free tier available)
- ✅ **Resend API Key** - [Sign up](https://resend.com/) (For email notifications)
- ✅ **Razorpay Account** - [Sign up](https://razorpay.com/) (For payment processing)

### Optional
- 📝 **Code Editor** - VS Code, WebStorm, or your preferred IDE
- 🐙 **GitHub Account** - For version control and deployment

---

## 🚀 Quick Start

Get RentHub up and running in 3 simple steps:

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/Kaushik1575/RentHub.git
cd RentHub

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment

Create `.env` file in the `backend` directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret (generate a random string)
JWT_SECRET=your_secure_jwt_secret_key_here

# Email Configuration
RESEND_API_KEY=your_resend_api_key

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Server Configuration
PORT=3005
NODE_ENV=development
```

### Step 3: Run the Application

```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

🎉 **That's it!** Open your browser and navigate to:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3005`

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Kaushik1575/RentHub.git
cd RentHub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret
JWT_SECRET=your_secure_jwt_secret_key

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key

# Server Port
PORT=3005

# Environment
NODE_ENV=production
```

### 4. Set Up Supabase Database

Run the following SQL scripts in your Supabase SQL editor:

1. Create users table
2. Create bookings table
3. Create password_reset_otps table
4. Create activity_log table

(Check `scripts/` folder for SQL files)

### 5. Configure Email Service

1. Sign up for [Resend](https://resend.com)
2. Create an API Key
3. Add the key to `RESEND_API_KEY` in your `.env` file

## ⚙️ Configuration

### 🗄️ Supabase Database Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details and wait for setup to complete

2. **Get API Credentials**
   - Navigate to **Settings** → **API**
   - Copy the following:
     - `Project URL` → `SUPABASE_URL`
     - `anon public` key → `SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Create Database Tables**
   
   Go to **SQL Editor** and run these commands:

   ```sql
   -- Users Table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     full_name VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     phone_number VARCHAR(20),
     password_hash TEXT NOT NULL,
     role VARCHAR(50) DEFAULT 'user',
     is_blocked BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Bookings Table
   CREATE TABLE bookings (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES users(id),
     vehicle_id VARCHAR(50) NOT NULL,
     vehicle_type VARCHAR(50) NOT NULL,
     start_date DATE NOT NULL,
     start_time TIME NOT NULL,
     duration INTEGER NOT NULL,
     total_amount DECIMAL(10, 2) NOT NULL,
     advance_payment DECIMAL(10, 2),
     transaction_id VARCHAR(255),
     status VARCHAR(50) DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Password Reset OTPs Table
   CREATE TABLE password_reset_otps (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     email VARCHAR(255) NOT NULL,
     otp VARCHAR(6) NOT NULL,
     expires_at TIMESTAMP NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Activity Log Table
   CREATE TABLE activity_log (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     admin_id UUID REFERENCES users(id),
     action VARCHAR(255) NOT NULL,
     details TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### 📧 Email Service Setup (Resend)

1. **Create Resend Account**
   - Sign up at [resend.com](https://resend.com)
   - Verify your email address

2. **Get API Key**
   - Go to **API Keys** section
   - Click "Create API Key"
   - Copy the key → `RESEND_API_KEY`

3. **Verify Domain (Optional for Production)**
   - Add your domain in Resend dashboard
   - Add DNS records as instructed
   - Wait for verification

### 💳 Razorpay Payment Setup

1. **Create Razorpay Account**
   - Sign up at [razorpay.com](https://razorpay.com)
   - Complete KYC verification

2. **Get API Credentials**
   - Go to **Settings** → **API Keys**
   - Generate Test/Live keys
   - Copy:
     - `Key ID` → `RAZORPAY_KEY_ID`
     - `Key Secret` → `RAZORPAY_KEY_SECRET`

3. **Configure Webhooks (Optional)**
   - Go to **Settings** → **Webhooks**
   - Add webhook URL: `https://yourdomain.com/api/payment/webhook`
   - Select events: `payment.captured`, `refund.processed`

### 🔐 JWT Secret Generation

Generate a secure random string for JWT:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use any random string generator
```

---

## 🎯 Usage

### Development Mode

**Backend Server** (with auto-reload):
```bash
cd backend
npm run dev
# Server runs on http://localhost:3005
```

**Frontend Development Server**:
```bash
cd frontend
npm run dev
# Vite dev server runs on http://localhost:5173
```

### Production Mode

**Build Frontend**:
```bash
cd frontend
npm run build
# Creates optimized production build in dist/
```

**Start Production Server**:
```bash
cd backend
npm start
# Serves both API and static frontend files
```

### Available Scripts

#### Backend Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (if configured)
```

#### Frontend Scripts
```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Testing the Application

**Test Email Service**:
```bash
curl http://localhost:3005/api/test-email
```

**Test API Endpoints**:
```bash
# Health check
curl http://localhost:3005/api/health

# Get vehicles
curl http://localhost:3005/api/vehicles/bike
```

---

## 🌐 Deployment

### Option 1: Deploy to Render

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Render Service**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `RentHub` repository

3. **Configure Settings**
   - **Name:** `renthub` (or your choice)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server-supabase.js`
   - **Plan:** Free or paid

4. **Add Environment Variables**
   Add all variables from your `.env` file to Render's Environment tab

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your app will be live at `https://your-app.onrender.com`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Option 2: Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add Environment Variables**
   - Go to your project settings
   - Add all environment variables
   - Redeploy

### Option 3: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   npm i -g heroku
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Configure**
   ```bash
   git push heroku main
   heroku config:set SUPABASE_URL=your_url
   # Add all other environment variables
   ```

## 📚 API Documentation

### Authentication Endpoints

#### User Registration
```http
POST /api/register/user
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "user@example.com",
  "phoneNumber": "1234567890",
  "password": "securepassword"
}
```

#### User Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Admin Registration
```http
POST /api/register/admin
Content-Type: application/json

{
  "adminName": "Admin Name",
  "email": "admin@example.com",
  "adminId": "ADM123",
  "password": "securepassword",
  "securityCode": "1575"
}
```

### Booking Endpoints

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicleId": "1",
  "vehicleType": "bike",
  "startDate": "2025-01-15",
  "startTime": "10:00",
  "duration": 4,
  "transactionId": "TXN123456"
}
```

#### Get User Bookings
```http
GET /api/bookings/user
Authorization: Bearer <token>
```

### Vehicle Endpoints

#### Get All Vehicles (by type)
```http
GET /api/vehicles/bike
GET /api/vehicles/car
GET /api/vehicles/scooty
```

#### Get Single Vehicle
```http
GET /api/vehicles/bike/:id
GET /api/vehicles/car/:id
GET /api/vehicles/scooty/:id
```

### Admin Endpoints

#### Dashboard Statistics
```http
GET /api/dashboard-stats
Authorization: Bearer <admin_token>
```

#### Get All Bookings
```http
GET /api/admin/bookings
Authorization: Bearer <admin_token>
```

#### Confirm Booking
```http
POST /api/admin/bookings/:id/confirm
Authorization: Bearer <admin_token>
```

## 🔧 Troubleshooting

<details>
<summary><b>Database Connection Issues</b></summary>

**Problem**: `TypeError: fetch failed` or connection timeout errors

**Solutions**:
1. Verify Supabase credentials in `.env`:
   ```bash
   # Check if all three variables are set correctly
   echo $SUPABASE_URL
   echo $SUPABASE_ANON_KEY
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. Ensure Supabase project is active (not paused)
3. Check network connectivity and firewall settings
4. Verify database tables are created correctly

</details>

<details>
<summary><b>Email Service Not Working</b></summary>

**Problem**: Emails not being sent or delivery failures

**Solutions**:
1. **Verify Resend API Key**:
   ```bash
   # Test email endpoint
   curl http://localhost:3005/api/test-email
   ```

2. **Check email configuration**:
   - Ensure `RESEND_API_KEY` is set in `.env`
   - Verify sender email is verified in Resend dashboard
   - Check Resend API quota/limits

3. **For production**: Verify domain in Resend dashboard

</details>

<details>
<summary><b>CORS Errors</b></summary>

**Problem**: `Access-Control-Allow-Origin` errors in browser console

**Solutions**:
1. **Development**: Ensure frontend runs on `http://localhost:5173`
2. **Production**: Update CORS configuration in `server-supabase.js`:
   ```javascript
   app.use(cors({
     origin: ['https://yourdomain.com', 'http://localhost:5173'],
     credentials: true
   }));
   ```

</details>

<details>
<summary><b>Payment Integration Issues</b></summary>

**Problem**: Razorpay payment not working or failing

**Solutions**:
1. **Verify Razorpay credentials**:
   - Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`
   - Ensure using correct Test/Live mode keys

2. **Test mode**: Use Razorpay test cards:
   - Card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date

3. **Check webhook configuration** for auto-refunds

</details>

<details>
<summary><b>Build Errors</b></summary>

**Problem**: `npm run build` fails

**Solutions**:
1. **Clear cache and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node.js version**:
   ```bash
   node --version  # Should be v18 or higher
   ```

3. **Frontend build issues**:
   ```bash
   cd frontend
   npm run lint  # Check for linting errors
   ```

</details>

<details>
<summary><b>Port Already in Use</b></summary>

**Problem**: `EADDRINUSE: address already in use :::3005`

**Solutions**:
1. **Find and kill the process**:
   ```bash
   # Windows
   netstat -ano | findstr :3005
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -i :3005
   kill -9 <PID>
   ```

2. **Or change the port** in `.env`:
   ```env
   PORT=3006
   ```

</details>

---

## ❓ FAQ

<details>
<summary><b>How do I add new vehicles to the system?</b></summary>

**As Admin**:
1. Login to admin dashboard
2. Navigate to "Vehicle Management"
3. Click "Add New Vehicle"
4. Fill in vehicle details:
   - Name, model, type (bike/car/scooter)
   - Hourly rate
   - Upload vehicle image
5. Click "Save"

**Programmatically**: Add vehicle data to Supabase `vehicles` table or JSON files in `data/` directory.

</details>

<details>
<summary><b>How do I configure payment gateway for production?</b></summary>

1. **Get Live Razorpay Keys**:
   - Complete KYC verification on Razorpay
   - Switch to "Live Mode" in dashboard
   - Generate new API keys

2. **Update `.env`**:
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   ```

3. **Configure Webhooks**:
   - Add webhook URL: `https://yourdomain.com/api/payment/webhook`
   - Enable events: `payment.captured`, `refund.processed`

4. **Test thoroughly** before going live!

</details>

<details>
<summary><b>How can I customize email templates?</b></summary>

Email templates are located in `backend/templates/` directory:

1. **Booking Confirmation**: Edit `bookingConfirmation.html`
2. **Password Reset**: Edit email template in `controllers/auth.controller.js`
3. **SOS Alert**: Edit template in `controllers/sos.controller.js`

**Example**:
```javascript
// In emailService.js
const html = `
  <h1>Custom Email Template</h1>
  <p>Your booking details...</p>
`;
```

</details>

<details>
<summary><b>How do I deploy to production?</b></summary>

**Recommended: Render.com**

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set build command: `npm install`
5. Set start command: `cd backend && npm start`
6. Add all environment variables
7. Deploy!

**See [Deployment](#-deployment) section for detailed steps.**

</details>

<details>
<summary><b>What is the SOS feature and how does it work?</b></summary>

The **SOS Emergency Feature** allows users to send emergency alerts during active rentals:

1. **Activation**: User clicks SOS button during rental
2. **Location Capture**: System captures GPS coordinates
3. **Email Alert**: Automated email sent to admin with:
   - User details
   - Vehicle information
   - Exact GPS location
   - Google Maps link
4. **Admin Response**: Admin can contact user immediately

**Use Case**: Vehicle breakdown, accidents, or emergencies

</details>

<details>
<summary><b>How are refunds calculated?</b></summary>

Refunds are calculated based on cancellation time:

| Cancellation Time | Refund Amount |
|-------------------|---------------|
| 24+ hours before pickup | 100% refund |
| 12-24 hours before | 50% refund |
| Less than 12 hours | No refund |

**Automatic Processing**:
- Razorpay auto-refund integration
- Email notification sent to user
- Refund status tracked in database

**Note**: Only the 30% advance payment is refunded (not full amount)

</details>

<details>
<summary><b>Can I use this project for commercial purposes?</b></summary>

**Yes!** This project is licensed under the MIT License, which allows:
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use

**Requirements**:
- Include original license and copyright notice
- No warranty provided

**Recommended**: Customize branding, add your own features, and deploy!

</details>

<details>
<summary><b>How do I enable automated pickup reminders?</b></summary>

Pickup reminders are **already configured** via cron job:

1. **Cron Job**: Runs every hour checking upcoming bookings
2. **Trigger**: Sends email 2 hours before pickup time
3. **Endpoint**: `/api/cron/reminders`

**For production deployment**:
- **Render**: Add cron job in dashboard
- **Vercel**: Use Vercel Cron
- **Manual**: Set up external cron service to hit endpoint

**Configuration**: Edit `utils/scheduler.js` to customize timing

</details>

---

## 📁 Project Structure

```
RentHubR/
├── backend/                    # Backend server
│   ├── config/                 # Configuration files
│   │   ├── emailService.js     # Resend email service
│   │   ├── razorpay.js         # Razorpay payment config
│   │   └── supabase.js         # Supabase client setup
│   ├── controllers/            # Route controllers
│   │   ├── admin.controller.js # Admin operations
│   │   ├── auth.controller.js  # Authentication
│   │   ├── booking.controller.js # Booking management
│   │   ├── payment.controller.js # Payment processing
│   │   ├── sos.controller.js   # SOS emergency alerts
│   │   └── vehicle.controller.js # Vehicle operations
│   ├── middleware/             # Express middleware
│   │   └── authMiddleware.js   # JWT verification
│   ├── models/                 # Data models
│   │   └── supabaseDB.js       # Database operations
│   ├── routes/                 # API routes
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── payment.routes.js
│   │   ├── sos.routes.js
│   │   └── vehicle.routes.js
│   ├── scripts/                # Database scripts
│   │   └── migrations/         # SQL migration files
│   ├── services/               # Business logic
│   │   ├── bookingConfirmation.js
│   │   └── refundService.js
│   ├── templates/              # Email templates
│   │   └── bookingConfirmation.html
│   ├── utils/                  # Utility functions
│   │   ├── invoiceGenerator.js # PDF invoice generation
│   │   ├── refundCalculator.js # Refund logic
│   │   ├── scheduler.js        # Cron jobs
│   │   └── validators.js       # Input validation
│   ├── .env                    # Environment variables
│   ├── package.json
│   └── server-supabase.js      # Main server file
│
├── frontend/                   # React frontend
│   ├── public/                 # Static assets
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/             # Images, fonts, etc.
│   │   ├── components/         # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── VehicleCard.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── VehicleList.jsx
│   │   │   ├── BookingPage.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── SOSActivate.jsx
│   │   ├── App.jsx             # Main app component
│   │   ├── App.css
│   │   ├── index.css           # Global styles
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json             # Vercel deployment config
│
├── .git/                       # Git repository
├── .gitignore
└── README.md                   # This file
```

### Key Directories Explained

- **`backend/controllers/`** - Handle HTTP requests and responses
- **`backend/models/`** - Database interaction layer
- **`backend/routes/`** - API endpoint definitions
- **`backend/services/`** - Business logic and external service integrations
- **`backend/utils/`** - Helper functions and utilities
- **`frontend/src/pages/`** - React page components
- **`frontend/src/components/`** - Reusable React components

---

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **Role-Based Access Control** - Separate admin and user permissions
- **CORS Configuration** - Cross-origin request handling
- **Environment Variables** - Sensitive data protection

## 📧 Email Notifications

The system sends automated emails for:
- **Booking Confirmations** - When admin confirms a booking
- **Password Reset** - OTP for password recovery
- **Refund Completion** - When refund is processed

Configure email in `.env`:
```env
RESEND_API_KEY=your_resend_api_key
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test email service
curl http://localhost:3005/test-email
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kaushik Das**
- GitHub: [@Kaushik1575](https://github.com/Kaushik1575)
- Email: dask64576@gmail.com

## 🙏 Acknowledgments

- Supabase for the amazing database platform
- Express.js for the web framework
- Font Awesome for the icons
- All the open-source contributors

## 📞 Support

For support, email dask64576@gmail.com or open an issue on GitHub.

## 🎯 Future Enhancements

- [ ] Real-time chat support for customer service
- [ ] SMS notifications via Twilio
- [ ] Mobile app (React Native/Flutter)
- [ ] Advanced analytics dashboard with charts
- [ ] Multi-language support (i18n)
- [ ] Vehicle tracking with GPS integration
- [ ] Loyalty program and rewards system
- [ ] Integration with Google Maps for directions
- [ ] AI-powered vehicle recommendations
- [ ] Blockchain-based booking verification

---

⭐ If you find this project helpful, please give it a star on GitHub!

**Happy Coding! 🚀**

