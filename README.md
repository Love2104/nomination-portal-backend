# IITK Election Commission - Backend API

Backend server for the IITK Election Commission Nomination Portal built with Node.js, Express, PostgreSQL, and Firebase Storage.

## Features

- ✅ OTP-based email verification
- ✅ JWT authentication with role-based access control
- ✅ PostgreSQL database with Sequelize ORM
- ✅ Firebase Storage for PDF manifesto uploads
- ✅ Multi-phase manifesto review system
- ✅ Deadline-controlled workflows
- ✅ Superadmin control panel
- ✅ CSV data export

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Firebase project with Storage enabled
- Gmail account for OTP emails

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database:**
   ```sql
   CREATE DATABASE iitk_election;
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update all configuration values

4. **Set up Firebase:**
   - Go to Firebase Console
   - Create a new project or use existing
   - Enable Firebase Storage
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `firebase-service-account.json` in the backend folder
   - Update `FIREBASE_STORAGE_BUCKET` in `.env`

5. **Configure Gmail for OTP:**
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password:
     - Go to Google Account > Security
     - Under "2-Step Verification", click "App passwords"
     - Generate a new app password
   - Update `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`

## Running the Server

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and complete registration
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/profile` - Get user profile (Protected)
- `PUT /api/auth/profile` - Update profile (Protected)
- `POST /api/auth/become-candidate` - Upgrade to candidate role (Protected)

### Nominations
- `GET /api/nominations` - Get all nominations
- `GET /api/nominations/:id` - Get nomination by ID
- `POST /api/nominations` - Create nomination (Candidate only)
- `PUT /api/nominations/:id` - Update nomination (Candidate only)
- `POST /api/nominations/:id/submit` - Submit nomination (Candidate only)
- `GET /api/nominations/my/nomination` - Get current user's nomination (Candidate only)

### Supporters
- `POST /api/supporters/request` - Request supporter role (Student)
- `GET /api/supporters/my-requests` - Get user's requests (Protected)
- `PUT /api/supporters/:id/accept` - Accept request (Candidate only)
- `PUT /api/supporters/:id/reject` - Reject request (Candidate only)
- `GET /api/supporters/candidate/:candidateId` - Get candidate's supporters

### Manifestos
- `POST /api/manifestos/upload` - Upload manifesto PDF (Candidate only)
- `GET /api/manifestos/:nominationId/:phase` - Get manifesto
- `GET /api/manifestos/nomination/:nominationId` - Get all manifestos for nomination
- `DELETE /api/manifestos/:id` - Delete manifesto (Candidate only, before deadline)

### Reviewers
- `POST /api/reviewers/login` - Reviewer login
- `GET /api/reviewers/manifestos` - Get manifestos for review (Reviewer only)
- `POST /api/reviewers/comments` - Add comment (Reviewer only)
- `GET /api/reviewers/comments/:manifestoId` - Get comments for manifesto

### Superadmin
- `GET /api/superadmin/config` - Get system configuration
- `PUT /api/superadmin/config/deadlines` - Update deadlines
- `PUT /api/superadmin/config/limits` - Update supporter limits
- `PUT /api/superadmin/config/reviewers` - Update reviewer credentials
- `GET /api/superadmin/candidates` - Get all candidates with stats
- `GET /api/superadmin/statistics` - Get system statistics
- `GET /api/superadmin/export/:type` - Export data (candidates/supporters/manifestos/comments)

## Database Schema

The application uses the following PostgreSQL tables:
- `Users` - User accounts with roles
- `OTPs` - OTP verification codes
- `Nominations` - Candidate nominations
- `SupporterRequests` - Supporter role requests
- `Manifestos` - Uploaded manifesto files
- `ReviewerComments` - Reviewer feedback
- `SystemConfigs` - System configuration and deadlines

## User Roles

1. **Student** - Default role, can request supporter roles
2. **Candidate** - Can file nominations, upload manifestos, manage supporters
3. **Reviewer** - Phase-specific login to review manifestos
4. **Superadmin** - Full system control

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Email validation (@iitk.ac.in only)
- File type validation (PDF only)
- Deadline enforcement
- Input validation with express-validator

## Error Handling

All endpoints return JSON responses with the following structure:
```json
{
  "success": true/false,
  "message": "Description",
  "data": {} // if applicable
}
```

## License

MIT
