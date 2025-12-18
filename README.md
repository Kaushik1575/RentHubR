# 🚲 RentHub - Vehicle Rental Management System

A comprehensive, full-stack vehicle rental system built with Node.js, Express, and Supabase. Manage bike, car, and scooter rentals with an intuitive admin dashboard and user-friendly booking interface.

![RentHub](https://img.shields.io/badge/RentHub-Vehicle%20Rental-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.x-orange)
![Supabase](https://img.shields.io/badge/Supabase-2.x-green)

## 📋 Table of Contents
by jitu
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### User Features
- ✅ User registration and authentication with JWT
- ✅ Browse bikes, cars, and scooters
- ✅ Real-time booking with conflict detection
- ✅ Terms and Conditions acceptance
- ✅ My Bookings management
- ✅ Password reset via OTP email
- ✅ Booking cancellation with automatic refund calculation
- ✅ Responsive mobile-friendly design

### Admin Features
- ✅ Comprehensive admin dashboard with real-time statistics
- ✅ User management (view, edit, block/unblock users)
- ✅ Vehicle management (add, edit, delete vehicles)
- ✅ Booking management (confirm, reject, cancel bookings)
- ✅ Refund processing with time-based deductions
- ✅ Email notifications for booking confirmations
- ✅ Activity logging and reporting

### System Features
- ✅ Multi-vehicle support (bikes, cars, scooters)
- ✅ Time-based booking conflict detection
- ✅ Automatic refund calculation
- ✅ Email service integration
- ✅ Secure password hashing
- ✅ Role-based access control

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - Database and authentication
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **Resend** - Email service
- **Multer** - File upload handling

### Frontend
- **HTML5/CSS3** - Modern markup and styling
- **JavaScript (ES6+)** - Interactive functionality
- **Font Awesome** - Icons
- **Responsive Design** - Mobile-first approach

### Database
- **Supabase PostgreSQL** - Production database
- **JSON files** - Development storage

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase Account** (for production)
- **Resend API Key** (for email notifications)

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


### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy Project URL and anon key
4. Copy service role key from Project API keys

### Email Service Setup

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password for "Mail"
3. Use this app password (not your regular password)
4. Add to `.env` file

## 🎯 Usage

### Development

```bash
# Start the development server
npm run dev

# Or start with nodemon for auto-reload
npm start
```

The application will be available at `http://localhost:3005`

### Production

```bash
# Start the production server
node server-supabase.js
```

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

## 📁 Project Structure

```
RentHub/
├── config/              # Configuration files

│   ├── emailService.js  # Email service functions
│   └── supabase.js      # Supabase client setup
├── data/                # JSON data files (development)
│   ├── bikes.json
│   ├── cars.json
│   ├── bookings.json
│   └── users.json
├── models/              # Data models
│   ├── User.js
│   ├── Bike.js
│   ├── Booking.js
│   └── supabaseDB.js
├── public/              # Frontend files
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript modules
│   ├── photo/          # Images and assets
│   ├── index.html       # Home page
│   ├── admin.html       # Admin dashboard
│   └── ...
├── scripts/             # Database migration scripts
├── server-supabase.js   # Main server file (Production)
├── server.js            # JSON-based server (Development)
└── package.json
```

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

- [ ] Real-time chat support
- [ ] Payment gateway integration (Stripe, Razorpay)
- [ ] SMS notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Vehicle tracking with GPS

---

⭐ If you find this project helpful, please give it a star on GitHub!

**Happy Coding! 🚀**

