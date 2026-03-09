# Task Manager API

Простой бэкенд для управления задачами с интеграцией внешнего API.

## 🚀 Функционал

### Задачи (своя БД)
- `GET /api/tasks` - все задачи
- `GET /api/tasks/:id` - задача по ID
- `POST /api/tasks` - создать задачу
- `PUT /api/tasks/:id` - обновить задачу
- `DELETE /api/tasks/:id` - удалить задачу

### Внешнее API (RandomUser)
- `GET /api/external/fetch-random-users?count=N` - получить и сохранить N случайных пользователей
- `GET /api/external/users` - все сохранённые пользователи
- `GET /api/external/statistics` - статистика по пользователям

### Документация
- `GET /api-docs` - Swagger UI

## 🛠 Технологии
- Node.js + Express
- PostgreSQL
- Docker & Docker Compose
- Swagger/OpenAPI
- GitHub Actions (CI/CD)

## 🚀 Быстрый старт

```bash
# Клонировать
git clone https://github.com/dakrasev/projectAPI.git
cd projectAPI

# Запустить
docker-compose up -d --build

# Проверить
curl http://localhost:3000/health