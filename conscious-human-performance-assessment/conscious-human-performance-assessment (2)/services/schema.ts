
/**
 * DATABASE SCHEMA DOCUMENTATION
 * 
 * This file outlines the proposed database schema for the Postgres/Firebase backend.
 * Current implementation uses in-memory mock data (see services/mockData.ts).
 */

/*
TABLE: users
- id: UUID (Primary Key)
- email: VARCHAR(255) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- full_name: VARCHAR(255)
- role: ENUM('admin', 'user') DEFAULT 'user'
- created_at: TIMESTAMP DEFAULT NOW()
- last_login: TIMESTAMP

TABLE: questions
- id: UUID (Primary Key)
- section_id: VARCHAR(10) (e.g., 'A', 'B')
- category: VARCHAR(100)
- title: VARCHAR(100)
- text: TEXT NOT NULL
- order_index: INTEGER
- is_active: BOOLEAN DEFAULT TRUE

TABLE: submissions
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key -> users.id)
- created_at: TIMESTAMP DEFAULT NOW()
- completion_time_seconds: INTEGER
- device_type: VARCHAR(50)
- geo_location: VARCHAR(100)

TABLE: submission_answers
- id: UUID (Primary Key)
- submission_id: UUID (Foreign Key -> submissions.id)
- question_id: UUID (Foreign Key -> questions.id)
- answer_boolean: BOOLEAN
- answer_text: TEXT (Optional, for future qualitative questions)

TABLE: submission_scores
- id: UUID (Primary Key)
- submission_id: UUID (Foreign Key -> submissions.id)
- energy: DECIMAL(4,2)
- awareness: DECIMAL(4,2)
- love: DECIMAL(4,2)
- tribe: DECIMAL(4,2)
- career: DECIMAL(4,2)
- abundance: DECIMAL(4,2)
- fitness: DECIMAL(4,2)
- health: DECIMAL(4,2)
- adventure: DECIMAL(4,2)
- ai_generated_summary: TEXT

TABLE: admin_audit_logs
- id: UUID
- admin_id: UUID
- action: VARCHAR(100)
- target_resource: VARCHAR(100)
- timestamp: TIMESTAMP
*/

// API ENDPOINT SPECIFICATION

/*
GET /api/v1/admin/stats
- Returns: DashboardMetrics object
- Auth: Bearer Token (Admin)

GET /api/v1/submissions
- Params: page, limit, sort_by, filter_quadrant
- Returns: Paginated list of Submissions
- Auth: Bearer Token (Admin)

GET /api/v1/submissions/:id
- Returns: Full Submission details including answers
- Auth: Bearer Token (Admin)

POST /api/v1/submissions/:id/analyze
- Triggers AI analysis for a specific submission
- Returns: Updated Submission with aiSummary
- Auth: Bearer Token (Admin)

POST /api/v1/auth/login
- Body: { email, password }
- Returns: { token, user }
*/
