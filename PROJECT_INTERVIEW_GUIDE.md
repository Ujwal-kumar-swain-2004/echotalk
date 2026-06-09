# EchoTalk Project and Interview Guide

## 1. Project Introduction

EchoTalk is a full-stack anonymous video-chat and social matching platform. I built it to learn how real-time communication, WebRTC, authentication, databases, caching, security, and cloud deployment work together in one production-style application.

Users can join as guests or create accounts, choose gender and matching preferences, add interests, and connect with other users. After matching, they can communicate through peer-to-peer video/audio and real-time text chat.

The project also includes:

- Interest and gender-based matchmaking
- Guest and registered-user authentication
- JWT-based API and Socket.IO security
- WebRTC video and audio calling
- Socket.IO signaling and messaging
- Camera and microphone selection
- Mobile camera switching
- Reconnection and network-status handling
- User reporting, blocking, bans, and rate limiting
- Email verification and password reset
- Notifications and picture-in-picture
- Translation support
- Friends and private rooms
- Admin management features
- Docker-based local and production deployment

## 2. Technology Stack

### Frontend

- React 19 and TypeScript
- Vite
- React Router
- Zustand for client state
- Axios for REST API calls
- Socket.IO Client
- Native WebRTC APIs
- React Hook Form and Zod
- Tailwind CSS and Framer Motion

### Backend

- Java 21
- Spring Boot 3.5
- Spring Security
- Spring Data JPA
- Spring Data Redis
- Spring Mail
- PostgreSQL
- Redis
- Netty Socket.IO
- JWT authentication
- Maven and JUnit

### Infrastructure

- Vercel for the frontend
- Render for the backend
- Neon PostgreSQL
- Upstash Redis
- Brevo SMTP for production email
- nginx as the Render gateway
- Docker and Docker Compose

## 3. High-Level Architecture

The React frontend is deployed on Vercel. It communicates with the backend through REST APIs and Socket.IO.

The backend has two internal servers:

- Spring Boot REST API on port `8080`
- Socket.IO server on port `8081`

Render exposes only one public port. I solved this by placing nginx in the backend container. nginx listens on Render's public port and routes:

- `/api/*` to Spring Boot on `8080`
- `/socket.io/*` to Socket.IO on `8081`

PostgreSQL stores persistent information such as users, matches, reports, friendships, blocks, private rooms, and account tokens. Redis is used for short-lived and high-frequency data such as online-user tracking, matchmaking support, and rate limiting.

After two users are matched, Socket.IO exchanges the WebRTC offer, answer, and ICE candidates. The actual video and audio then travel directly between browsers when the network allows it. TURN configuration provides a relay fallback for networks where direct peer-to-peer communication fails.

## 4. How the Main Flow Works

### Registration

1. The frontend validates registration fields with Zod.
2. Axios sends the request to `/api/auth/register`.
3. Spring validates the request and checks for duplicate usernames and emails.
4. The password is hashed with BCrypt.
5. The user and verification token are stored in PostgreSQL.
6. Spring Mail sends a verification link through the configured SMTP provider.
7. The backend returns a signed JWT.

### Guest Login

1. The user selects gender, preferred gender, and optional interests.
2. The backend creates a temporary guest account.
3. The backend returns a JWT with the `GUEST` role.
4. The frontend uses that token for Socket.IO authentication and protected actions.

### Matchmaking

1. The client connects to Socket.IO using its JWT.
2. It emits `joinQueue` with interests and gender preferences.
3. The matchmaking service searches for a compatible user.
4. Blocked users are excluded.
5. Shared interests improve match quality.
6. Both clients receive `matchFound` with the room information.

### WebRTC Connection

1. One matched client becomes the initiator.
2. It creates an `RTCPeerConnection`.
3. It adds camera and microphone tracks.
4. It creates an SDP offer and sends it through Socket.IO.
5. The second client creates and returns an SDP answer.
6. Both clients exchange ICE candidates through Socket.IO.
7. The browsers establish the media connection.

Socket.IO is the signaling channel. It does not normally carry the video stream itself.

## 5. Major Problems I Faced and How I Solved Them

### Problem 1: Render Supports Only One Public Port

