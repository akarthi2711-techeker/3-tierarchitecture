# AWS Event Platform — Technical Event Registration Portal

> A production-deployed, three-tier web application on AWS for college technical event registrations.
> Built with Flask, MySQL (RDS), Nginx, and deployed on EC2 with Application Load Balancers.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS Cloud — ap-south-1 (Mumbai)             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  VPC  10.0.0.0/16                            │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │              Availability Zone — ap-south-1a           │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌──────────────────┐                                  │  │  │
│  │  │  │  Public Subnet   │  10.0.1.0/24                     │  │  │
│  │  │  │                  │                                  │  │  │
│  │  │  │  ┌────────────┐  │                                  │  │  │
│  │  │  │  │Web-Server  │  │  Nginx + HTML/CSS/JS             │  │  │
│  │  │  │  │  AZ1       │  │  t3.micro                        │  │  │
│  │  │  │  │10.0.1.226  │  │                                  │  │  │
│  │  │  │  └────────────┘  │                                  │  │  │
│  │  │  │  NAT Gateway     │                                  │  │  │
│  │  │  └──────────────────┘                                  │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌──────────────────┐                                  │  │  │
│  │  │  │  Private Subnet  │  10.0.3.0/24  (App Tier)         │  │  │
│  │  │  │                  │                                  │  │  │
│  │  │  │  ┌────────────┐  │                                  │  │  │
│  │  │  │  │App-Server  │  │  Flask API :5001                 │  │  │
│  │  │  │  │  AZ1       │  │  t3.micro                        │  │  │
│  │  │  │  │10.0.3.248  │  │                                  │  │  │
│  │  │  │  └────────────┘  │                                  │  │  │
│  │  │  └──────────────────┘                                  │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌──────────────────┐                                  │  │  │
│  │  │  │  Private Subnet  │  10.0.5.0/24  (DB Tier)          │  │  │
│  │  │  │                  │                                  │  │  │
│  │  │  │  ┌────────────┐  │                                  │  │  │
│  │  │  │  │  RDS MySQL │  │  aws_event_platform              │  │  │
│  │  │  │  │  8.0.x     │  │  db.t3.micro                     │  │  │
│  │  │  │  └────────────┘  │                                  │  │  │
│  │  │  └──────────────────┘                                  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  Internet Gateway ←→ Internet-facing ALB ←→ Web Server      │  │
│  │  Internal ALB ←→ App Server                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

INTERNET
    │
    ▼
Internet Gateway
    │
    ▼
Internet-facing ALB  (internet-alb-1137595128.ap-south-1.elb.amazonaws.com)
    │         HTTP :80
    ▼
Web-Server-AZ1  (Nginx)
    │  serves /event/ → HTML/CSS/JS
    │  proxies /event/api/ → Internal ALB
    ▼
