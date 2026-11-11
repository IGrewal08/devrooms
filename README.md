# devrooms

## DB setup

    (For Mac and Linux we recommend downloading and running the official PostgreSQL app. Provided Link: https://www.postgresql.org/download/?lang=en )

    1) Run psql on Terminal/Shell to open postgres command line
    2) Run: `CREATE DATABASE devrooms`;
        `CREATE USER db_user WITH ENCRYPTED PASSWORD 'your_secure_password';` (use this username and password in .env)
        `GRANT ALL PRIVILEGES ON DATABASE devrooms TO db_user;`
    3) Configure `.env` in the backend directory (based on `.env.example`)

## Running React Frontend

    - CD into frontend directory: `cd frontend`
    - `npm install`
    - RUN the client:  `npm run dev`
    - Open `http://localhost:5173/` in a browser

## Running Express Backend

    - CD into backend directory: `cd backend`
    - Run `npm install` for dependencies
    - Create .env and used .env.example to fill in required variables
    - Seed DB: 'npm run seed'
    - RUN the server: `npm start`
