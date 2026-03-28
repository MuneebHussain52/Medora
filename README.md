# 📱 Mini Social Media App

> A full-stack MERN social media web application with user authentication, post creation, likes, comments, follow system, and user profiles.

---

## 🚀 Live Demo

> Coming soon — deployment in progress

---

## ✨ Features

- 🔐 User registration and login with JWT authentication
- 📝 Create and delete posts
- ❤️ Like and comment on posts
- 👥 Follow and unfollow users
- 👤 User profile pages
- 📱 Responsive and clean UI with Tailwind CSS
- ⚡ Fast rendering with React + Vite

---

## 🛠️ Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Frontend       | React.js, JavaScript (ES6+), Tailwind CSS, Vite |
| Backend        | Node.js, Express.js                             |
| Database       | MongoDB                                         |
| Authentication | JWT (JSON Web Tokens)                           |

---

## 📂 Project Structure

```
mini-social-media/
├── Backend/
│   ├── config/
│   │   └── db.js
│   ├── controller/
│   │   ├── auth/
│   │   │   └── auth.js
│   │   └── posts.js
│   ├── middleware/
│   │   └── auth.js
│   ├── modal/
│   │   ├── posts-schema.js
│   │   └── user-schema.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   └── user.js
│   ├── app.js
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── feedpage.jsx
│   │   │   ├── login.jsx
│   │   │   ├── profile.jsx
│   │   │   └── signup.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v16+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd Backend
npm install

# Create .env file
cp .env.example .env
# Add your MongoDB URI and JWT secret

npm start
```

### Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`

---

## 🔐 Security

- JWT authentication with protected routes
- Password hashing with bcrypt
- Middleware-based route protection
- Input validation

---

## 👨‍💻 Author

**Muneeb Hussain Anjam**

- 📧 [muneeb525353@gmail.com](mailto:muneeb525353@gmail.com)
- 💼 [linkedin.com/in/mhussainn](https://linkedin.com/in/mhussainn)
- 🐙 [github.com/MuneebHussain52](https://github.com/MuneebHussain52)

---

## 📜 License

This project is open-source and intended for educational purposes.
