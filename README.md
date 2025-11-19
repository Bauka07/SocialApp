Social Media Platform
A full-stack social media application with real-time messaging, post sharing, and user authentication.
Features

Posts & Interactions: View, create, like, comment on, and share posts
User Profiles: Customize your profile with photo uploads and account settings
Real-Time Messaging: Search for friends and chat instantly using WebSocket
Authentication:

Manual sign up/sign in
Google OAuth integration
reCAPTCHA protection
Password recovery via email verification


Contact Form: Submit questions or feedback directly through the platform

Tech Stack
Frontend:

React
Tailwind CSS
Shadcn UI

Backend:

Golang
Gin (Web Framework)
WebSocket (Real-time communication)

Database & Infrastructure:

PostgreSQL
Docker
Nginx

Third-Party Services:

Cloudinary (Image hosting)
Mailtrap (Email testing)
Gomail (Email sending)
Google OAuth
reCAPTCHA

Getting Started
Prerequisites

Node.js and npm
Go 1.x or higher
PostgreSQL
Docker Desktop (optional, for Docker setup)

Installation

Clone the repository:

bash   mkdir folder_name
   cd folder_name
   git clone https://github.com/MaqsattoTeam/SocialApp
   cd SocialApp

Set up environment variables:
Create a .env file in the client directory:

env   VITE_API_URL=http://localhost:8080
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
Create a .env file in the server directory:
env   JWT_SECRET=your_jwt_secret_key
   PORT=8080
   DSN=your_postgresql_connection_string
   CLOUDINARY_URL=your_cloudinary_url
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URL=your_google_redirect_url
   RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
   MAILTRAP_TOKEN=your_mailtrap_token
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_16_character_app_password
Running the Application
Option 1: Manual Setup
Open two terminal windows:
Terminal 1 (Frontend):
bashcd client
npm install
npm run dev
Terminal 2 (Backend):
bashcd server
go mod download
air
Or without Air:
bashcd server/cmd
go run main.go
Option 2: Docker Setup
If you have Docker Desktop installed:
bashdocker compose pull
docker compose up
The application will be available at http://localhost:3000 (frontend) and http://localhost:8080 (backend).
Screenshots

Landing/login page
Main feed with posts
User profile page
Real-time chat interface
Mobile responsive views

Then embed them in the README using:
markdown![Login Page](./screenshots/login.png)
![Main Feed](./screenshots/feed.png)
You could also add a demo video or GIF showing the key features in action!
