# Expensio — Monorepo

Full-stack personal finance app: **React + TypeScript** frontend, **Laravel 11 + MySQL** backend, fully dockerized.

```
expensio-app/
├── frontend/        React + Vite + TypeScript
├── backend/         Laravel 11 API
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Docker)

### Requirements
- Docker Desktop installed and running
- PhpStorm (or any editor)

### 1. Clone / Extract the project

### 2. Set up environment files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Start everything with Docker

```bash
docker-compose up --build
```

This will start:
| Service      | URL                          |
|-------------|-------------------------------|
| Frontend    | http://localhost:5173          |
| Backend API | http://localhost:8000/api      |
| phpMyAdmin  | http://localhost:8080          |
| MySQL       | localhost:3306                 |

### 4. Open in browser

Go to **http://localhost:5173** — you'll see the Expensio login page.

---

## 🛠 Running Without Docker (Manual)

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Edit .env: set DB_HOST=127.0.0.1 and your local MySQL credentials

php artisan migrate
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 📡 API Endpoints

### Auth (public)
| Method | Endpoint        | Description       |
|--------|----------------|-------------------|
| POST   | /api/register  | Register new user |
| POST   | /api/login     | Login             |

### Auth (protected — requires Bearer token)
| Method | Endpoint        | Description          |
|--------|----------------|----------------------|
| POST   | /api/logout    | Logout               |
| GET    | /api/me        | Get current user     |
| PATCH  | /api/settings  | Update user settings |

### Transactions
| Method | Endpoint                    | Description         |
|--------|-----------------------------|---------------------|
| GET    | /api/transactions           | List (filterable)   |
| POST   | /api/transactions           | Create              |
| PATCH  | /api/transactions/{id}      | Update              |
| DELETE | /api/transactions/{id}      | Delete one          |
| DELETE | /api/transactions           | Bulk delete (ids[]) |

### Categories
| Method | Endpoint                  | Description |
|--------|--------------------------|-------------|
| GET    | /api/categories          | List        |
| POST   | /api/categories          | Create      |
| PATCH  | /api/categories/{id}     | Update      |
| DELETE | /api/categories/{id}     | Delete      |

### Budgets
| Method | Endpoint             | Description      |
|--------|---------------------|------------------|
| GET    | /api/budgets        | List             |
| POST   | /api/budgets        | Create or update |
| DELETE | /api/budgets/{id}   | Delete           |

### Query params for GET /api/transactions
- `type` — income | expense
- `month` — YYYY-MM
- `category_id` — integer
- `search` — string

---

## 🗄 Database Schema

```
users
  id, name, username, password, currency, language, dark_mode

categories
  id, user_id, name, type, color, icon

transactions
  id, user_id, category_id, type, amount, description, date, recurring, recurring_interval

budgets
  id, user_id, category_id, amount, month
```

---

## 🔐 Authentication

The API uses **Laravel Sanctum** token-based auth.

After login/register, store the token and send it as:
```
Authorization: Bearer <token>
```

---

## PhpStorm Tips

- Open the **root folder** (`expensio-app/`) as the project
- Use **Services** panel to manage Docker containers
- Install the **Laravel** and **PHP** plugins for full IDE support
- Set PHP interpreter to the Docker container: `Settings → PHP → CLI Interpreter → From Docker`