Internal ALB  (internal-Internal-ALB-1620827242.ap-south-1.elb.amazonaws.com)
    │         HTTP :80  →  /api/*  →  Event-API-TG
    ▼
App-Server-AZ1  (Flask :5001)
    │  POST /api/register
    │  GET  /api/health
    ▼
RDS MySQL  (database-1.cpye66uo6s08.ap-south-1.rds.amazonaws.com)
    │  Table: event_registrations
```

---

## Project Overview

| Item | Detail |
|------|--------|
| Project Name | AWS Event Platform |
| Application | Technical Event Registration Portal |
| Cloud Provider | Amazon Web Services (AWS) |
| Region | Asia Pacific — Mumbai (ap-south-1) |
| Architecture | 3-Tier (Web / App / Database) |
| Web Server | Nginx 1.30.4 on Amazon Linux 2023 |
| App Server | Python 3.x + Flask 3.0.3 |
| Database | MySQL 8.0 on Amazon RDS |
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| VPC CIDR | 10.0.0.0/16 |

---

## Folder Structure

```
aws-event-platform/
│
├── event-portal/
│   ├── frontend/                   ← Served by Nginx on Web EC2
│   │   ├── index.html              ← Registration form (main page)
│   │   ├── register.html           ← Redirects to index.html
│   │   ├── success.html            ← Post-registration confirmation
│   │   ├── styles.css              ← Complete UI styling
│   │   ├── script.js               ← Form validation + API calls
│   │   └── assets/                 ← Images and icons
│   │
│   └── backend/                    ← Runs on App EC2 (Flask :5001)
│       ├── app.py                  ← Flask application entry point
│       ├── config.py               ← Environment-based configuration
│       ├── db.py                   ← MySQL connection + query helper
│       ├── requirements.txt        ← Python dependencies
│       └── routes/
│           ├── __init__.py
│           └── registration.py     ← POST /api/register, GET /api/health
│
├── database/
│   └── commands.sql                ← Schema + seed data
│
├── nginx/
│   └── nginx.conf                  ← Web server configuration
│
├── .env.example                    ← Environment variable template
├── .env                            ← Real config (not committed to Git)
├── .gitignore
└── README.md
```

---

## AWS Infrastructure

### VPC and Networking

| Resource | Name | CIDR / Value |
|----------|------|-------------|
| VPC | aws-event-platform-vpc | 10.0.0.0/16 |
| Public Subnet AZ1 | Public-Web-AZ1 | 10.0.1.0/24 |
| Private Subnet AZ1 | Private-App-AZ1 | 10.0.3.0/24 |
| DB Subnet AZ1 | Private-DB-AZ1 | 10.0.5.0/24 |
| Internet Gateway | aws-event-platform-igw | — |
| NAT Gateway | NAT-GW | Elastic IP attached |

### Route Tables

| Route Table | Subnet | Routes |
|-------------|--------|--------|
| Public-RT | Public-Web-AZ1 | 0.0.0.0/0 → IGW |
| Private-App-RT | Private-App-AZ1 | 0.0.0.0/0 → NAT-GW |
| Private-DB-RT | Private-DB-AZ1 | Local only |

### Security Groups

| Security Group | Inbound Rules | Purpose |
|---------------|---------------|---------|
| Frontend-ALB-SG | 80, 443 from 0.0.0.0/0 | Internet-facing ALB |
| WebServer-SG | 80 from Frontend-ALB-SG | Web EC2 Nginx |
| Backend-ALB-SG | 5001, 5002 from WebServer-SG | Internal ALB |
| AppServer-SG | 5001, 5002 from Backend-ALB-SG + WebServer-SG | App EC2 Flask |
| Database-SG | 3306 from AppServer-SG | RDS MySQL |

### EC2 Instances

| Name | Type | Subnet | Public IP | Purpose |
|------|------|--------|-----------|---------|
| Web-Server-AZ1 | t3.micro | Public-Web-AZ1 | 13.232.97.157 | Nginx frontend |
| App-Server-AZ1 | t3.micro | Private-App-AZ1 | None | Flask backend |

### Load Balancers

| ALB | Scheme | DNS | Purpose |
|-----|--------|-----|---------|
| Internet-ALB | Internet-facing | internet-alb-1137595128.ap-south-1.elb.amazonaws.com | Routes user traffic to Web EC2 |
| Internal-ALB | Internal | internal-Internal-ALB-1620827242.ap-south-1.elb.amazonaws.com | Routes API calls to App EC2 |

### Target Groups

| Target Group | Port | Health Check | Targets |
|-------------|------|-------------|---------|
| Web-TG | 80 | GET /health | Web-Server-AZ1 |
| Event-API-TG | 5001 | GET /api/health | App-Server-AZ1 |

### RDS Database

| Setting | Value |
|---------|-------|
| Endpoint | database-1.cpye66uo6s08.ap-south-1.rds.amazonaws.com |
| Engine | MySQL 8.0 |
| Instance | db.t3.micro |
| Database | aws_event_platform |
| Subnet Group | Private-DB-AZ1 |
| Public Access | No |
| Security Group | Database-SG |

---

## Application — Event Registration Portal

### Purpose
Students register for college technical events online. The system collects student details, validates input, prevents duplicate registrations, stores data in MySQL, and returns a unique Registration ID.

### Registration Form Fields

| Field | Type | Validation |
|-------|------|-----------|
| Student Name | text | Required, 3–100 chars |
| Email ID | email | Required, valid format, max 150 chars |
| Phone Number | tel | Required, 10 digits, Indian mobile (6–9 start) |
| Department | dropdown | 8 options |
| College | text | Required, max 200 chars |
| Event | dropdown | Hackathon, Workshop, Paper Presentation, Project Presentation |
| Year | dropdown | 1st–4th Year |

### Available Events

- Hackathon
- Workshop
- Paper Presentation
- Project Presentation

### Registration Flow

```
Student fills form
      │
      ▼
Frontend validation (JavaScript)
  - Required fields
  - Email format
  - Phone 10-digit Indian mobile
      │
      ▼
POST /event/api/register (JSON)
      │
      ▼
Nginx Web EC2
  - Receives request on /event/api/
  - Proxies to Internal ALB
      │
      ▼
Internal ALB
  - Routes /api/* to Event-API-TG
      │
      ▼
Flask App EC2 (port 5001)
  - Backend validation (duplicate of frontend)
  - Duplicate check (email + event)
  - Generate Registration ID (EVT20260001)
  - INSERT into RDS MySQL
      │
      ▼
RDS MySQL
  - Stores registration record
      │
      ▼
Response: { success: true, registration_id: "EVT20260001" }
      │
      ▼
Frontend redirects to success.html
  - Shows Registration ID
  - Shows student details
```

---

## API Reference

### POST /api/register

Register a student for an event.

**Request:**
```json
{
  "student_name": "Karthikeyan M A",
  "email": "karthik@college.edu",
  "phone": "9876543210",
  "department": "B.E. Computer Science and Engineering",
  "college": "Sri Venkateswara College of Engineering",
  "event": "Hackathon",
  "year": "3rd Year"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "registration_id": "EVT20260002"
}
```

**Duplicate Response (409):**
```json
{
  "success": false,
  "message": "You have already registered for this event."
}
```

**Validation Error (422):**
```json
{
  "success": false,
  "message": "Student name is required.",
  "errors": ["Student name is required.", "Email is required."]
}
```

### GET /api/health

Load balancer health check.

**Response (200):**
```json
{
  "status": "healthy",
  "service": "event-registration-api"
}
```

---

## Database Schema

```sql
CREATE TABLE event_registrations (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  registration_id  VARCHAR(30)  UNIQUE NOT NULL,   -- EVT20260001
  student_name     VARCHAR(100) NOT NULL,
  email            VARCHAR(150) NOT NULL,
  phone            VARCHAR(15)  NOT NULL,
  department       VARCHAR(150) NOT NULL,
  college          VARCHAR(200) NOT NULL,
  event            VARCHAR(100) NOT NULL,
  year             VARCHAR(20)  NOT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_email_event (email, event),       -- duplicate prevention
  INDEX idx_email   (email),
  INDEX idx_event   (event),
  INDEX idx_created (created_at)
);
```

---

## Security Implementation

| Layer | Implementation |
|-------|---------------|
| Input Validation | Frontend (JS) + Backend (Python) — both layers |
| SQL Injection | Parameterized queries only — no string concatenation |
| Duplicate Prevention | UNIQUE constraint on (email, event) + app-level check |
| Credentials | Environment variables only — never hardcoded |
| Database Access | Private subnet — not accessible from internet |
| App Server Access | Private subnet — only reachable via Internal ALB |
| CORS | Restricted to ALB DNS origin |
| Security Groups | Layered — each tier only accepts from previous tier |
| Error Messages | Generic client errors — real errors logged server-side only |

---

## Nginx Request Flow

```
Browser: GET http://ALB-DNS/event/
              │
              ▼
Internet ALB → Web-Server-AZ1 :80
              │
              ▼ Nginx routing:
              │
              ├── /event/api/*  → proxy_pass → Internal ALB → Flask
              │
              └── /event/      → alias /var/www/event-portal/
                                  serves HTML/CSS/JS files
```

---

## Local Development

### Prerequisites
- Python 3.11+
- MySQL 8.x
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/aws-event-platform.git
cd aws-event-platform

# Configure environment
cp .env.example .env
# Edit .env with your local MySQL credentials

# Create database
mysql -u root -p < database/commands.sql

# Start backend
cd event-portal/backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
python app.py
# Flask starts on http://localhost:5001

# Start frontend (new terminal)
cd event-portal/frontend
python -m http.server 8081
# Open http://localhost:8081
```

### Environment Variables

```bash
# .env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=aws_event_platform

EVENT_SECRET_KEY=your-secret-key
EVENT_DEBUG=true
EVENT_PORT=5001
EVENT_CORS_ORIGINS=http://localhost:8081
```

---

## Deployment on AWS EC2

### Web Server Setup (Amazon Linux 2023)

```bash
# Install Nginx
sudo dnf install -y nginx git

# Clone project
git clone https://github.com/YOUR_USERNAME/aws-event-platform.git

# Deploy frontend
sudo mkdir -p /var/www/event-portal
sudo cp -r aws-event-platform/event-portal/frontend/* /var/www/event-portal/

# Configure Nginx
sudo cp aws-event-platform/nginx/nginx.conf /etc/nginx/nginx.conf
# Update APP_EC2_PRIVATE_IP in nginx.conf

sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

### App Server Setup (Amazon Linux 2023)

```bash
# Install Python
sudo dnf install -y python3 python3-pip git

# Clone project
git clone https://github.com/YOUR_USERNAME/aws-event-platform.git

# Install dependencies
cd aws-event-platform/event-portal/backend
pip3 install -r requirements.txt

# Create .env
nano .env  # fill in RDS credentials

# Import database
mysql -h RDS_ENDPOINT -u admin -p aws_event_platform \
      < aws-event-platform/database/commands.sql

# Start Flask
nohup python3 app.py > /tmp/event-api.log 2>&1 &
```

---

## Testing

### API Tests

```bash
# Health check
curl http://localhost:5001/api/health

# Register a student
curl -X POST http://localhost:5001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Test Student",
    "email": "test@college.edu",
    "phone": "9876543210",
    "department": "B.E. Computer Science and Engineering",
    "college": "Test College",
    "event": "Hackathon",
    "year": "2nd Year"
  }'

# Test duplicate prevention (same email + event)
# Run above command again — should return 409
```

### Verify in Database

```sql
USE aws_event_platform;
SELECT registration_id, student_name, email, event, created_at
FROM event_registrations
ORDER BY created_at DESC;
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| 502 Bad Gateway | Flask not running | Restart Flask on App EC2 |
| 504 Gateway Timeout | Security group blocking | Add port 5001 rule to AppServer-SG from WebServer-SG |
| Unable to connect to server | CORS mismatch | Update EVENT_CORS_ORIGINS in .env to match ALB DNS |
| Registration fails silently | Wrong API path in JS | Check script.js uses /event/api/register |
| RDS connection refused | Wrong security group | Add AppServer-SG to Database-SG inbound |
| EC2 Instance Connect fails | No public IP / DNS | Enable DNS hostnames on VPC |

---

## Cost Estimate (ap-south-1, monthly)

| Resource | Type | Estimated Cost |
|----------|------|---------------|
| Web EC2 | t3.micro | ~$8/month |
| App EC2 | t3.micro | ~$8/month |
| RDS MySQL | db.t3.micro | ~$15/month |
| NAT Gateway | Single | ~$32/month |
| Internet ALB | Application | ~$18/month |
| Internal ALB | Application | ~$18/month |
| EBS Volumes (2×8GB) | gp3 | ~$1.6/month |
| **Total** | | **~$100/month** |

> Stop RDS when not in use to save ~$15/month. Terminate EC2 instances when not needed.

---

## Project Author

| Field | Value |
|-------|-------|
| Developer | Karthikeyan M A |
| AWS Account | YOUR_AWS_ACCOUNT_ID |
| Region | ap-south-1 (Mumbai) |
| Project | AWS 3-Tier Architecture Workshop |
| Date | August 2026 |
