# FlameWall Project

A full-stack social web platform for the Minecraft gaming community, developed with a NestJS backend and a React frontend. The entire environment is orchestrated using Docker.

## Core Technologies
- **Backend:** NestJS, TypeScript, TypeORM, PostgreSQL, Passport.js (JWT), Socket.IO, Class-Validator
- **Frontend:** React, React Router, Material-UI (Joy UI), Axios, Socket.IO Client
- **Environment:** Docker, Docker Compose

## Prerequisites
- Docker Desktop
- Git
- **For Windows Users:** An installed and working **WSL 2** subsystem is required. It is *highly recommended* to work from within the WSL 2 filesystem to avoid common issues.

## First-Time Setup & Installation

1.  **Clone the Repository:**
    *For Windows users, it is best to execute these commands inside a WSL terminal (e.g., Ubuntu), not in PowerShell or CMD.*
    ```bash
    git clone [https://github.com/Sknery/FlameWall.git](https://github.com/Sknery/FlameWall.git)
    cd FlameWall
    ```

2.  **Create the Configuration File:**
    In the project root, you will find a `.env.example` file. Create a copy of it and name the copy `.env`.
    ```bash
    cp .env.example .env
    ```
    Now, open the new `.env` file and replace all placeholder values (e.g., `your_secret_password` or `replace_this...`) with your actual secret values.

3.  **Install Dependencies:**
    This needs to be done once for both the backend and the frontend.
    ```bash
    # Install backend dependencies
    cd backend
    npm install
    cd ..

    # Install frontend dependencies
    cd frontend
    npm install
    cd ..
    ```

4.  **Launch the Project:**
    This single command will build the Docker images (on first launch) and start all services in detached mode.
    ```bash
    docker-compose up --build -d
    ```

## Accessing the Services

Once successfully launched, the application services will be available at the following addresses:
- **Website (Frontend):** [http://localhost:5173](http://localhost:5173)
- **API (Backend):** [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger):** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **PgAdmin (DB Management):** [http://localhost:5050](http://localhost:5050) (use the email and password from your `.env` file to log in)

## Stopping the Project
To stop all running containers, use:
```bash
docker-compose down
```
---

## Important for Windows Users (Solving the `EIO` Error)

If your containers are constantly restarting with an `EIO: i/o error` in the logs, this is a known issue with Docker Desktop's file-watching capabilities on Windows.

**The guaranteed solution is to place and run the project from *within the WSL2 filesystem*, not from your Windows `C:\` drive.**

**How to do it:**
1. Open your Ubuntu terminal (or other WSL distro).
2. Navigate to your home directory with `cd ~`.
3. Clone the repository here: `git clone https://github.com/Sknery/FlameWall.git`.
4. Navigate into the project folder: `cd FlameWall`.
5. Open the project in VS Code by running the command `code .` (this will launch VS Code in a special remote-development mode connected to WSL).
6. From there, follow the standard installation instructions (create `.env`, run `docker-compose up`).