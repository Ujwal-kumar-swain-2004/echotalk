# EchoTalk Complete Project Documentation

## 1. What EchoTalk Does

EchoTalk is a real-time anonymous video chat and social matching application. It allows users to instantly meet strangers through video, audio, and text chat. A user can either join as a guest or create a permanent account.

The application supports:

- Anonymous guest chat
- Account registration and login
- Email verification
- Password reset
- Gender-based matching
- Interest-based matching
- WebRTC video and audio calling
- Real-time text messaging
- Socket.IO signaling
- User blocking
- User reporting and moderation
- Admin ban system
- Online-user count
- Reconnection handling
- Camera and microphone selection
- Mobile camera switching
- Notifications
- Picture-in-picture video
- Translation support
- Friends and private rooms
- Production deployment with Vercel, Render, Neon, Upstash, Brevo, Docker, and nginx

In simple words, EchoTalk is like an Omegle-style random video chat platform, but with more safety, matching, account, and production-deployment features.

## 2. What Problem EchoTalk Solves

Many random chat platforms have problems such as:

- No proper user safety
- Weak moderation
- Poor matching quality
- No interest-based discovery
- No account system
- No blocking or reporting
- Unstable video connections
- No support for mobile camera switching
- Difficult deployment because real-time apps need APIs, sockets, databases, Redis, and WebRTC

EchoTalk solves these problems by combining:

- Real-time Socket.IO communication
- WebRTC peer-to-peer video/audio
- JWT-secured users and sockets
- PostgreSQL for permanent data
- Redis for fast temporary data
- Matching based on gender and interests
- Blocking and reporting
- Admin moderation
- Email verification and password reset
- TURN/STUN support for WebRTC network issues
- nginx reverse proxy for production deployment

The goal is not only to make video chat work locally, but to make a production-style full-stack system that handles real deployment problems.

## 3. How EchoTalk Solves the Problem

EchoTalk divides the system into clear responsibilities.

The frontend is responsible for:

- Showing the user interface
- Validating forms
- Calling REST APIs with Axios
- Connecting to Socket.IO
- Managing WebRTC peer connections
- Showing camera, microphone, chat, notifications, and errors

The backend is responsible for:

- User registration and login
- JWT token generation and validation
- Guest account creation
- Email verification and password reset
- Matchmaking logic
- Socket.IO event handling
- WebRTC signaling
- Reports, bans, blocks, friends, and private rooms
- Database persistence
- Redis-backed online state and rate limiting

The infrastructure is responsible for:

- Serving the frontend from Vercel
- Running the backend on Render
- Storing data in Neon PostgreSQL
- Storing temporary real-time state in Upstash Redis
- Sending mail through Brevo SMTP
- Routing Render's single public port through nginx

This separation makes the project easier to debug because each problem can be placed into one area: frontend, backend, socket, WebRTC, database, Redis, mail, or deployment.

## 4. Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Zustand
- Axios
- Socket.IO Client
- WebRTC browser APIs
- React Hook Form
- Zod
- Tailwind CSS
- Framer Motion

### Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Spring Data Redis
- Spring Mail
- PostgreSQL
- Redis
- Netty Socket.IO
- JWT
- Maven
- JUnit and Mockito

### Deployment

- Vercel for frontend
- Render for backend
- Neon PostgreSQL
- Upstash Redis
- Brevo SMTP
- Docker
- nginx

## 5. System Architecture

The architecture has three main layers.

### Frontend Layer

The React application runs in the user's browser. It handles all UI screens such as landing page, login, register, guest join, video chat, profile, verification, reset password, friends, and private rooms.

The frontend communicates with the backend in two ways:

- REST API for authentication, account actions, friends, reports, and normal data
- Socket.IO for real-time events, matchmaking, messages, and WebRTC signaling

### Backend Layer

The backend contains:

- Spring Boot REST API on internal port `8080`
- Socket.IO server on internal port `8081`
- Services for authentication, matchmaking, chat, moderation, blocking, translation, mail, and private rooms

### Infrastructure Layer

Render exposes only one public port. Because the backend internally uses two ports, nginx is used as a reverse proxy:

- `/api/*` goes to Spring Boot `8080`
- `/socket.io/*` goes to Socket.IO `8081`
- `/api/public/health` is answered directly by nginx to prevent Render health-check timeout during cold starts

This design allows both REST and Socket.IO to work through one public Render URL.

## 6. Main User Flow

### Guest Flow

1. User opens the frontend.
2. User selects gender, preferred gender, and interests.
3. Frontend sends request to `/api/auth/guest`.
4. Backend creates a guest user.
5. Backend returns JWT token.
6. Frontend stores token.
7. Frontend connects to Socket.IO using token.
8. User joins matchmaking queue.
9. Backend finds another compatible user.
10. Both users enter the video chat room.

