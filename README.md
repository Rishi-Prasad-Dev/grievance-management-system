# Grievance Management System

A full-stack web application for handling student grievances through separate interfaces for students, faculty, and administrators.

## Overview

The system provides a centralized workflow for submitting, processing, tracking, and resolving student complaints. It also supports information requests, complaint feedback, profile management, and image attachments.

The application consists of:

- A React frontend built with Vite
- A Node.js/Express backend
- MongoDB for persistent data storage
- JWT-based authentication
- Role-specific student, faculty, and administrator interfaces

## Key Features

### Student

- Student registration and authentication
- Student dashboard
- Complaint submission
- Complaint image attachments
- Complaint status tracking
- Student profile management
- Profile image management
- Faculty information requests and student responses
- Complaint feedback with ratings and comments

### Faculty

- Faculty registration and authentication
- Faculty dashboard
- Faculty profile management
- Responsibility/problem-type management
- Viewing complaints assigned to relevant responsibility areas
- Complaint processing and status updates
- Complaint history
- Information requests to students
- Profile image management

### Administrator

- Administrator registration and authentication
- Administrator dashboard
- Complaint overview and management
- Student management
- Faculty management
- Feedback overview and statistics
- Administrator profile management
- Profile image management

## Complaint Workflow

Complaints support the following statuses:

```text
Pending
   ↓
Acknowledged
   ↓
In Progress
   ↓
Resolved / Closed
```

Additional states include:

```text
On Hold
Rejected
```

Faculty can request additional information from a student while processing a complaint. Students can submit a response and an optional attachment to the request.

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development server and build tooling |
| React Router | Client-side routing |
| Axios | HTTP requests |
| React Icons | Interface icons |
| Boxicons | Interface icons |
| React Toastify | Notifications |
| CSS | Styling |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Server-side runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| JSON Web Token | Authentication |
| bcrypt | Password hashing |
| Joi | Request validation |
| Multer | File uploads |
| CORS | Cross-origin requests |
| dotenv | Environment configuration |
| body-parser | Request body parsing |

## Architecture

```text
                    ┌─────────────────────┐
                    │     React + Vite    │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                         HTTP / Axios
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express.js API    │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Authentication    Application       File Uploads
             │              Routes             │
             │                │                │
             ▼                ▼                ▼
            JWT          MongoDB/Mongoose   uploads/
```

## Project Structure

```text
grievance-management-system/
│
├── backend/
│   ├── Controllers/
│   │   └── AuthController.js
│   │
│   ├── Middlewares/
│   │   ├── Auth.js
│   │   └── AuthValidation.js
│   │
│   ├── Models/
│   │   ├── Admin.js
│   │   ├── Complain.js
│   │   ├── db.js
│   │   ├── Faculty.js
│   │   ├── Feedback.js
│   │   ├── InfoRequest.js
│   │   └── Student.js
│   │
│   ├── Routes/
│   │   ├── AdminManagementRoutes.js
│   │   ├── AdminProfileRoutes.js
│   │   ├── AuthRouter.js
│   │   ├── ComplainRoutes.js
│   │   ├── FacultyProfileRoutes.js
│   │   ├── FeedbackRoutes.js
│   │   ├── ImageRoutes.js
│   │   ├── InfoRequestRoutes.js
│   │   └── StudentProfileRoutes.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── faculty/
│   │   │   └── student/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── RefreshHandler.js
│   │   └── utils.js
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Backend API Areas

| Route | Functionality |
|---|---|
| `/auth` | Authentication and registration |
| `/complain` | Complaint operations |
| `/info-requests` | Faculty information requests and student responses |
| `/feedback` | Complaint feedback |
| `/auth/Student` | Student profile operations |
| `/auth/Faculty` | Faculty profile operations |
| `/auth/Admin` | Administrator profile operations |
| `/admin-manage` | Administrative student/faculty management |
| `/images` | Image upload and image management |

## Data Models

The backend uses Mongoose models for the following entities:

- **Student**
- **Faculty**
- **Admin**
- **Complain**
- **Feedback**
- **InfoRequest**

Complaints contain information such as the complaint title, problem type, description, submission date, optional attachment, status, and the faculty member who last updated the complaint.

Feedback is associated with a complaint and supports a rating from 1 to 5 along with comments.

Information requests associate a complaint with a faculty message and a student's response, including an optional response attachment.

## Authentication

Authentication is implemented using JSON Web Tokens.

The backend authentication middleware:

- Reads the authorization token from the request
- Verifies the token using the configured JWT secret
- Attaches the decoded user information to the request
- Rejects missing, invalid, or expired tokens

Passwords are handled using bcrypt.

The frontend uses protected routes for authenticated application pages and maintains authentication state through the application's refresh handling.

## File Uploads

Multer is used for handling image uploads.

The application supports image handling for:

- Student profiles
- Faculty profiles
- Administrator profiles
- Complaint attachments
- Information-request response attachments

Uploaded user files are excluded from version control through `.gitignore`.

## Environment Configuration

The backend uses environment variables for configuration.

The repository provides:

```text
backend/.env.example
```

with the required variable names:

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

Actual credentials and secrets are kept in the local `backend/.env` file and are not committed to the repository.

## Running the Project

### Backend

```bash
cd backend
npm install
node server.js
```

The backend uses port `5000` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server normally runs on port `5173`.

## Development Dependencies

The frontend uses Vite and ESLint for development.

Available frontend scripts:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

The backend package includes Nodemon for development server restarts.

## Version Control

The repository excludes files that should not be committed, including:

```text
.env
node_modules/
uploads/
dist/
build/
```

This prevents credentials, dependencies, generated build files, and user-uploaded data from being stored in the repository.

## Future Enhancements

Potential areas for further development include:

- Production deployment
- Cloud-based storage for uploaded files
- Automated testing
- API documentation
- Improved role-specific authorization
- Centralized API configuration
- Production logging and monitoring
- Additional notification mechanisms

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
