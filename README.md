# aws-event-platform

A production-ready, AWS-deployable platform containing **two completely separate web applications** inside one root project folder.

| Portal | Purpose | Backend Port | Frontend Port |
|--------|---------|--------------|---------------|
| **Event Registration Portal** | Students register for college tech events | 5001 | 8081 |
| **Student Result Portal** | Students view examination results after login | 5002 | 8082 |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Event Registration Portal](#3-event-registration-portal)
4. [Student Result Portal](#4-student-result-portal)
5. [Database](#5-database)
6. [Local Development](#6-local-development)
7. [AWS Architecture](#7-aws-architecture)
8. [VPC & Subnets](#8-vpc--subnets)
9. [Security Groups](#9-security-groups)
10. [EC2 Instances](#10-ec2-instances)
11. [Application Load Balancers](#11-application-load-balancers)
12. [RDS MySQL](#12-rds-mysql)
13. [Amazon S3](#13-amazon-s3)
14. [Route 53](#14-route-53)
15. [ACM (SSL/TLS)](#15-acm-ssltls)
16. [Auto Scaling](#16-auto-scaling)
17. [Routing Modes](#17-routing-modes)
18. [Deployment Guide](#18-deployment-guide)
19. [Testing](#19-testing)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Project Overview

```
aws-event-platform/
├── event-portal/            ← Website 1: Event Registration
│   ├── frontend/
│   └── backend/             ← Flask API on port 5001
├── student-result-portal/   ← Website 2: Student Results
│   ├── frontend/
│   └── backend/             ← Flask API on port 5002
├── database/
│   └── commands.sql         ← Schema + seed data
├── nginx/
│   └── nginx.conf           ← Web tier config (path + host routing)
├── .env.example
├── .gitignore
└── README.md
```

Both applications share one RDS MySQL instance (`aws_event_platform`) but use separate tables and completely separate code paths.

---

## 2. Folder Structure

```
aws-event-platform/
├── event-portal/
│   ├── frontend/
│   │   ├── index.html       ← Registration form
│   │   ├── register.html    ← Redirects to index.html
│   │   ├── success.html     ← Post-registration confirmation
│   │   ├── styles.css
│   │   ├── script.js        ← Form validation + API call
│   │   └── assets/          ← college-logo.png, event-banner.png
│   └── backend/
│       ├── app.py           ← Flask entry point (port 5001)
│       ├── config.py        ← Environment-based config
│       ├── db.py            ← MySQL helper (parameterized queries)
│       ├── requirements.txt
│       └── routes/
│           ├── __init__.py
│           └── registration.py  ← POST /api/register, GET /api/health
│
├── student-result-portal/
│   ├── frontend/
│   │   ├── index.html       ← Login page
│   │   ├── results.html     ← Results display page
│   │   ├── styles.css
│   │   ├── login.js         ← CAPTCHA + login form
│   │   ├── results.js       ← Fetch + render results
│   │   └── assets/
│   └── backend/
│       ├── app.py           ← Flask entry point (port 5002)
│       ├── config.py
│       ├── db.py
│       ├── requirements.txt
│       └── routes/
│           ├── __init__.py
│           ├── auth.py      ← POST /api/login, GET /api/health
│           └── results.py   ← GET /api/results/<reg_no>
│
├── database/
│   └── commands.sql
├── nginx/
│   └── nginx.conf
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Event Registration Portal

### Purpose
Students register for college technical events (Hackathon, Workshop, Paper Presentation, Project Presentation).

### Registration Fields
| Field | Type | Validation |
|-------|------|-----------|
| Student Name | text | Required, 3–100 chars, whitespace trimmed |
| Email ID | email | Required, valid format, max 150 chars |
| Phone Number | tel | Required, exactly 10 digits, Indian mobile (starts 6–9) |
| Department | dropdown | Required, one of 8 options |
| College | text | Required, max 200 chars |
| Event | dropdown | Required: Hackathon / Workshop / Paper Presentation / Project Presentation |
| Year | dropdown | Required: 1st–4th Year |

### API Endpoints

**POST `/api/register`**
```json
Request:
{
  "student_name": "Demo Student",
  "email": "demo@example.com",
  "phone": "9876543210",
  "department": "B.E. Electronics and Communication Engineering",
  "college": "Demo Engineering College",
  "event": "Workshop",
  "year": "3rd Year"
}

Success (201):
{
  "success": true,
  "message": "Registration successful",
  "registration_id": "EVT20260001"
}

Duplicate (409):
{
  "success": false,
  "message": "You have already registered for this event."
}
```

**GET `/api/health`**
```json
{ "status": "healthy", "service": "event-registration-api" }
```

### Duplicate Prevention
Duplicate registrations are blocked on `(email, event)` — enforced at both the database level (UNIQUE constraint) and in the application layer.

---

## 4. Student Result Portal

### Purpose
Students log in using their registration number and date of birth, then view their examination results.

### Login Fields
| Field | Notes |
|-------|-------|
| Registration Number | e.g. `23ECE001` |
| Date of Birth | YYYY-MM-DD format |
| CAPTCHA | 5-character alphanumeric, client-side refresh |

### API Endpoints

**POST `/api/login`**
```json
Request:
{ "registration_number": "23ECE001", "date_of_birth": "2005-01-15" }

Success (200):
{
  "success": true,
  "student": {
    "registration_number": "23ECE001",
    "name": "Arjun Ramaswamy",
    "branch": "B.E. Electronics and Communication Engineering",
    "semester": 5
  }
}
```

**GET `/api/results/<registration_number>`**
```json
{
  "success": true,
  "student": { "registration_number": "23ECE001", "name": "...", "branch": "..." },
  "exam": { "title": "Autonomous End Semester Examination Results", "session": "April / May 2026" },
  "results": [
    { "semester": 5, "subject_code": "25EC501", "grade": "A", "result": "P" },
    ...
  ]
}
```

**GET `/api/health`**
```json
{ "status": "healthy", "service": "student-result-api" }
```

### Demo Credentials
| Registration Number | Date of Birth |
|---------------------|--------------|
| 23ECE001 | 2005-01-15 |
| 23CSE001 | 2004-08-22 |
| 23IT001  | 2005-03-10 |
| 23EEE001 | 2004-11-05 |
| 23MECH001| 2005-06-18 |
| 23AIDS001| 2004-09-30 |

---

## 5. Database

Single RDS MySQL instance: **`aws_event_platform`**

### Tables

```sql
-- Event Registration Portal
event_registrations (
  id, registration_id, student_name, email, phone,
  department, college, event, year, created_at
)

-- Student Result Portal
students (
  id, registration_number, name, date_of_birth,
  branch, semester, email, created_at
)

student_results (
  id, registration_number, semester, subject_code, grade, result
)
```

### Initialise
```bash
mysql -h <RDS_ENDPOINT> -u <USER> -p < database/commands.sql
```

---

## 6. Local Development

### Prerequisites
- Python 3.11+
- MySQL 8.x (local) or RDS endpoint
- A static file server (Python `http.server`, `live-server`, etc.)

### Setup

**1. Clone and configure environment**
```bash
cp .env.example .env
# Edit .env with your local MySQL credentials
```

**2. Initialise database**
```bash
mysql -u root -p < database/commands.sql
```

**3. Event Portal backend (terminal 1)**
```bash
cd event-portal/backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
python app.py
# Listening on http://localhost:5001
```

**4. Student Result Portal backend (terminal 2)**
```bash
cd student-result-portal/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
# Listening on http://localhost:5002
```

**5. Event Portal frontend (terminal 3)**
```bash
cd event-portal/frontend
python -m http.server 8081
# Open http://localhost:8081
```

**6. Student Result Portal frontend (terminal 4)**
```bash
cd student-result-portal/frontend
python -m http.server 8082
# Open http://localhost:8082
```

---

## 7. AWS Architecture

```
INTERNET
    │
    ▼
 Route 53  (events.example.com / results.example.com)
    │
    ▼
Internet-facing ALB  (Frontend ALB)
    │
    ├─────────────────────┐
    ▼                     ▼
Web EC2 #1           Web EC2 #2
  AZ-1a                AZ-1b
  Nginx                Nginx
  /var/www/event-portal
  /var/www/student-result-portal
    │                     │
    └──────────┬──────────┘
               ▼
        Internal ALB  (Backend ALB)
               │
    ┌──────────┴──────────┐
    ▼                     ▼
App EC2 #1           App EC2 #2
  AZ-1a                AZ-1b
  Flask :5001          Flask :5001   ← Event Portal
  Flask :5002          Flask :5002   ← Student Result Portal
               │
               ▼
          RDS MySQL
       Multi-AZ  (Primary + Standby)
       Database: aws_event_platform
```

---

## 8. VPC & Subnets

### Recommended CIDR
```
VPC: 10.0.0.0/16

Public Subnets  (Web + ALB):
  AZ-1a:  10.0.1.0/24
  AZ-1b:  10.0.2.0/24

Private Subnets (App EC2):
  AZ-1a:  10.0.11.0/24
  AZ-1b:  10.0.12.0/24

Database Subnets (RDS):
  AZ-1a:  10.0.21.0/24
  AZ-1b:  10.0.22.0/24
```

### Internet / NAT Gateway
- Internet Gateway → attached to VPC
- NAT Gateway → in a public subnet (for App EC2 outbound internet for pip installs / updates)
- App EC2 and RDS are in private subnets — no direct internet access

---

## 9. Security Groups

| Security Group | Inbound Rule | Source |
|----------------|-------------|--------|
| **Frontend-ALB-SG** | 80 (HTTP) | 0.0.0.0/0 |
| | 443 (HTTPS) | 0.0.0.0/0 |
| **WebServer-SG** | 80 (HTTP) | Frontend-ALB-SG |
| | 22 (SSH) | Bastion/VPN IP only |
| **Backend-ALB-SG** | 5001 | WebServer-SG |
| | 5002 | WebServer-SG |
| **AppServer-SG** | 5001 | Backend-ALB-SG |
| | 5002 | Backend-ALB-SG |
| | 22 (SSH) | Bastion/VPN IP only |
| **Database-SG** | 3306 (MySQL) | AppServer-SG |

> **Never expose** ports 3306, 5001, or 5002 to `0.0.0.0/0`.

---

## 10. EC2 Instances

### Web Tier (Public Subnets)
- AMI: Amazon Linux 2023
- Type: t3.small (min) or t3.medium
- Role: Nginx serving static files + reverse proxy to Internal ALB
- Deploy to: `/var/www/event-portal/` and `/var/www/student-result-portal/`

### App Tier (Private Subnets)
- AMI: Amazon Linux 2023
- Type: t3.small (min) or t3.medium
- Role: Gunicorn running both Flask applications
- Processes:
  - `gunicorn -w 4 -b 0.0.0.0:5001 app:create_app()`  (Event Portal)
  - `gunicorn -w 4 -b 0.0.0.0:5002 app:create_app()`  (Student Result Portal)

### Deploy App Tier
```bash
# On App EC2
cd /opt/event-portal/backend
source venv/bin/activate
gunicorn --workers 4 --bind 0.0.0.0:5001 --timeout 60 "app:create_app()"

cd /opt/student-result-portal/backend
source venv/bin/activate
gunicorn --workers 4 --bind 0.0.0.0:5002 --timeout 60 "app:create_app()"
```

Use `systemd` service files for auto-start.

---

## 11. Application Load Balancers

### Internet-Facing ALB (Frontend ALB)

Listener: **HTTP :80** → Redirect to HTTPS  
Listener: **HTTPS :443**

**Host-Based Routing Rules:**
| Condition | Target Group |
|-----------|-------------|
| Host: `events.example.com` | Web-TG (Web EC2 :80) |
| Host: `results.example.com` | Web-TG (Web EC2 :80) |

**Path-Based Routing (alternative):**
| Condition | Target Group |
|-----------|-------------|
| Path: `/event/*` | Web-TG |
| Path: `/results/*` | Web-TG |

Health check: `GET /health` → 200 OK

---

### Internal ALB (Backend ALB)

No public exposure. Accessible only from WebServer-SG.

**Listener: :5001** → Event-API-TG (App EC2 :5001)  
Health check: `GET /api/health` → 200

**Listener: :5002** → Result-API-TG (App EC2 :5002)  
Health check: `GET /api/health` → 200

---

## 12. RDS MySQL

- Engine: MySQL 8.0
- Instance: db.t3.medium
- Multi-AZ: Enabled (automatic failover)
- Storage: 20 GB gp3, auto-scaling enabled
- Database name: `aws_event_platform`
- Subnet Group: `database-subnets` (AZ-1a + AZ-1b private)
- Security Group: `Database-SG` (inbound from AppServer-SG only)
- Backup retention: 7 days
- Deletion protection: Enabled for production

```
Logical structure:
aws_event_platform
├── event_registrations  ← Event Portal only
├── students             ← Student Result Portal only
└── student_results      ← Student Result Portal only
```

---

## 13. Amazon S3

Bucket: `aws-event-platform-assets`

```
assets/
├── event-portal/
│   ├── college-logo.png
│   ├── event-banner.png
│   └── icons/
└── student-result-portal/
    ├── college-logo.png
    └── icons/
```

- Block all public access: **ON**
- Use pre-signed URLs or CloudFront for secure asset delivery
- EC2 instances access S3 via IAM role (not access keys)
- RDS stores data; S3 stores only static files

---

## 14. Route 53

| Record | Type | Value |
|--------|------|-------|
| `events.example.com` | A (Alias) | Internet-facing ALB DNS |
| `results.example.com` | A (Alias) | Internet-facing ALB DNS |
| `example.com` | A (Alias) | Internet-facing ALB DNS |

If a domain is not available, use the ALB DNS name directly and switch to path-based routing.

---

## 15. ACM (SSL/TLS)

Request a certificate in **ACM (us-east-1 for CloudFront or ap-south-1 for ALB)**:

- `events.example.com`
- `results.example.com`
- `*.example.com` (wildcard covers both)

Validate via DNS validation (add CNAME records in Route 53).

Attach the ACM certificate to the HTTPS listener on the Internet-facing ALB.

---

## 16. Auto Scaling

### Web Tier Auto Scaling Group
- Min: 2 | Desired: 2 | Max: 4
- Subnets: Public AZ-1a + AZ-1b
- Health check: ELB health check (uses ALB `/health` endpoint)
- Scaling policy: Target tracking – 60% CPU

### App Tier Auto Scaling Group
- Min: 2 | Desired: 2 | Max: 4
- Subnets: Private AZ-1a + AZ-1b
- Health check: ELB health check (uses Internal ALB `/api/health`)
- Scaling policy: Target tracking – 60% CPU

**Stateless design:**
- No session data stored on EC2 (sessionStorage is client-side only)
- All persistent data in RDS
- All static assets in S3

---

## 17. Routing Modes

### Host-Based Routing (recommended when domain available)

```
events.example.com  →  Event Portal
results.example.com →  Student Result Portal
```

Configure in: ALB → Listener Rules → Host header condition  
Nginx: use the host-based server blocks in `nginx/nginx.conf`

### Path-Based Routing (when no domain)

```
example.com/event/*   →  Event Portal
example.com/results/* →  Student Result Portal
```

Configure in: ALB → Listener Rules → Path pattern condition  
Nginx: already configured as the default in `nginx/nginx.conf`

---

## 18. Deployment Guide

### Step 1 – Infrastructure
1. Create VPC with public/private/database subnets
2. Create Internet Gateway + NAT Gateway
3. Create 5 Security Groups per spec
4. Create RDS subnet group, then RDS MySQL Multi-AZ instance
5. Create S3 bucket

### Step 2 – Database
```bash
mysql -h <RDS_ENDPOINT> -u <ADMIN_USER> -p < database/commands.sql
```

### Step 3 – Launch Templates

**Web EC2 User Data:**
```bash
#!/bin/bash
yum update -y
yum install nginx -y
# Copy frontend files
aws s3 cp s3://aws-event-platform-assets/event-portal/ /var/www/event-portal/ --recursive
aws s3 cp s3://aws-event-platform-assets/student-result-portal/ /var/www/student-result-portal/ --recursive
# Copy nginx config
aws s3 cp s3://aws-event-platform-assets/nginx/nginx.conf /etc/nginx/nginx.conf
systemctl enable nginx
systemctl start nginx
```

**App EC2 User Data:**
```bash
#!/bin/bash
yum update -y
yum install python3.11 python3.11-pip -y
# Event Portal
cd /opt/event-portal/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Student Result Portal
cd /opt/student-result-portal/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Start both apps via systemd (see systemd service file examples)
```

### Step 4 – Load Balancers
1. Create Internal ALB in private subnets
   - Target Group for port 5001 (Event Portal)
   - Target Group for port 5002 (Student Result Portal)
2. Create Internet-Facing ALB in public subnets
   - Configure host-based or path-based routing rules
   - Attach ACM certificate to HTTPS listener

### Step 5 – Auto Scaling Groups
1. Create Web ASG (public subnets, attach to Internet ALB)
2. Create App ASG (private subnets, attach to Internal ALB)

---

## 19. Testing

### Test 1 – Event Registration

```bash
# Health check
curl http://localhost:5001/api/health
# Expected: {"status": "healthy", "service": "event-registration-api"}

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
# Expected: {"success": true, "registration_id": "EVT2026XXXX"}

# Test duplicate
# Run same request again
# Expected: {"success": false, "message": "You have already registered for this event."}
```

### Test 2 – Student Results

```bash
# Health check
curl http://localhost:5002/api/health
# Expected: {"status": "healthy", "service": "student-result-api"}

# Login
curl -X POST http://localhost:5002/api/login \
  -H "Content-Type: application/json" \
  -d '{"registration_number": "23ECE001", "date_of_birth": "2005-01-15"}'
# Expected: {"success": true, "student": {...}}

# Get results
curl http://localhost:5002/api/results/23ECE001
# Expected: {"success": true, "results": [...]}
```

### Test 3 – Both apps running simultaneously

Run tests 1 and 2 in parallel — port 5001 and 5002 are independent.

### Test 4 – Frontend

| Test | URL | Expected |
|------|-----|----------|
| Event Portal | http://localhost:8081 | Registration form |
| Submit form | Fill all fields + click Register | Redirects to success.html |
| Result Portal | http://localhost:8082 | Login page with CAPTCHA |
| Login | 23ECE001 / 2005-01-15 | Redirects to results.html |
| Results | results.html | Table with 6 subjects, all PASS |

---

## 20. Troubleshooting

### Database connection refused
- Check `.env` values: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Verify MySQL is running: `sudo systemctl status mysqld`
- On RDS: confirm Security Group allows port 3306 from AppServer-SG

### CORS error in browser
- Confirm `EVENT_CORS_ORIGINS` includes the frontend origin (e.g. `http://localhost:8081`)
- Check that Flask-CORS is installed: `pip list | grep Flask-Cors`

### Registration ID not showing on success page
- Check browser console for JS errors
- Confirm `sessionStorage.setItem("registrationSuccess", ...)` is being set in `script.js`
- Check that API returns `registration_id` in the response

### Results page redirects to login
- `sessionStorage` is cleared on tab close — open the login and results in the same tab
- Confirm login API returned `success: true` and data was stored in `sessionStorage`

### 502 Bad Gateway (Nginx → Flask)
- Confirm Flask is running on the correct port
- Check App EC2 Security Group allows inbound 5001/5002 from Backend-ALB-SG
- Review Nginx error log: `sudo tail -f /var/log/nginx/error.log`

### ALB health check failing
- Verify `/api/health` returns HTTP 200
- Check target group health check path: `/api/health`
- Review App EC2 system logs via EC2 console → Actions → Monitor and troubleshoot

### RDS Multi-AZ failover
- After a failover, RDS DNS endpoint remains the same — the app reconnects automatically
- No code changes needed; mysql-connector-python reconnects on next request