### Registered User Flow

1. User fills username, email, password, and gender.
2. Frontend validates form using Zod.
3. Backend checks duplicate username/email.
4. Backend hashes password using BCrypt.
5. Backend saves user in PostgreSQL.
6. Backend creates email verification token.
7. Backend sends email through SMTP.
8. User verifies email.
9. User logs in and uses the platform permanently.

### Matchmaking Flow

1. User connects to Socket.IO.
2. User emits `joinQueue`.
3. Backend checks if user is authenticated.
4. Backend checks if user is banned.
5. Backend adds user to queue.
6. Backend searches for compatible partner.
7. Blocked users are skipped.
8. Shared interests improve matching.
9. Backend creates a chat room.
10. Both users receive `matchFound`.

### WebRTC Flow

1. Backend chooses one user as initiator.
2. Initiator creates WebRTC offer.
3. Offer is sent through Socket.IO.
4. Other user creates answer.
5. Answer is sent back through Socket.IO.
6. Both users exchange ICE candidates.
7. Browser establishes video/audio connection.

Important point: Socket.IO does not carry the video stream. Socket.IO only carries signaling messages. WebRTC carries the actual video and audio.

## 7. Important Features Explained

### JWT Authentication

JWT is used so the backend can identify users without storing server sessions. After login or guest creation, the backend returns a signed token. The frontend sends this token in API requests and during Socket.IO connection.

### Socket.IO Security

Socket.IO connection validates the JWT token. The backend gets the user ID from the token instead of trusting client-sent user IDs. This prevents users from pretending to be another user.

### WebRTC Video Chat

WebRTC enables direct browser-to-browser video and audio. This reduces backend bandwidth because the media stream does not pass through the server in normal cases.

### STUN and TURN

STUN helps browsers discover public network addresses. TURN acts as a relay if direct peer-to-peer connection fails. This is important because mobile networks, college Wi-Fi, office networks, and strict NATs can block direct WebRTC connections.

### Redis Usage

Redis is used for fast temporary state such as:

- Online users
- Matchmaking support
- Rate limiting

Redis is faster than PostgreSQL for temporary counters and frequently changing values.

### PostgreSQL Usage

PostgreSQL stores permanent application data:

- Users
- Interests
- Chat rooms
- Messages
- Match history
- Reports
- Bans
- Account tokens
- Friendships
- Private rooms
- Blocks

### Email System

Spring Mail sends:

- Email verification links
- Password reset links

Locally, Mailpit can be used for testing. In production, Brevo SMTP can send real emails.

### Blocking and Reporting

Blocking prevents unwanted users from being matched again. Reporting allows users to flag bad behavior. Admins can review reports and ban users.

## 8. Problems Faced While Building and How I Solved Them

### Problem: CORS Error During Deployment

**What happened:**  
The browser showed Axios network errors and CORS errors like missing `Access-Control-Allow-Origin`.

**Why it happened:**  
Sometimes the backend was actually returning Render `502 Bad Gateway` pages. These pages came from Render/nginx, not from Spring Boot, so they did not include Spring's CORS headers.

**How I solved it:**  
I tested the actual HTTP preflight request using direct `OPTIONS` requests. When Spring was healthy, CORS headers were correct. Then I focused on backend availability instead of changing random CORS settings.

**How to solve this in future:**  
Do not trust only the browser error. Check:

- HTTP status code
- Response headers
- Whether response came from Spring or hosting provider
- Backend logs
- Health endpoint
- `OPTIONS` request manually

### Problem: Render Health Check Failed

**What happened:**  
Render showed:

```text
HTTP health check failed
timed out after 5 seconds
```

**Why it happened:**  
Spring Boot took around two minutes to start on Render free tier. Render checked the health path before Spring was ready.

**How I solved it:**  
I configured nginx to answer `/api/public/health` immediately. This keeps Render health checks passing while Spring continues starting.

**How to solve this in future:**  
Use:

- Fast liveness endpoint
- Separate readiness endpoint
- Lower startup time
- Better hosting resources
- Avoid heavy startup tasks
- Reduce database connection pool size

### Problem: Render Allows Only One Public Port

**What happened:**  
Spring Boot ran on `8080`, Socket.IO ran on `8081`, but Render exposes only one public port.

**Why it happened:**  
The app had two internal servers, but the hosting platform only exposes one external web service port.

**How I solved it:**  
I added nginx inside the Docker container:

- `/api` routes to Spring Boot
- `/socket.io` routes to Socket.IO

**How to solve this in future:**  
For one-port platforms, use:

- nginx reverse proxy
- same-server integration
- separate deployed services
- platform-specific routing rules

### Problem: Vercel 404 on `/register`

**What happened:**  
The app worked when clicking links, but refreshing `/register` showed Vercel `404`.

