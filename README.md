
# DIARY

A full-stack social writing platform where people write, share, read, and interact. Built with Node.js, Express, MongoDB, EJS, and Socket.io.

## Project Preview

<div align="center">

### Landing Page
<img width="100%" alt="Landing Page" src="https://github.com/user-attachments/assets/76f370d7-f57d-4a39-aee3-fb6b21c5ed0b" />

---

### Home Feed
<img width="100%" alt="Home Feed" src="https://github.com/user-attachments/assets/46b4fb6e-54bd-43c4-9c53-639ee9799784" />

---

### Write a Post
<img width="100%" alt="Write a Post" src="https://github.com/user-attachments/assets/353d1492-2b70-4f18-b65f-ad13f21a1aac" />

---

### Post Detail View
<img width="100%" alt="Post Detail View 1" src="https://github.com/user-attachments/assets/4d953f1a-5c3b-4ea9-9907-b23f21e0e174" />
<br/>
<img width="100%" alt="Post Detail View 2" src="https://github.com/user-attachments/assets/998de964-5570-4fe3-82a3-21ec4f12c477" />

---

### Comments Section
<img width="100%" alt="Comments Section" src="https://github.com/user-attachments/assets/1ae5865f-eb62-4ad6-9ee1-fca29a31a1b3" />

---

### User Profile
<img width="100%" alt="User Profile" src="https://github.com/user-attachments/assets/f5f4bc85-662c-4635-b81a-011a27910054" />

---

### User Search
<img width="100%" alt="User Search" src="https://github.com/user-attachments/assets/3689b80d-fc63-4124-899f-3ff195b3daab" />

---

### Users With Most Stories
<img width="100%" alt="Users With Most Stories" src="https://github.com/user-attachments/assets/b2fe44bb-7af7-4c83-b755-2e5745871adf" />

---

### User Dashboard
<img width="100%" alt="User Dashboard" src="https://github.com/user-attachments/assets/60422ec2-b117-4c5f-8d43-e0b641fdb1ea" />

---

### Real-time Notifications
<img width="100%" alt="Real-time Notifications" src="https://github.com/user-attachments/assets/2aafc4d9-64ef-47e9-9310-04b492ecfe99" />

</div>

## What is DIARY?

DIARY is a social platform built around writing. Users sign up, write posts, read what others have shared, and interact through likes, comments, and follows. The backend handles authentication, session management, and real-time updates. The frontend is server-rendered using EJS templates.

This isn't a static blog engine. It's a living, interactive platform where content flows between users in real time.

---

## What it does

- Secure user registration and login with hashed passwords and session-based auth
- Full CRUD on posts — create, read, edit, delete
- Like and unlike posts
- Comment on any post
- Follow and unfollow other users
- Real-time updates pushed through Socket.io
- Protected routes that block unauthorized access
- Image uploads handled through Cloudinary
- Email functionality for verification and password resets via Nodemailer
- GIF integration through the Giphy API

---

## Built with

- **Node.js** — server runtime
- **Express.js** — routing, middleware, session handling
- **MongoDB (Atlas)** — cloud-hosted database
- **EJS** — server-side templating
- **Socket.io** — real-time bidirectional communication
- **Cloudinary** — image storage and delivery
- **Nodemailer** — transactional emails

---

## Project structure

```
diary/
├── models/          # Mongoose schemas (User, Post, Comment, Follow)
├── routes/          # Express route definitions
├── middleware/       # Auth checks, error handling
├── views/           # EJS templates
├── public/          # Static assets (CSS, JS, images)
├── app.js           # Application entry point
├── package.json
└── .env             # Environment variables (not committed)
```

---

## Getting it running

### Clone the repo

```
git clone https://github.com/dipubadatya/DIARY-WEB-APP.git
cd diary
```

### Install dependencies

```
npm install
```

### Set up environment variables

Create a `.env` file in the root directory:

```
PORT=3000
NODE_ENV=production

MONGO_ATLAS=your_mongodb_atlas_connection_string

CLOUD_NAME=your_cloudinary_account_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_SECRET=your_cloudinary_secret

SESSION_SECRET=your_session_secret
SESSION_CRYPTO_SECRET=your_crypto_secret

EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password

GIPHY_API_KEY=your_giphy_api_key
SKRAPP_KEY=your_skrapp_key
```

### Start the server

With nodemon:
```
npm run dev
```

Without nodemon:
```
npm start
```

Then open `http://localhost:3000` in your browser.

---

## Environment variables explained

Each variable serves a specific purpose. Here's what they do and why they exist.

### PORT

```
PORT=3000
```

The port your Express server listens on. Locally this is usually 3000 or 5000. In production, the hosting provider often assigns this automatically.



### MONGO_ATLAS

```
MONGO_ATLAS=mongodb+srv://username:password@cluster.mongodb.net/databaseName
```

The connection string for your MongoDB Atlas cluster. This is where all application data lives — users, posts, comments, follow relationships. Without this, nothing persists. You can also point this at a local MongoDB instance during development.

### CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET

```
CLOUD_NAME=your_cloudinary_account_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_SECRET=your_cloudinary_secret
```

Cloudinary credentials for image uploads. When a user sets a profile picture or attaches an image to a post, the server uploads it to Cloudinary instead of storing it on disk. CLOUD_NAME identifies your account. CLOUD_API_KEY identifies your application. CLOUD_SECRET authenticates the upload request. All three are required.

### SESSION_SECRET, SESSION_CRYPTO_SECRET

```
SESSION_SECRET=your_session_secret
SESSION_CRYPTO_SECRET=your_crypto_secret
```

These secure user sessions. When someone logs in, Express creates a session and stores a cookie in their browser. These secrets encrypt that session data so it can't be tampered with or forged. If these leak, an attacker could impersonate any logged-in user. Use long, random strings. Never reuse them across projects.

### EMAIL_USER, EMAIL_PASS

```
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password
```

Credentials for sending transactional emails through Nodemailer — things like account verification links and password reset tokens. If you're using Gmail, EMAIL_PASS must be an App Password generated from your Google account settings, not your actual Gmail password. Google blocks direct password usage for third-party apps.

### GIPHY_API_KEY

```
GIPHY_API_KEY=your_giphy_api_key
```

Connects the app to the Giphy API for GIF search and embedding. Used wherever the application lets users attach or browse GIFs.

### SKRAPP_KEY

```
SKRAPP_KEY=your_skrapp_key
```

API key for Skrapp, an email lookup and validation service. Used for verifying email addresses or enriching user data. If you're not actively using this feature, you can leave it blank.

---

## How authentication works

1. User submits registration form with email and password
2. Password is hashed before being stored in MongoDB
3. On login, the submitted password is compared against the stored hash
4. A session is created on successful login, maintained via cookies
5. Protected routes check for a valid session before granting access
6. Logging out destroys the session

No tokens. No JWTs. Straightforward server-side session management.

---

## Database collections

The MongoDB database uses four main collections:

- **Users** — account credentials, profile information, metadata
- **Posts** — written content, timestamps, author references
- **Comments** — text, author reference, post reference
- **Follows** — follower and following references between users

All relationships between collections are managed through document references, not embedding.

---

## What this project demonstrates

- End-to-end full-stack development with a single language across the stack
- RESTful API design with proper HTTP methods and status codes
- Server-side authentication with session management and password hashing
- Real-time features layered on top of a traditional request-response architecture
- Third-party service integration for storage, email, and external APIs

---

## Running in production

```
npm start
```

---
