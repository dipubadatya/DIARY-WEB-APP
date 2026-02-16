DIARY `README.md` FILE.

---

# 📖 DIARY – Full Stack Social Writing Platform

DIARY is a full-stack social writing platform where users can share their thoughts, read stories from others, and interact through likes, comments, and follows.

The application focuses on secure authentication, real-time interaction, and structured backend architecture.

---

## 🚀 Features

* User Authentication and Authorization
* Protected Routes
* Create, Read, Update, Delete (CRUD) posts
* Like and Comment system
* Follow / Unfollow users
* Real-time interaction using Socket.io
* RESTful API architecture

---

## 🛠 Tech Stack

* Node.js
* Express.js
* MongoDB
* EJS (Embedded JavaScript Templates)
* Socket.io

---

## 📂 Project Structure

```
diary/
│
├── models/
├── routes/
├── controllers/
├── middleware/
├── views/
├── public/
│
├── app.js
├── package.json
└── README.md
```

---

## 📦 Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the repository

```
git clone https://github.com/your-username/diary.git
```

### 2. Navigate to the project directory

```
cd diary
```

### 3. Install dependencies

```
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory and add:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key
```

Make sure MongoDB is running locally or provide your MongoDB Atlas connection string.

### 5. Start the development server

```
npm run dev
```

If you are not using nodemon, run:

```
npm start
```

After starting the server, open:

```
http://localhost:5000
```

---

## 🔐 Authentication Flow

* Users can register and log in securely
* Passwords are hashed before storing in the database
* Protected routes restrict unauthorized access
* Sessions maintain user login state

---

## 📝 Post System

* Users can create new posts
* Edit their existing posts
* Delete their own posts
* View posts from other users

---

## ❤️ Social Features

* Like and unlike posts
* Comment on posts
* Follow and unfollow users
* Real-time updates using Socket.io

---

## 🗄 Database Structure

MongoDB collections include:

* Users
* Posts
* Comments
* Follows

Data relationships are managed using references.

---

## 🏗 Production Build

To run in production mode:

```
npm start
```


---

## 📌 Purpose

This project demonstrates:

* Full-stack development skills
* REST API design
* Authentication and authorization implementation
* Real-time features with Socket.io
* MVC architecture structure

---


### 2️⃣ Create `.env` 

```
NODE_ENV=production
NODE_ENV =production
```

Correct version:

```
PORT=3000
NODE_ENV=production

MONGO_ATLAS=your_real_connection_string

CLOUD_NAME=your_real_cloud_name
CLOUD_API_KEY=your_real_api_key
CLOUD_SECRET=your_real_secret

SESSION_SECRET=your_session_secret
SESSION_CRYPTO_SECRET=your_crypto_secret

EMAIL_USER=your_email
EMAIL_PASS=your_app_password

GIPHY_API_KEY=your_giphy_api_key
SKRAPP_KEY=your_skrapp_key
```


# 🔐 What Each Environment Variable Means

---

## 🌩 1️⃣ Cloudinary (Cloud Storage for Images)

Cloudinary is a cloud service used to:

* Upload images
* Store images
* Resize / optimize images
* Deliver images via CDN

Instead of storing images inside your server, you upload them to Cloudinary.

### Variables:

```
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_SECRET=
```

### What They Mean:

* **CLOUD_NAME** → Your Cloudinary account identifier
* **CLOUD_API_KEY** → Public API key to identify your app
* **CLOUD_SECRET** → Private secret used to authenticate uploads

📌 Why needed?
If your DIARY app allows profile pictures or post images, these credentials let your server upload images securely to Cloudinary.

---

## 🍃 2️⃣ MongoDB Atlas (Database)

MongoDB Atlas is a cloud database service.

Instead of installing MongoDB locally, you host your database online.

### Variable:

```
MONGO_ATLAS=
```

Example format:

```
mongodb+srv://username:password@cluster.mongodb.net/databaseName
```

### What It Means:

* Stores users
* Stores posts
* Stores comments
* Stores follows

📌 Why needed?
Your full-stack app needs a database to store all user and post data.

Without this, your app cannot save anything permanently.

---

## 📧 3️⃣ Email Configuration

Used when you send:

* Verification emails
* Password reset emails
* Notifications

### Variables:

```
EMAIL_USER=
EMAIL_PASS=
```

### What They Mean:

* **EMAIL_USER** → Your Gmail or service email
* **EMAIL_PASS** → App password (NOT your real Gmail password)

⚠ Important:
For Gmail, you must generate an **App Password** from Google settings. Never use your normal password.

📌 Why needed?
Your backend (Node.js + Express) uses Nodemailer to send emails.

---

## 🔑 4️⃣ Session Secrets

Used for authentication security.

### Variables:

```
SESSION_SECRET=
SESSION_CRYPTO_SECRET=
```

### What They Do:

* Encrypt user session data
* Protect login cookies
* Prevent session hijacking

📌 Why needed?
When a user logs in, Express stores session data. These secrets protect that data.

If leaked, attackers can fake login sessions.

---

## 🎞 5️⃣ Giphy API Key

```
GIPHY_API_KEY=
```

Used if your app:

* Adds GIF reactions
* Shows animated GIFs in chat
* Integrates GIF search

It connects your app to Giphy’s API.

---

## 🧠 6️⃣ SKRAPP_KEY

Skrapp is usually an email lookup API.

If you're using it:

* For email validation
* For user verification
* For email intelligence

Then this key connects your app to Skrapp’s service.

If not using it actively, you don’t need it.

---

## ⚙ 7️⃣ PORT

```
PORT=3000
```

This defines which port your Express server runs on.

Example:

* Local → 3000 or 5000
* Production → Provided by hosting service

---

## 🌍 8️⃣ NODE_ENV

```
NODE_ENV=production
```

Tells Node.js which environment the app is running in:

* development
* production
* test

In production:

* Logs are minimized
* Security settings are stricter
* Performance optimized

---