**Why it happened:**  
React Router routes exist only in the browser. Vercel tried to find a real `/register` file.

**How I solved it:**  
I added `vercel.json` rewrite to send all routes to `index.html`.

**How to solve this in future:**  
For React single-page apps, always configure history fallback on the hosting platform.

### Problem: Service Worker MIME Error

**What happened:**  
Browser showed:

```text
unsupported MIME type text/html
```

**Why it happened:**  
The app tried to register `/sw.ts`, but that file was not publicly served as JavaScript.

**How I solved it:**  
I moved service worker to `public/sw.js` and registered `/sw.js`.

**How to solve this in future:**  
Service workers must be real public JavaScript files with correct MIME type.

### Problem: Duplicate Socket Connections

**What happened:**  
Backend logs showed the same user connecting twice.

**Why it happened:**  
React Strict Mode and repeated effects can call connection logic more than once.

**How I solved it:**  
I updated the socket service to reuse the existing socket when the token is unchanged.

**How to solve this in future:**  
Socket connection code should be idempotent. Always check if a socket already exists before creating a new one.

### Problem: Redis Connection Failed

**What happened:**  
Redis rate limiting showed connection errors in logs.

**Why it happened:**  
Upstash provides both REST and TCP connection details. Spring Data Redis needs TCP host, port, username, password, and SSL. Using the wrong URL causes failures.

**How I solved it:**  
I configured:

```text
SPRING_DATA_REDIS_HOST
SPRING_DATA_REDIS_PORT=6379
SPRING_DATA_REDIS_USERNAME=default
SPRING_DATA_REDIS_PASSWORD
SPRING_DATA_REDIS_SSL_ENABLED=true
```

**How to solve this in future:**  
Always check whether the library expects REST Redis or TCP Redis.

### Problem: Camera and Microphone Not Working on Phone

**What happened:**  
The app opened on phone, but camera and microphone did not work.

**Why it happened:**  
Mobile browsers require HTTPS for camera and microphone access.

**How I solved it:**  
I used HTTPS for production and local HTTPS certificates for phone testing.

**How to solve this in future:**  
For WebRTC and media devices:

- Use HTTPS
- Test on real mobile devices
- Check browser permissions
- Use `getUserMedia` error messages
- Make sure camera is not already used by another app

### Problem: WebRTC Works Sometimes but Not Always

**What happened:**  
Video may work on one network but fail on another.

**Why it happens:**  
Some NATs and firewalls block direct peer-to-peer media.

**How I solved it:**  
I added STUN/TURN configuration support.

**How to solve this in future:**  
Use reliable TURN servers for production WebRTC.

### Problem: Email Worked Locally but Not in Production

**What happened:**  
Mailpit worked locally, but production users needed real emails.

**Why it happened:**  
Mailpit is only a local test inbox. It does not send real email to Gmail or other inboxes.

**How I solved it:**  
I used Spring Mail with production SMTP settings from Brevo.

**How to solve this in future:**  
Use environment-based email configuration and a real SMTP provider in production.

## 9. How to Debug This Project

When something fails, use this order:

1. Check browser console.
2. Check browser Network tab.
3. See the exact request URL.
4. Check status code.
5. Check response headers.
6. Check whether the response is from Spring, nginx, Vercel, or Render.
7. Check Render logs.
8. Check Vercel deployment logs.
9. Test the backend endpoint directly.
10. Test preflight `OPTIONS` request.
11. Check environment variables.
12. Rebuild and redeploy only after knowing the cause.

## 10. Common Errors and Quick Fixes

### Axios Network Error

Possible causes:

- Backend sleeping
- Render cold start
- CORS failure
- Wrong API URL
- Backend crashed
- Render `502`
- Missing environment variable

Fix:

- Test `/api/public/health`
- Test `OPTIONS`
- Check Render logs
- Check `VITE_API_URL`
- Check `APP_CORS_ALLOWED_ORIGINS`

### CORS Error

Possible causes:

- Frontend URL not added in backend allowed origins
- Backend returning `502`
- Preflight request blocked
- Wrong backend URL

Fix:

- Set `APP_CORS_ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app`
- Restart Render service
- Test preflight manually

### Socket Not Connecting

Possible causes:

- Wrong socket URL
- Using `:8081` publicly on Render
- Token missing or expired
- nginx not routing `/socket.io`

Fix:

- Use `VITE_SOCKET_URL=https://your-render-service.onrender.com`
- Do not use public `:8081`
- Check Socket.IO logs
- Check JWT token

### Camera/Mic Not Opening

Possible causes:

- Not using HTTPS
- Permission denied
- Browser unsupported
- Device already used
- Phone browser restrictions

Fix:

- Use HTTPS
- Reset browser permissions
- Try Chrome/Edge
- Test `navigator.mediaDevices.getUserMedia`

