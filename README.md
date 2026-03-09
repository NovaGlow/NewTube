# NewTube

NewTube is a full stack web application that lets you explore YouTube videos completely outside of your normal algorithm. Instead of being shown content based on your watch history, NewTube pulls trending videos from 12 different countries and 15 different categories giving you a genuinely fresh experience every time you open it.

You can search for any topic, filter by country or category, hit the Surprise Me button to get a completely random video from anywhere in the world, and save videos to your personal collection.

## Tech Stack

The frontend is built with Angular 17 and SCSS. The backend runs on Node.js with Express. User data is stored in a PostgreSQL database. Authentication is handled with JWT tokens. Videos are sourced from the YouTube Data API v3.

## Prerequisites

Before running the app you need the following installed on your machine.

Node.js version 18 or higher. You can download it at nodejs.org.

PostgreSQL version 14 or higher. You can download it at postgresql.org/download.

Angular CLI. Install it by running this in your terminal.

```
npm install -g @angular/cli
```

A YouTube Data API v3 key. Go to console.cloud.google.com, create a project, enable the YouTube Data API v3, then go to Credentials and create an API key.

## Getting Started

Clone the repository and open the project folder in your terminal.

**Install backend dependencies**

```
cd backend
npm install
```

**Install frontend dependencies**

```
cd frontend
npm install
```

## Configure the Backend

Inside the backend folder copy the example env file.

```
cp .env.example .env
```

Open the .env file in any text editor and fill in your details.

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=newtube
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=any_long_random_string

YOUTUBE_API_KEY=your_youtube_api_key
```

## Set Up the Database

Make sure PostgreSQL is running then run the setup script from inside the backend folder.

```
npm run db:setup
```

This will automatically create the newtube database and build all the required tables. When it is done you will see a confirmation message in the terminal.

## Running the App

You will need two terminals open at the same time.

**Terminal 1 for the backend**

```
cd backend
npm run dev
```

The API will be running at http://localhost:3000

**Terminal 2 for the frontend**

```
cd frontend
ng serve
```

The app will be running at http://localhost:4200

Open http://localhost:4200 in your browser, create a free account and start exploring.

## Features

Discover trending videos from countries including the US, Japan, Brazil, India, Nigeria, South Korea, France, Germany, Australia, Mexico, the UK and South Africa.

Search any topic and get results pulled from a random region for extra variety.

Hit the Surprise Me button to get one completely random video from anywhere on YouTube.

Save videos you like to your personal collection and come back to them anytime.

Manage your profile and select the categories you enjoy most.

## Common Issues

If the database setup fails make sure PostgreSQL is actually running and that the password in your .env file is correct.

If videos are not loading double check your YOUTUBE_API_KEY in the .env file and make sure the YouTube Data API v3 is enabled in your Google Cloud project.

If port 3000 is already in use change PORT to another number in your .env file and update the apiUrl in frontend/src/environments/environment.ts to match.
