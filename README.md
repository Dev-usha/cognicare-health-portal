CogniCare Health Portal



CogniCare Health Portal is an AI-powered cognitive wellness and screening platform that provides structured cognitive assessments, performance scoring, health tracking, and personalized insights.



The application combines a React + TypeScript frontend, Node.js + Express backend, and Google Gemini API for optional AI-assisted analysis.



🌐 Live Demo



https://cognicare-0ygs.onrender.com



✨ Features

User registration and login

Password recovery

Multidomain cognitive screening

Deterministic cognitive scoring

AI-assisted analysis using Google Gemini

Personalized cognitive insights

Cognitive health dashboard

Cognitive health tracking

AI fallback to deterministic analysis when Gemini is unavailable

Responsive user interface

Server-side API integration

🛠️ Technology Stack

Category	Technologies

Frontend	React, TypeScript, Vite

Styling \& UI	CSS, Lucide React, Motion

Backend	Node.js, Express, TypeScript

AI	Google Gemini API, @google/genai

Package Manager	npm

Version Control	Git, GitHub

📁 Project Structure

cognicare-health-portal/

│

├── assets/

├── src/

│   ├── components/

│   │   ├── Auth/

│   │   ├── Dashboard/

│   │   ├── Screening/

│   │   └── Navbar.tsx

│   │

│   ├── data/

│   ├── utils/

│   ├── App.tsx

│   ├── index.css

│   ├── main.tsx

│   └── types.ts

│

├── .env.example

├── .gitignore

├── index.html

├── metadata.json

├── package.json

├── server.ts

├── tsconfig.json

├── vite.config.ts

└── README.md

🚀 Installation

Prerequisites

Node.js

npm

Git

Clone the Repository

git clone https://github.com/Dev-usha/cognicare-health-portal.git

cd cognicare-health-portal

Install Dependencies

npm install

🔐 Environment Configuration



Create a .env file in the project root:



GEMINI\_API\_KEY=your\_gemini\_api\_key

APP\_URL=http://localhost:3000



The .env file should never be committed to GitHub. Use .env.example as the reference for required variables.



▶️ Run Locally



Start the development server:



npm run dev

🏭 Production Build



Build the application:



npm run build



Start the production server:



npm start

🔌 API

Health Check

GET /api/health



Returns the backend status and Gemini configuration status.



Screening Analysis

POST /api/screening/analyze



Processes cognitive screening responses and returns AI-assisted or deterministic analysis.



🤖 AI Analysis



CogniCare uses Google Gemini for optional AI-assisted analysis of screening responses.



If the Gemini service is unavailable, the application uses its deterministic scoring system as a fallback so that the screening workflow can continue.



🔒 Security

API credentials are stored through environment variables.

.env is excluded from Git tracking.

Gemini API requests are handled by the backend.

API keys should never be exposed in frontend code or committed to the repository.

📜 Available Scripts

Command	Description

npm install	Install dependencies

npm run dev	Start development server

npm run build	Build for production

npm start	Start production server

npm run preview	Preview the production build

npm run lint	Run TypeScript checks

npm run clean	Remove generated build files

⚠️ Disclaimer



CogniCare is intended for cognitive wellness, screening support, and research-oriented use. Its results are not a medical diagnosis and should not replace professional medical evaluation or treatment.

