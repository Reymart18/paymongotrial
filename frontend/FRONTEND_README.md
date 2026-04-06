# HOA Portal - Frontend

React + Vite frontend for the HOA portal with authentication and dashboard.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API URL
Edit `.env.local` to set your backend API URL:
```
VITE_API_URL=http://localhost:3000
```

### 3. Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Features

### Authentication
- **Admin Login**: Username + Password
- **Homeowner Login**: Account ID + Password
- JWT token stored in localStorage
- Automatic redirect based on role

### Protected Routes
- `/admin/dashboard` - Admin only
- `/homeowner/dashboard` - Homeowner only
- `/login` - Public

### Components

#### LoginPage
- Dual-tab login (Admin/Homeowner)
- Form validation
- Error handling
- Responsive design

#### AdminDashboard
- Welcome card with user info
- Protected route (admin only)
- Dashboard sections
- Logout functionality

#### HomeownerDashboard
- Welcome card with account info
- Protected route (homeowner only)
- Dashboard sections
- Logout functionality

## Project Structure

```
src/
├── pages/
│   ├── LoginPage.jsx              # Login component with dual forms
│   ├── AdminDashboard.jsx         # Admin dashboard
│   └── HomeownerDashboard.jsx     # Homeowner dashboard
├── styles/
│   ├── LoginPage.css              # Login page styles
│   └── Dashboard.css              # Dashboard styles
├── App.jsx                         # Main app with routing
├── main.jsx                        # React entry point
└── index.css                       # Global styles
```

## API Endpoints

### Admin Login
```
POST /auth/login
Body: { username: string, password: string }
Response: { access_token: string }
```

### Homeowner Login
```
POST /auth/login/homeowner
Body: { accountId: string, password: string }
Response: { access_token: string }
```

## Token Storage

JWT tokens are stored in `localStorage` as:
- `token` - JWT access token
- `userRole` - User role ('admin' or 'homeowner')
- `accountId` - Account ID (homeowner only)

## Build for Production

```bash
npm run build
npm run preview
```

## Notes

- JWT token is decoded on the client side to extract user info
- Account ID is auto-converted to uppercase in homeowner form
- All routes redirect to login if no valid token
- Role-based access control is enforced