**Problem:** Spring Boot used port `8080`, while Socket.IO used port `8081`. Render exposes only one public web port, so directly using `https://backend:8081` did not work.

**How I diagnosed it:** The REST API worked, but production Socket.IO and WebRTC signaling were unreliable. The logs showed both servers running internally.

**Solution:** I added nginx to the Render Docker image. nginx exposes one public port and reverse-proxies `/api` and `/socket.io` to the correct internal services.

**Lesson:** A platform's networking model must influence application deployment architecture.

### Problem 2: Render Health Checks Failed During Cold Starts

**Problem:** Spring Boot took about two minutes to initialize on Render's free instance. Render checked `/api/public/health` before Spring was ready and reported a five-second timeout.

**How I diagnosed it:** The logs showed nginx starting first, followed by a long Spring, Hibernate, Neon, and repository initialization. Render killed or restarted the instance before the proxied health endpoint became responsive.

**Solution:** I made nginx return an immediate JSON response for the exact health-check path. This keeps Render's gateway health check responsive while Spring finishes starting.

**Trade-off:** This health endpoint confirms that the gateway/container is alive, not that every dependency is ready. A separate readiness endpoint would be better for more advanced monitoring.

### Problem 3: Misleading CORS and Axios Errors

**Problem:** The browser displayed an Axios network error and said that `Access-Control-Allow-Origin` was missing.

**Real cause:** Some responses were Render-generated `502 Bad Gateway` pages. Those pages did not contain the application's CORS headers because the request never reached Spring.

**How I diagnosed it:** I manually tested `OPTIONS`, health, and POST requests. I inspected status codes and headers rather than relying only on the browser message. A successful preflight returned the expected origin, while failed requests contained Render routing headers.

**Solution:** I fixed backend availability and health-check behavior. I also configured Spring CORS from `APP_CORS_ALLOWED_ORIGINS`.

**Lesson:** A browser CORS message can be secondary. Always inspect the actual HTTP status and response source.

### Problem 4: Vercel Returned 404 for React Routes

**Problem:** Navigation to `/register` worked inside the application, but refreshing or directly opening that URL returned Vercel's `404 NOT_FOUND`.

**Cause:** React Router handles routes in the browser, but Vercel initially searched for a physical `/register` file.

**Solution:** I added a `vercel.json` rewrite that sends application routes to `index.html`.

**Lesson:** Single-page applications require server-side history fallback configuration.

### Problem 5: Service Worker MIME-Type Error

**Problem:** The browser tried to register `/sw.ts`, but Vercel returned HTML, producing an unsupported `text/html` MIME-type error.

**Cause:** A source TypeScript file under `src` is not automatically published as `/sw.ts`.

**Solution:** I moved the worker to `public/sw.js`, registered `/sw.js`, and added cache activation and old-cache cleanup.

**Lesson:** Service workers must be deployed as real JavaScript assets and served with the correct MIME type.

### Problem 6: Duplicate Socket Connections

**Problem:** Backend logs showed the same user connecting twice.

**Cause:** React Strict Mode can run development effects more than once. The socket service also created a replacement connection when the existing socket was still connecting.

**Solution:** I made the socket service reuse the same socket when the authentication token is unchanged. It now reconnects an inactive socket instead of creating another one and clears its stored token on disconnect.

**Lesson:** Real-time client connection code should be idempotent.

### Problem 7: Redis Connection and TLS Configuration

**Problem:** Upstash Redis connections failed in production while rate limiting fell back to memory.

**Cause:** Hosted Redis required the correct host, port, username, password, and TLS settings. A REST Redis URL is not the same as the TCP connection expected by Spring Data Redis.

**Solution:** I configured:

```text
SPRING_DATA_REDIS_HOST
SPRING_DATA_REDIS_PORT=6379
SPRING_DATA_REDIS_USERNAME=default
SPRING_DATA_REDIS_PASSWORD
SPRING_DATA_REDIS_SSL_ENABLED=true
```

I kept an in-memory fallback for rate limiting so temporary Redis failure would not completely break the application.

### Problem 8: Camera and Microphone Did Not Work on a Phone

**Problem:** The site opened from a phone on the same network, but camera and microphone permission failed.

