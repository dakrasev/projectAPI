const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const axios = require('axios');
const { pool } = require('./database');

const app = express();

app.use(cors());
app.use(express.json());

// Swagger definition
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Task Manager API with External Integration',
            version: '1.0.0',
            description: 'Task Manager API with RandomUser integration',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
    },
    apis: ['./src/app.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the task
 *         title:
 *           type: string
 *           description: The task title
 *         description:
 *           type: string
 *           description: The task description
 *         status:
 *           type: string
 *           description: Task status (pending/completed)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *     ExternalUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         uuid:
 *           type: string
 *         gender:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         country:
 *           type: string
 *         city:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

// ==================== TASKS CRUD OPERATIONS ====================

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Returns all tasks
 *     responses:
 *       200:
 *         description: List of all tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
app.get('/api/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task found
 *       404:
 *         description: Task not found
 */
app.get('/api/tasks/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 */
app.post('/api/tasks', async (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
            [title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated
 */
app.put('/api/tasks/:id', async (req, res) => {
    const { title, description, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status) WHERE id = $4 RETURNING *',
            [title, description, status, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Task deleted
 */
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== EXTERNAL API INTEGRATION (RandomUser) ====================

/**
 * @swagger
 * /api/external/fetch-random-users:
 *   get:
 *     summary: Get random users from RandomUser API and save to database
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of users to fetch (1-20)
 *     responses:
 *       200:
 *         description: Users fetched and saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExternalUser'
 */
app.get('/api/external/fetch-random-users', async (req, res) => {
    const count = Math.min(parseInt(req.query.count) || 5, 20);

    try {
        // 1. Request to external API
        const response = await axios.get(`https://randomuser.me/api/?results=${count}`);
        const users = response.data.results;

        // 2. Save to database
        const savedUsers = [];
        for (const user of users) {
            const query = `
        INSERT INTO external_users 
        (uuid, gender, first_name, last_name, email, phone, country, city)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (uuid) DO NOTHING
        RETURNING *
      `;
            const values = [
                user.login.uuid,
                user.gender,
                user.name.first,
                user.name.last,
                user.email,
                user.phone,
                user.location.country,
                user.location.city
            ];

            const result = await pool.query(query, values);
            if (result.rows.length > 0) {
                savedUsers.push(result.rows[0]);
            }
        }

        res.json({
            message: `Saved ${savedUsers.length} new users`,
            users: savedUsers
        });

    } catch (error) {
        console.error('Error fetching/saving users:', error);
        res.status(500).json({ error: 'Error fetching data from external API' });
    }
});

/**
 * @swagger
 * /api/external/users:
 *   get:
 *     summary: Get all saved users from database
 *     responses:
 *       200:
 *         description: List of users from database
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExternalUser'
 */
app.get('/api/external/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM external_users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/external/users/{id}:
 *   get:
 *     summary: Get user by ID from database
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
app.get('/api/external/users/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM external_users WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/external/statistics:
 *   get:
 *     summary: Get statistics about saved users
 *     responses:
 *       200:
 *         description: Statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_users:
 *                   type: integer
 *                 by_country:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       country:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 by_gender:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       gender:
 *                         type: string
 *                       count:
 *                         type: integer
 */
app.get('/api/external/statistics', async (req, res) => {
    try {
        const total = await pool.query('SELECT COUNT(*) FROM external_users');
        const byCountry = await pool.query('SELECT country, COUNT(*) FROM external_users GROUP BY country ORDER BY count DESC');
        const byGender = await pool.query('SELECT gender, COUNT(*) FROM external_users GROUP BY gender');

        res.json({
            total_users: parseInt(total.rows[0].count),
            by_country: byCountry.rows,
            by_gender: byGender.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== HEALTH CHECK ====================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: API is healthy
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

module.exports = app;