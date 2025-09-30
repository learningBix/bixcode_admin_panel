# BixCode Admin Panel

A separate admin panel for managing students and their credentials for the BixCode learning platform.

## Architecture

This admin panel operates as a separate microservice from the main BixCode application:

- **Admin Panel**: Manages student registration and credential generation
- **BixCode Main**: Uses admin-generated credentials for student authentication

## Features

- ✅ Student registration with auto-generated credentials
- ✅ Bulk student import
- ✅ Student management (CRUD operations)
- ✅ Credential validation API for BixCode integration
- ✅ Admin authentication and authorization
- ✅ Search and pagination
- ✅ Student statistics and analytics

## Project Structure

```
admin-panel/
├── frontend/                 # React admin interface
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── styles/          # CSS files
│   │   └── App.js          # Main app component
│   ├── public/             # Static files
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── config/         # Configuration
│   │   └── utils/          # Utilities
│   └── package.json        # Backend dependencies
└── package.json            # Root package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or remote)
- npm or yarn

### 1. Install Dependencies

```bash
# Install all dependencies (root, backend, frontend)
npm run install-all
```

### 2. Database Setup

1. Start MongoDB:
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

2. Create database: `admin_panel`

### 3. Environment Configuration

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit backend/.env with your settings
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run server  # Backend on port 5001
npm run client  # Frontend on port 3001
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register admin user
- `POST /api/auth/login` - Login admin user
- `GET /api/auth/me` - Get current admin user

### Students
- `GET /api/students` - Get all students (with search/pagination)
- `POST /api/students` - Create new student with auto-generated credentials
- `POST /api/students/bulk` - Bulk create students
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/stats` - Get student statistics

### Credential Validation (Public)
- `POST /api/students/validate-credentials` - Validate student credentials (for BixCode)

### Admin
- `GET /api/admin/dashboard` - Admin dashboard

## Auto-Generated Credentials

When a student is registered, the system automatically generates:

1. **Username**: Based on student name + random 4-digit number
   - Example: `john1234`, `sarah5678`

2. **Password**: Random 8-character alphanumeric string
   - Example: `A7k9mN2p`

These credentials are:
- ✅ Unique across all students
- ✅ Immediately available for BixCode login
- ✅ Returned to admin for sharing with students
- ✅ Securely hashed and stored in database

## BixCode Integration

The admin panel provides a public API endpoint for credential validation:

```javascript
// POST /api/students/validate-credentials
{
  "username": "john1234",
  "password": "A7k9mN2p"
}

// Response
{
  "success": true,
  "message": "Credentials valid",
  "student": {
    "id": "64f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "schoolName": "ABC School",
    "className": "Grade 5"
  }
}
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start    # React development server
```

### Building for Production
```bash
npm run build  # Builds frontend for production
npm start      # Starts production backend server
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ Role-based access control (admin only)
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Input validation and sanitization
- ✅ Helmet security headers

## Database Schema

### Students Collection
```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  schoolName: String,
  className: String,
  credentials: {
    username: String (unique),
    password: String (hashed),
    generatedAt: Date,
    isActive: Boolean
  },
  isActive: Boolean,
  registeredBy: ObjectId,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Users Collection (Admins)
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['admin']),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