**Cause:** Browsers require a secure context for `getUserMedia`. A LAN HTTP address is generally not considered secure.

**Solution:** I added local HTTPS certificate support for phone testing and used HTTPS in production. I also implemented device enumeration, camera switching, microphone switching, and mobile-facing camera selection.

**Lesson:** Browser security requirements are part of WebRTC engineering.

### Problem 9: WebRTC Does Not Always Connect Directly

**Problem:** WebRTC may work on the same network but fail across strict NATs, mobile networks, or corporate firewalls.

**Solution:** I configured STUN for public address discovery and optional TURN credentials for relay fallback.

**Lesson:** STUN helps discover routes, while TURN relays traffic when direct connectivity is impossible. A production WebRTC application should not depend only on STUN.

### Problem 10: Email Worked Locally but Needed Production Delivery

**Problem:** Mailpit was useful locally but could not deliver real verification and password-reset messages after deployment.

**Solution:** I used Spring Mail with environment-based SMTP settings and configured a production provider such as Brevo. Email failures are logged without exposing SMTP credentials.

**Lesson:** Local test infrastructure and production integrations should share an interface but use different configuration.

## 6. Security Decisions

- Passwords are stored as BCrypt hashes.
- JWTs contain user ID, username, and role.
- REST endpoints are protected through a stateless Spring Security filter chain.
- Socket.IO connections validate JWT identity.
- Admin endpoints require the `ADMIN` role.
- Request validation prevents malformed input.
- Rate limiting reduces abuse and spam.
- Blocking prevents unwanted rematches and interaction.
- Reporting and banning provide moderation controls.
- Secrets are stored in environment variables, not source code.
- CORS allows only configured frontend origins.

For a larger production system, I would also add refresh-token rotation, secret management, audit logs, stronger content moderation, distributed Socket.IO state, and more comprehensive security testing.

## 7. Database Design

Important entities include:

- `User`
- `Interest`
- `ChatRoom`
- `Message`
- `MatchHistory`
- `Report`
- `Ban`
- `AccountToken`
- `Friendship`
- `PrivateRoom`
- `UserBlock`

PostgreSQL is appropriate because these entities have relationships, constraints, transactions, and persistent history. Redis is better for short-lived state and frequently changing counters.

I added indexes and uniqueness constraints for data such as usernames, emails, private-room codes, and block pairs. Transactions protect operations such as registration, token creation, and password reset.

## 8. Testing and Debugging Strategy

I used:

- JUnit and Mockito backend service tests
- Maven build and test verification
- TypeScript production builds
- ESLint
- Browser developer tools
- Network request inspection
- Render and application logs
- Manual `OPTIONS`, health, and API probes
- Desktop and mobile testing

My debugging process was:

1. Reproduce the problem.
2. Identify whether it belongs to frontend, network, proxy, backend, database, or external service.
3. Inspect the actual status code and response headers.
4. Check application and deployment logs.
5. Test the smallest failing endpoint directly.
6. Make a focused change.
7. Run tests and builds.
8. Commit the change with a descriptive Git message.
9. Verify the deployed behavior.

## 9. Important Trade-Offs

### Separate Spring and Socket.IO Ports

This kept the backend modules clear, but required nginx on a one-port hosting platform.

### WebRTC Peer-to-Peer Media

This reduces server bandwidth and latency, but connectivity depends on NAT traversal and TURN availability.

### Render Free Tier

It made deployment affordable but introduced slow cold starts, limited resources, and temporary unavailability.

### Hibernate `ddl-auto=update`

It simplified development and initial deployment. For a serious production system, I would replace it with Flyway or Liquibase migrations.

### Local Socket.IO Memory Store

It is sufficient for one backend instance. Horizontal scaling would require shared Socket.IO session and pub/sub infrastructure.

## 10. Improvements I Would Make Next

- Add Flyway database migrations.
- Add refresh tokens and token revocation.
- Add integration and end-to-end tests.
- Add structured logging and monitoring.
- Add separate liveness and readiness endpoints.
- Reduce Spring startup time.
- Add a production TURN service and monitoring.
- Move translation to a reliable production provider.
- Add message persistence and pagination.
- Add stronger abuse detection and content moderation.
- Add CI deployment checks and automated smoke tests.
- Support horizontally scaled Socket.IO instances.
- Improve frontend code splitting to reduce bundle size.

