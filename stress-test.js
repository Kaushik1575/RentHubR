import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = 'https://rent-hub-r.vercel.app';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm-up: 50 users
    { duration: '1m',  target: 150 },  // Ramping up: 150 users
    { duration: '1m30s', target: 250 }, // Peak Full-Site Stress: 250 concurrent users
    { duration: '1m',  target: 250 },  // Sustained Peak
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<4000'], // 95% of requests under 4 seconds under full load
    http_req_failed: ['rate<0.05'],    // Less than 5% error rate
  },
};

export default function () {
  const roll = Math.random();

  // ========================================================
  // JOURNEY 1: The Vehicle Hunter (Detailed Catalog & Item Deep Dive) - 40% of users
  // ========================================================
  if (roll < 0.40) {
    group('01_Vehicle_Catalog_DeepDive', function () {
      // 1. Visit Home
      const resHome = http.get(`${BASE_URL}/`);
      check(resHome, { 'Home Page 200': (r) => r.status === 200 });
      sleep(1);

      // 2. Fetch Active Offers
      const resOffers = http.get(`${BASE_URL}/api/offers/active`);
      check(resOffers, { 'Active Offers 200': (r) => r.status === 200 });

      // 3. Browse Bikes
      const resBikes = http.get(`${BASE_URL}/api/vehicles/bikes`);
      check(resBikes, { 'Bikes Catalog 200': (r) => r.status === 200 });

      // Deep inspection: Try fetching individual vehicle details if list returned items
      try {
        const bikesData = JSON.parse(resBikes.body);
        const list = bikesData.data || bikesData.vehicles || bikesData;
        if (Array.isArray(list) && list.length > 0) {
          const sample = list[Math.floor(Math.random() * list.length)];
          const sampleId = sample._id || sample.id;
          if (sampleId) {
            const detailRes = http.get(`${BASE_URL}/api/vehicles/bikes/${sampleId}`);
            check(detailRes, { 'Bike Single Details 200': (r) => r.status === 200 });

            // Check vehicle schedule
            const schedRes = http.get(`${BASE_URL}/api/vehicles/bikes/${sampleId}/schedule`);
            check(schedRes, { 'Vehicle Schedule API 200': (r) => r.status === 200 || r.status === 400 });
          }
        }
      } catch (e) {}

      // 4. Browse Cars & Scooters
      http.get(`${BASE_URL}/api/vehicles/cars`);
      http.get(`${BASE_URL}/api/vehicles/scooty`);
      sleep(1.5);
    });

  // ========================================================
  // JOURNEY 2: Authentication & Account Portal - 20% of users
  // ========================================================
  } else if (roll < 0.60) {
    group('02_Auth_and_Accounts', function () {
      // Visit Login page
      const resLogin = http.get(`${BASE_URL}/login`);
      check(resLogin, { 'Login Page 200': (r) => r.status === 200 });

      sleep(0.8);

      // Visit Registration page
      const resReg = http.get(`${BASE_URL}/register-user`);
      check(resReg, { 'Register Page 200': (r) => r.status === 200 });

      // Visit Forgot Password
      const resForgot = http.get(`${BASE_URL}/forgot-password`);
      check(resForgot, { 'Forgot Password Page 200': (r) => r.status === 200 });

      // Visit Profile
      http.get(`${BASE_URL}/profile`);
      sleep(1);
    });

  // ========================================================
  // JOURNEY 3: Customer Support, Issues & E-Query - 15% of users
  // ========================================================
  } else if (roll < 0.75) {
    group('03_Support_and_Tickets', function () {
      // Support Home
      const resSupp = http.get(`${BASE_URL}/support`);
      check(resSupp, { 'Support Page 200': (r) => r.status === 200 });

      // Track Issue Page
      const resIssue = http.get(`${BASE_URL}/track-issue`);
      check(resIssue, { 'Track Issue Page 200': (r) => r.status === 200 });

      // E-Query Portal
      const resEquey = http.get(`${BASE_URL}/e-query`);
      check(resEquey, { 'E-Query Page 200': (r) => r.status === 200 });

      // Query track issue endpoint with sample id
      const trackRes = http.get(`${BASE_URL}/api/support/track/SAMPLE-12345`);
      check(trackRes, { 'Issue Tracker API Handled': (r) => r.status === 200 || r.status === 404 });

      sleep(1.2);
    });

  // ========================================================
  // JOURNEY 4: Booking & Emergency SOS Flow - 15% of users
  // ========================================================
  } else if (roll < 0.90) {
    group('04_Booking_and_SOS', function () {
      // Booking Form
      const resBookForm = http.get(`${BASE_URL}/booking-form`);
      check(resBookForm, { 'Booking Form Page 200': (r) => r.status === 200 });

      // Track Booking Page
      const resTrack = http.get(`${BASE_URL}/track-booking`);
      check(resTrack, { 'Track Booking Page 200': (r) => r.status === 200 });

      // My Bookings Page
      const resMyBook = http.get(`${BASE_URL}/my-bookings`);
      check(resMyBook, { 'My Bookings Page 200': (r) => r.status === 200 });

      // SOS Emergency Page
      const resSOS = http.get(`${BASE_URL}/sos-activate`);
      check(resSOS, { 'SOS Emergency Page 200': (r) => r.status === 200 });

      sleep(1);
    });

  // ========================================================
  // JOURNEY 5: Information & About/Contact - 10% of users
  // ========================================================
  } else {
    group('05_Company_and_Contact', function () {
      const resAbout = http.get(`${BASE_URL}/about`);
      check(resAbout, { 'About Page 200': (r) => r.status === 200 });

      const resContact = http.get(`${BASE_URL}/contact`);
      check(resContact, { 'Contact Page 200': (r) => r.status === 200 });

      sleep(1);
    });
  }
}
