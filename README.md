# SKILLUP

SKILLUP is a comprehensive Learning Management System built with the MERN stack (MongoDB, Express, React, Node.js), featuring role-based access control for Students, Instructors, and Admins with an attractive, modern UI.

## ✨ Features

### Student Features
- ✅ Register/Login/Logout with email verification
- ✅ Edit Profile (Photo, Bio, Skills)
- ✅ Browse and Enroll in Courses
- ✅ View My Courses with progress tracking
- ✅ Beautiful dashboard with statistics

### Instructor Features
- ✅ Create/Edit/Delete Courses
- ✅ Upload Course Thumbnails
- ✅ Add Course Materials (Videos, PDFs, Assignments)
- ✅ Course approval workflow
- ✅ Instructor dashboard with student statistics

### Admin Features
- ✅ Manage Users (Approve/Block Instructors)
- ✅ Manage Courses (Approve/Reject/Feature)
- ✅ View all users and courses
- ✅ Comprehensive admin dashboard with statistics
- ✅ **Default Admin Account**: `admin@skillup.com` / `admin123`

## 🎨 UI Features

- **Modern Design**: Clean, minimal interface with gradient backgrounds
- **Smooth Animations**: Fade-in, slide-in, and hover effects
- **Statistics Cards**: Beautiful gradient cards with icons
- **Glass Morphism**: Modern glassmorphic design elements
- **Responsive Design**: Works perfectly on all devices
- **Interactive Elements**: Hover effects, transitions, and visual feedback
- **Color Scheme**: Blue (#2563EB) primary with professional gradients

## 🛠️ Tech Stack

- **Frontend**: React, React Router, Axios, SweetAlert2, React Icons
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   cd SKILLUP
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   FRONTEND_URL=http://localhost:3000
   ```

4. **Create Upload Directories**
   ```bash
   cd server
   mkdir uploads
   mkdir uploads/profiles
   mkdir uploads/courses
   ```

5. **Run the Application**
   
   From the root directory:
   ```bash
   npm run dev
   ```
   
   Or run separately:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm start
   ```

## 🔐 Default Admin Account

When you first start the server, a default admin account is automatically created:

- **Email**: `admin@skillup.com`
- **Password**: `admin123`

⚠️ **Important**: Please change the password after first login for security!

The admin account is created automatically on server startup if it doesn't already exist.

## 🌐 Default Routes

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/logout` - Logout user

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (Instructor/Admin)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/materials` - Add course material

### Enrollments
- `POST /api/enrollments` - Enroll in course (Student)
- `GET /api/enrollments/my-courses` - Get student's courses
- `GET /api/enrollments/:courseId/check` - Check enrollment status

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/approve` - Approve user
- `PUT /api/admin/users/:id/block` - Block/Unblock user
- `GET /api/admin/courses` - Get all courses
- `PUT /api/admin/courses/:id/approve` - Approve course
- `PUT /api/admin/courses/:id/reject` - Reject course
- `PUT /api/admin/courses/:id/feature` - Feature/Unfeature course
- `DELETE /api/admin/courses/:id` - Delete course

## 👥 User Roles

1. **Student**: Can browse courses, enroll, and manage profile
2. **Instructor**: Can create/manage courses (requires admin approval)
3. **Admin**: Full system access to manage users and courses

## 🎨 UI Design

- **Primary Color**: Blue (#2563EB)
- **Secondary Color**: Light Grey (#F3F4F6)
- **Font**: Inter (Modern sans-serif)
- **Style**: Clean, minimal, professional with modern animations
- **Effects**: Glass morphism, gradients, smooth transitions

## 📝 Notes

- Email verification is required for account activation
- Instructor accounts need admin approval before they can create courses
- Course materials can be added after course creation
- All passwords are hashed using bcryptjs
- JWT tokens expire after 7 days (configurable)
- Default admin is created automatically on server startup

## 🚀 Features Highlights

- **Advanced UI**: Modern design with animations and gradients
- **Statistics Dashboard**: Real-time stats for all roles
- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: Fade-in, slide-in, and hover effects
- **Interactive Elements**: Enhanced user experience
- **Glass Morphism**: Modern design trend implementation