## 11. Common Interview Questions and Answers

### Tell me about your project.

I built EchoTalk, a full-stack anonymous video-chat and matchmaking platform. The frontend uses React and TypeScript, while the backend uses Java and Spring Boot. PostgreSQL stores persistent data, Redis supports temporary real-time state, Socket.IO handles matchmaking and WebRTC signaling, and WebRTC carries peer-to-peer video and audio. I deployed the frontend on Vercel and the backend on Render using Docker and nginx.

### What was the most difficult problem?

The most difficult part was deploying Spring Boot and Socket.IO on Render because they used separate internal ports while Render exposed only one public port. I solved it with an nginx reverse proxy that routes REST and Socket.IO paths to their internal servers. I also had to handle slow free-tier cold starts and health-check timeouts.

### Why did you use WebRTC and Socket.IO together?

WebRTC handles peer-to-peer media efficiently, but it does not provide the signaling mechanism needed to find users and exchange offers, answers, and ICE candidates. I used Socket.IO for signaling, matchmaking events, messaging, typing indicators, and connection state.

### Why did you use Redis?

Redis is suitable for rapidly changing and short-lived information. I used it for online-user tracking, matchmaking support, and rate limiting. PostgreSQL remains the source of truth for persistent relational data.

### How did you secure Socket.IO?

The frontend sends its JWT during the Socket.IO handshake. The backend validates it and derives the user identity from the token instead of trusting a user ID supplied by the client. This prevents basic impersonation.

### How did you handle deployment failures?

I inspected Render logs and tested endpoints directly. One important example was a browser CORS error that was actually caused by Render returning a `502` page. Testing the preflight separately showed that Spring CORS was correct. I then fixed the health-check and cold-start behavior.

### How does interest matching work?

Each queued user provides interests and gender preferences. The matchmaking service filters incompatible and blocked users, then favors candidates with shared interests. If no strong match exists, the system can still provide a compatible random match.

### How do you handle users who disconnect?

The frontend listens for network, socket, and peer-connection changes. It updates the UI, attempts socket reconnection, cleans up media and peer-connection resources, and informs the remaining user when a peer disconnects.

### What happens if Redis is unavailable?

Rate limiting has an in-memory fallback, allowing one instance to continue functioning temporarily. This is graceful degradation, although the fallback is not shared across multiple instances.

### How would you scale this application?

I would run multiple stateless Spring instances behind a load balancer, use Redis for shared matchmaking and Socket.IO pub/sub, externalize session-like state, use managed TURN servers, add database migrations, and introduce monitoring and autoscaling. Socket connections may require sticky routing depending on the chosen adapter and transport.

### How did you test it?

I wrote backend unit tests for authentication, mail, matchmaking, and moderation. I also ran Maven tests, frontend linting, TypeScript production builds, direct HTTP probes, browser network inspection, and real desktop/mobile WebRTC tests.

### What did you learn?

I learned that a working local feature is only one part of engineering. Production behavior depends on proxies, ports, TLS, CORS, browser security, external services, startup time, failure handling, and observability. I also learned to verify the real HTTP response instead of trusting only a high-level browser error.

## 12. Short Resume Description

**EchoTalk - Full-Stack Real-Time Video Chat Platform**

Built and deployed a WebRTC-based anonymous video-chat platform using React, TypeScript, Java, Spring Boot, PostgreSQL, Redis, Socket.IO, and Docker. Implemented JWT authentication, smart matchmaking, real-time messaging and signaling, device switching, moderation, email verification, password reset, translation, friends, private rooms, and production deployment through Vercel, Render, nginx, Neon, Upstash, and Brevo.

## 13. Final Interview Advice

Do not memorize every sentence. Understand the flow and explain it naturally:

1. State the problem.
2. Explain how you investigated it.
3. Describe the technical solution.
4. Mention the trade-off.
5. Explain what you learned.

Use accurate language such as "I implemented," "I debugged," and "I integrated" only for work you understand and can explain. When discussing a team or assisted workflow, be honest about the tools and collaboration involved while clearly explaining the engineering decisions you personally verified.
