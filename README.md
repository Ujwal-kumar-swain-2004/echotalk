# EchoTalk 🎙️📹

![EchoTalk Hero](/frontend/src/assets/hero.png)

> **Anonymous Random Video Chat Platform built with modern web technologies.**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)](https://socket.io/)

EchoTalk is a state-of-the-art WebRTC-based platform designed for anonymous and random video chats. Built with a high-performance Spring Boot backend and an ultra-fast React frontend, EchoTalk ensures smooth peer-to-peer connections and robust moderation capabilities.

---

## ✨ Features

- **Anonymous Matchmaking:** Jump into random video chats instantly with or without registering.
- **Gender & Interest Filtering:** Connect with people sharing similar interests or specific preferences.
- **Real-Time Text Chat:** Seamless real-time messaging using Socket.IO along with video.
- **Robust Moderation System:** Integrated reporting, banning, and admin dashboards for a safer community.
- **Global Error Handling & Rate Limiting:** Built-in safeguards to prevent abuse and ensure platform stability.
- **Fully Containerized:** One-click deployment with Docker Compose.

---

## 🏗️ Architecture Flow

```mermaid
sequenceDiagram
    participant Client A
    participant Matchmaking Service (Redis)
    participant Client B
    participant WebRTC Signaling (Socket.IO)

    Client A->>Matchmaking Service (Redis): Join Queue (Interests, Gender)
    Client B->>Matchmaking Service (Redis): Join Queue (Interests, Gender)
    Matchmaking Service (Redis)-->>Client A: Match Found (Client B)
    Matchmaking Service (Redis)-->>Client B: Match Found (Client A)
    
    Client A->>WebRTC Signaling (Socket.IO): Send Offer
    WebRTC Signaling (Socket.IO)-->>Client B: Forward Offer
    Client B->>WebRTC Signaling (Socket.IO): Send Answer
    WebRTC Signaling (Socket.IO)-->>Client A: Forward Answer
    
    Client A<->>Client B: P2P Video/Audio Connection Established
```

---

## 🚀 Setup & Installation

### Using Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ujwal-kumar-swain-2004/echotalk.git
   cd echotalk
   ```

2. **Configure Environment Variables:**
   Copy the example environment files and configure your secrets.
   ```bash
   cp .env.example .env
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8080`
   - Swagger Documentation: `http://localhost:8080/swagger-ui.html`

### Manual Setup

1. Start PostgreSQL and Redis locally.
2. Configure `backend/src/main/resources/application.yml` or export equivalent environment variables.
3. Run the backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
4. Run the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 📖 API Documentation

The backend exposes a fully documented OpenAPI specification. Once the backend is running, navigate to:
**[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)**

### Key Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login existing user | ❌ |
| `POST` | `/api/auth/guest` | Login as a guest user | ❌ |
| `GET`  | `/api/public/online-count` | Get active users count | ❌ |
| `GET`  | `/api/admin/stats` | View platform statistics | ✅ (Admin) |
| `POST` | `/api/admin/bans` | Ban a user | ✅ (Admin) |

---

## 🛡️ Moderation & Safety

EchoTalk prioritizes user safety. The platform uses Redis-backed rate limiting to prevent spam and a comprehensive reporting system that allows users to flag inappropriate behavior. Admins have access to a dashboard to review reports and issue temporary or permanent bans.

---

> **Note:** This project is intended for educational purposes and demonstrations of WebRTC and Spring Boot integrations.