### Render Health Check Failed

Possible causes:

- Spring startup slow
- Health endpoint proxied to backend before backend is ready
- App crashed
- Wrong health-check path

Fix:

- Use `/api/public/health`
- Let nginx answer health path
- Check logs until Spring says started

## 11. Security Explanation

EchoTalk uses several security layers:

- Passwords are hashed with BCrypt.
- JWT tokens are used for stateless authentication.
- Socket.IO validates JWT before accepting real-time events.
- Admin routes require admin role.
- User input is validated.
- Rate limiting reduces abuse.
- Users can report or block others.
- CORS only allows trusted frontend origins.
- Secrets are stored in environment variables.

Security can still be improved further with:

- Refresh tokens
- Token revocation
- Better audit logs
- Stronger moderation
- File/content scanning
- More advanced abuse detection
- Production-grade secret management

## 12. Database Explanation

PostgreSQL is used because the app has structured relational data. For example:

- A user can have interests.
- A user can send reports.
- A user can be banned.
- A user can block another user.
- A user can send or receive friend requests.
- A private room has a unique code.
- Account tokens belong to users.

Redis is used because some data changes very quickly and does not need permanent storage.

This separation is important. PostgreSQL is the source of truth. Redis is the fast temporary layer.

## 13. Testing Strategy

The project is tested with:

- Backend unit tests
- Maven test lifecycle
- Frontend TypeScript build
- ESLint
- Manual browser tests
- Mobile device testing
- Direct API testing
- Render and Vercel deployment checks

Important tested areas include:

- Authentication
- Mail service
- Matchmaking
- Moderation

In future, the project should add:

- End-to-end tests
- Socket.IO integration tests
- WebRTC smoke tests
- Deployment smoke tests
- Database migration tests

## 14. What I Learned From This Project

This project taught me that real-time full-stack applications are not only about writing frontend and backend code. Many difficult problems come from deployment, networking, browser security, ports, proxies, CORS, TLS, WebRTC NAT traversal, external services, and slow cold starts.

The biggest learning was that browser errors can be misleading. For example, a CORS error may actually be a backend `502`. So the correct approach is to inspect the real HTTP status, headers, logs, and deployment state.

I also learned that production systems need graceful fallback. For example, if Redis is unavailable, rate limiting can fall back to memory instead of breaking the whole app.

## 15. How I Would Explain This in an Interview

If an interviewer asks about EchoTalk, I can answer:

> EchoTalk is a full-stack random video chat platform. I built it using React, TypeScript, Spring Boot, PostgreSQL, Redis, Socket.IO, and WebRTC. The main problem it solves is allowing users to quickly meet strangers through secure real-time video chat, with better matching, blocking, reporting, email verification, and production deployment support.

If they ask what problems I faced:

> The hardest problems were deployment and real-time networking. Render exposes only one public port, but my backend had Spring Boot and Socket.IO on separate ports. I solved it with nginx reverse proxy routing. I also faced CORS-looking errors that were actually Render `502` responses, Vercel route `404`s, service-worker MIME errors, mobile camera HTTPS issues, and slow Render health checks. I solved each by checking actual logs, status codes, headers, and platform behavior.

If they ask how WebRTC works:

> Socket.IO is used only for signaling. It sends offer, answer, and ICE candidates between matched users. After that, WebRTC creates a peer-to-peer media connection for video and audio. STUN/TURN helps connection across networks.

If they ask how I would improve it:

> I would add Flyway migrations, better monitoring, refresh tokens, production TURN monitoring, Socket.IO scaling with Redis pub/sub, end-to-end tests, and separate readiness/liveness checks.

## 16. Future Improvements

- Add Flyway or Liquibase migrations.
- Add refresh token rotation.
- Add stronger admin dashboard.
- Add real-time moderation tools.
- Add message persistence with pagination.
- Add Redis adapter for Socket.IO scaling.
- Add production TURN service.
- Add better observability and logs.
- Add end-to-end tests.
- Add CI/CD smoke tests.
- Optimize frontend bundle size.
- Reduce Spring startup time.
- Add separate liveness and readiness endpoints.
- Add better mobile UI polish.

## 17. Final Summary

EchoTalk is a complete full-stack real-time communication project. It combines frontend development, backend APIs, WebRTC, Socket.IO, authentication, databases, Redis, email, moderation, deployment, and debugging.

The most valuable part of this project is not only the features, but the real problems solved during development:

- Browser security restrictions
- WebRTC signaling
- Socket connection management
- CORS and preflight debugging
- Render one-port limitation
- Render cold-start health checks
- Vercel SPA routing
- Service-worker deployment
- Redis TLS configuration
- Production SMTP setup

These problems make the project strong for interviews because they show practical full-stack engineering, not only basic CRUD development.
