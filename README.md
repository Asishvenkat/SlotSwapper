# SlotSwapper - Peer-to-Peer Time-Slot Scheduling Application

![SlotSwapper](https://img.shields.io/badge/Status-Complete-green)
![License](https://img.shields.io/badge/License-MIT-blue)

SlotSwapper is a full-stack application that enables users to swap calendar time slots with each other. Users can mark their busy slots as "swappable" and request to exchange them with other users' available slots.

##  Project Overview

This project was developed as a technical challenge to demonstrate proficiency in:
- Full-stack development with React (TypeScript) and Node.js (Express)
- Database design and complex transaction handling
- Real-time communication with WebSockets
- RESTful API design
- Authentication and authorization
- Testing and containerization
- 
##  Live Deployment

The application is deployed and accessible at:
- **Frontend:** [https://slot-swapper-drab.vercel.app](https://slot-swapper-drab.vercel.app)
- **Backend API:** [https://slotswapper-azhm.onrender.com](https://slotswapper-azhm.onrender.com)
- **API Health Check:** [https://slotswapper-azhm.onrender.com/api/health](https://slotswapper-azhm.onrender.com/api/health)
##  Features

### Core Features
- ✅ **User Authentication**: JWT-based signup and login
- ✅ **Event Management**: CRUD operations for calendar events/slots
- ✅ **Swap Marketplace**: Browse swappable slots from other users
- ✅ **Swap Requests**: Request to exchange slots with atomic transactions
- ✅ **Swap Response**: Accept or reject incoming swap requests
- ✅ **Real-time Notifications**: Instant updates via WebSockets (Socket.IO)

### Bonus Features
- ✅ **Real-time Notifications**: WebSocket integration for instant swap notifications
- ✅ **Unit & Integration Tests**: Comprehensive test coverage for API endpoints
- ✅ **Containerization**: Docker and Docker Compose for easy deployment
- ✅ **TypeScript**: Both frontend and backend use TypeScript for type safety
- ✅ **Modern UI**: Responsive design with Tailwind CSS

##  Architecture & Design Decisions

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO for WebSocket communication
- **Validation**: express-validator for input validation

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: React Router v6
- **State Management**: React Context API
- **Styling**: Tailwind CSS for utility-first styling
- **HTTP Client**: Axios for API requests
- **Notifications**: react-hot-toast for user feedback

### Database Schema

#### Users Collection
```typescript
{
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  createdAt: Date
}
```

#### Events Collection
```typescript
{
  title: String,
  startTime: Date,
  endTime: Date,
  status: Enum ['BUSY', 'SWAPPABLE', 'SWAP_PENDING'],
  userId: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

#### SwapRequests Collection
```typescript
{
  requesterId: ObjectId (ref: User),
  requesterSlotId: ObjectId (ref: Event),
  targetUserId: ObjectId (ref: User),
  targetSlotId: ObjectId (ref: Event),
  status: Enum ['PENDING', 'ACCEPTED', 'REJECTED'],
  createdAt: Date,
  updatedAt: Date
}
```

### Key Design Decisions

1. **Atomic Transactions**: MongoDB sessions ensure swap operations are atomic - both slot ownerships change together or neither changes.

2. **Status Management**: Three-state status for events:
   - `BUSY`: Normal event, not available for swapping
   - `SWAPPABLE`: Available in marketplace
   - `SWAP_PENDING`: Locked during pending swap request

3. **Real-time Updates**: Socket.IO provides instant notifications when:
   - Someone requests to swap with your slot
   - Your swap request is accepted/rejected
   - Automatic UI refresh after swap completion

4. **Security**: 
   - Passwords hashed with bcrypt (10 salt rounds)
   - JWT tokens for stateless authentication
   - Server-side validation for all operations
   - Ownership checks before any modifications

##  Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v7.0 or higher)
- npm or yarn
- Docker & Docker Compose (optional, for containerized setup)

### Option 1: Local Development Setup

#### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd SlotSwapper
```

#### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# MONGODB_URI=mongodb://localhost:27017/slotswapper
# JWT_SECRET=your-secret-key
# PORT=5000
# FRONTEND_URL=http://localhost:3000

# Start MongoDB (if not running)
# mongod

# Run backend server
npm run dev
```

The backend will run on http://localhost:5000

#### 3. Frontend Setup
```bash
cd frontend
npm install

# Run frontend development server
npm run dev
```

The frontend will run on http://localhost:3000

### Option 2: Docker Setup (Recommended)

#### 1. Using Docker Compose
```bash
# From the project root directory
docker-compose up --build
```

This will:
- Start MongoDB on port 27017
- Start Backend API on port 5000
- Start Frontend on port 3000

Access the application at http://localhost:3000

#### 2. Stop Services
```bash
docker-compose down

# To remove volumes (database data)
docker-compose down -v
```

##  API Endpoints

> ** Note**: A complete Postman collection with all endpoints is available in [`POSTMAN_COLLECTION.md`](./POSTMAN_COLLECTION.md)

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Events (Slots)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/events` | Get user's events | Yes |
| POST | `/api/events` | Create new event | Yes |
| PUT | `/api/events/:id` | Update event | Yes |
| DELETE | `/api/events/:id` | Delete event | Yes |

### Swap Operations
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/swap/swappable-slots` | Get all swappable slots (excluding user's own) | Yes |
| POST | `/api/swap/swap-request` | Create swap request | Yes |
| POST | `/api/swap/swap-response/:requestId` | Accept/reject swap request | Yes |
| GET | `/api/swap/incoming-requests` | Get incoming swap requests | Yes |
| GET | `/api/swap/outgoing-requests` | Get outgoing swap requests | Yes |

### Request/Response Examples

#### Signup
```json
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Create Event
```json
POST /api/events
Headers: { "Authorization": "Bearer <token>" }
{
  "title": "Team Meeting",
  "startTime": "2025-01-15T10:00:00Z",
  "endTime": "2025-01-15T11:00:00Z",
  "status": "BUSY"
}
```

#### Create Swap Request
```json
POST /api/swap/swap-request
Headers: { "Authorization": "Bearer <token>" }
{
  "mySlotId": "507f1f77bcf86cd799439011",
  "theirSlotId": "507f1f77bcf86cd799439012"
}
```

#### Respond to Swap
```json
POST /api/swap/swap-response/507f1f77bcf86cd799439013
Headers: { "Authorization": "Bearer <token>" }
{
  "accepted": true
}
```

## 🧪 Testing

### Running Backend Tests
```bash
cd backend
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

### Test Coverage
The test suite includes:
- Authentication flow tests (signup, login, token validation)
- Event CRUD operations
- Complex swap logic (creation, acceptance, rejection)
- Transaction rollback scenarios
- Validation and error handling

##  Project Structure

```
SlotSwapper/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── event.controller.ts
│   │   │   └── swap.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── models/
│   │   │   ├── User.model.ts
│   │   │   ├── Event.model.ts
│   │   │   └── SwapRequest.model.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── event.routes.ts
│   │   │   └── swap.routes.ts
│   │   ├── services/
│   │   │   └── socket.service.ts
│   │   ├── __tests__/
│   │   │   └── *.test.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Marketplace.tsx
│   │   │   └── Requests.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

##  Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/slotswapper
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🚢 Deployment

### Backend Deployment (Render, Heroku, Railway)
1. Set environment variables in your platform
2. Ensure MongoDB URI is set correctly
3. Build command: `npm run build`
4. Start command: `npm start`

### Frontend Deployment (Vercel, Netlify)
1. Set environment variables:
   - `VITE_API_BASE_URL`: Your backend API URL
   - `VITE_SOCKET_URL`: Your backend WebSocket URL
2. Build command: `npm run build`
3. Output directory: `dist`

### Database Deployment (MongoDB Atlas)
1. Create a free cluster on MongoDB Atlas
2. Update `MONGODB_URI` with Atlas connection string
3. Whitelist your deployment IP addresses

##  Usage Flow

1. **Sign Up/Login**: Create an account or login
2. **Create Events**: Add your calendar slots via Dashboard
3. **Mark as Swappable**: Change event status to make it available for swapping
4. **Browse Marketplace**: View available slots from other users
5. **Request Swap**: Select a slot to swap and choose your own slot to offer
6. **Receive Notification**: Get real-time notification when someone wants your slot
7. **Accept/Reject**: Review incoming requests and decide
8. **Automatic Swap**: Upon acceptance, slots are automatically exchanged

##  Technologies Used

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Socket.IO
- express-validator
- Jest + Supertest (testing)

### Frontend
- React 18
- TypeScript
- Vite
- React Router v6
- Axios
- Socket.IO Client
- Tailwind CSS
- react-hot-toast
- date-fns

### DevOps
- Docker
- Docker Compose
- Git

##  Known Issues & Future Improvements

### Current Limitations
- No email verification for signup
- No password reset functionality
- No calendar view (list view only)
- No time zone handling
- No recurring events

### Planned Features
- Email notifications
- Calendar grid view
- Recurring event patterns
- User profiles with avatars
- Search and filter in marketplace
- Chat system for swap negotiations
- Mobile app (React Native)

##  Assumptions Made

1. **Time Slots**: Assumed that events/slots can overlap for the same user (no conflict checking implemented).

2. **Swap Logic**: Assumed that once a swap request is pending, both slots are locked (SWAP_PENDING status) to prevent multiple concurrent swap requests for the same slot.

3. **User Trust**: Assumed users will only swap similar time slots (no duration or time-of-day matching enforced).

4. **Single Swap**: Assumed users can only have one active swap request per slot at a time.

5. **Time Zones**: Assumed all times are stored in UTC and the client handles local timezone conversion.

6. **Authentication**: Assumed basic JWT authentication is sufficient (no OAuth, 2FA, or refresh tokens implemented for this demo).

7. **Data Privacy**: Assumed users are okay with their swappable slots being visible to all authenticated users.

8. **Network**: Assumed reliable network connection for WebSocket real-time features.

##  Challenges Faced

1. **Atomic Swap Transactions**: Ensuring both slots are updated together required careful use of MongoDB transactions and proper error handling.

2. **WebSocket Authentication**: Authenticating Socket.IO connections required passing JWT tokens during handshake and validating them server-side.

3. **State Synchronization**: Keeping frontend state in sync with real-time updates required careful event listener management and cleanup.

4. **TypeScript Configuration**: Setting up TypeScript for both frontend and backend with proper type definitions took careful configuration.

5. **Docker Multi-stage Builds**: Optimizing Dockerfile for production required understanding multi-stage builds to keep final images small.

##  License

This project is licensed under the MIT License.

##  Author

Created as a technical challenge for ServiceHive Full Stack Intern position.

##  Acknowledgments

- ServiceHive team for the interesting challenge
- Open-source community for amazing tools and libraries

---

**Note**: This is a demonstration project. For production use, additional security measures, monitoring, and optimizations would be required.
