# 🍽️ Restaurant CRM Platform

A full-stack, multi-tenant Restaurant CRM and Ordering platform with role-based admin and restaurant panels, menu and customer management, order lifecycle tracking, notifications, analytics, and **WhatsApp AI ordering support**. 🚀

---

## ✨ Features

- **🏢 Multi-tenant architecture:** Each restaurant owner works in an isolated workspace.
- **🔐 Role-based authentication & authorization:**
  - 👑 Admin role
  - 👨‍🍳 Restaurant owner role
- **🚀 Restaurant onboarding:** Seamless approval flow.
- **🏪 Restaurant profile management:** Manage details, upload 🖼️ logos and cover images.
- **🍔 Menu management:**
  - CRUD operations
  - Image upload
  - Availability toggle (in-stock/out-of-stock)
- **👥 Customer CRM:**
  - Customer CRUD
  - Order history tracking
  - Automatic customer linking during order creation
- **🪑 Table management:** Optimize your dine-in workflows.
- **📋 Orders board:** Visual order lifecycle tracking with status transitions.
- **📝 Manual order booking:**
  - Direct booking from dashboard
  - Add multiple menu items
  - Support for 🍽️ Dine-in, 🥡 Takeaway, and 🚚 Delivery
- **🔔 Notifications center:** Stay updated (mark one/all as read).
- **📊 Analytics:** Operational insights and sales tracking.
- **💬 WhatsApp webhook integration:** AI-assisted ordering via Twilio sandbox.
- **🛠️ Local WhatsApp Simulator:** Test AI ordering offline with a built-in React UI!
- **📖 Swagger API documentation:** Quick and easy developer reference.

---

## 🛠️ Tech Stack

### 💻 Frontend
- ⚛️ **React 18**
- ⚡ **Vite 5**
- 🛣️ **React Router**
- 🌐 **Axios**
- 📅 **date-fns**
- 📈 **Recharts**
- 🍞 **react-hot-toast**

### ⚙️ Backend
- 🟢 **Node.js**
- 🚂 **Express**
- 🍃 **MongoDB + Mongoose**
- ✅ **Joi validation**
- 🔑 **JWT authentication**
- 🛂 **Passport (Google OAuth)**
- ☁️ **Cloudinary + Multer**
- 🗄️ **Redis client** (Optimized with fail-fast for offline development)
- 📄 **Swagger (OpenAPI)**

---

## 📂 Repository Structure

~~~text
Restaurant CRM/
  backend/
    src/
      config/
      controllers/
      middlewares/
      models/
      routes/
      services/
      utils/
      validators/
    logs/
    docs/
    package.json
  frontend/
    src/
      components/
      context/
      pages/
      services/
    package.json
  README.md
~~~

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB running locally or remotely
- Redis optional in development (backend can still run without it)

### 1) Install Dependencies

~~~bash
cd backend
npm install

cd ../frontend
npm install
~~~

### 2) Configure Backend Environment

Copy backend/.env.example to backend/.env and fill values.

Important variables:

- Server and DB
  - NODE_ENV
  - PORT
  - MONGODB_URI
- JWT
  - JWT_ACCESS_SECRET
  - JWT_REFRESH_SECRET
- Cloudinary (required for image uploads)
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
- Frontend URL for CORS
  - FRONTEND_URL
- Admin seed account
  - ADMIN_EMAIL
  - ADMIN_PASSWORD
- Optional integrations
  - Redis
  - WhatsApp
  - AI provider
  - SMTP
  - Google OAuth

### 3) Run Backend

~~~bash
cd backend
npm run dev
~~~

### 4) Run Frontend

~~~bash
cd frontend
npm run dev
~~~

### 5) Open the App

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Swagger Docs: http://localhost:5000/api-docs
- Health Check: http://localhost:5000/api/v1/health

## Admin Seeding Behavior

On backend startup, the app attempts to seed one admin account if no admin user exists.

- Uses ADMIN_EMAIL and ADMIN_PASSWORD from backend/.env
- If an admin already exists, seeding is skipped

## API Route Overview

Base URL: /api/v1

- Auth: /auth
- Admin: /admin
- Restaurant profile: /restaurant
- Menu: /restaurant/menu
- Orders: /restaurant/orders
- Customers: /restaurant/customers
- Tables: /restaurant/tables
- Notifications: /notifications
- Analytics: /restaurant/analytics
- WhatsApp webhook: /whatsapp/webhook

Use /api-docs for full interactive endpoint documentation.

## Scripts

### Backend

- npm run dev: Start backend with nodemon
- npm start: Start backend with node
- npm run lint: Run ESLint
- npm test: Placeholder test script

### Frontend

- npm run dev: Start Vite dev server
- npm run build: Production build
- npm run preview: Preview production build

## Manual Order Booking Flow

Restaurants can create orders directly from the dashboard without WhatsApp:

1. Open Dashboard
2. Click Manual Order Booking
3. Select Existing Customer or New/Walk-in
4. Add one or more items
5. Choose order type, payment method, and optional table
6. Save order

The backend calculates totals (tax, delivery fee, discount), updates customer stats, creates notifications, and tracks table occupancy for dine-in orders.

## Troubleshooting

### 1) Cannot find /auth/signup on this server

Check frontend API proxy and base URL alignment so requests resolve to /api/v1/auth.

### 2) Redis reconnecting and Redis Client Error logs

If Redis is not running locally, backend may log reconnect attempts.
This is non-blocking for most development flows.

### 3) Your account is pending admin approval

Restaurant owners cannot log in until approved by admin.

### 4) Menu image upload fails

Verify Cloudinary keys in backend/.env and ensure backend was restarted after env changes.

### 5) Manual order validation errors

Confirm payload has at least one valid item and includes delivery address for delivery orders.

## Security and Platform Notes

- Helmet, CORS, HPP, and Mongo sanitization middleware are enabled
- API and auth rate limiting are enabled
- JWT access + refresh token flow is implemented
- Password hashing with bcrypt is used

## Current Gaps / Future Improvements

- Automated test suite is not implemented yet
- CI pipeline and deployment templates can be added
- Real-time order updates (WebSocket) can be introduced
- Better chunk splitting can reduce large frontend bundle warnings

## Contributing

1. Create a feature branch
2. Make focused changes
3. Run lint/build checks
4. Open a pull request with clear notes

## License

ISC
