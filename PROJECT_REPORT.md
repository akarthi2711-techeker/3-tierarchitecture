# Project Report
# AWS Three-Tier Architecture — Technical Event Registration Portal

---

| Field | Details |
|-------|---------|
| Project Title | AWS Event Platform — Technical Event Registration Portal |
| Developer | Karthikeyan M A |
| AWS Account ID | YOUR_AWS_ACCOUNT_ID |
| Region | Asia Pacific — Mumbai (ap-south-1) |
| Architecture | Three-Tier (Presentation / Application / Data) |
| Deployment Date | August 19, 2026 |
| Status | Successfully Deployed and Operational |

---

## 1. Project Summary

This project demonstrates a production-style, three-tier web application deployed entirely on Amazon Web Services. The application is a **Technical Event Registration Portal** that allows college students to register for events such as Hackathons, Workshops, Paper Presentations, and Project Presentations.

The system was built from scratch — from writing application code to configuring VPC, subnets, security groups, EC2 instances, RDS MySQL, and Application Load Balancers — demonstrating a complete end-to-end AWS deployment workflow.

---

## 2. Architecture Overview

```
╔═══════════════════════════════════════════════════════════════════╗
║              AWS CLOUD — ap-south-1 (Mumbai)                      ║
║                                                                   ║
║  ┌─────────────────────────────────────────────────────────────┐  ║
║  │  VPC: aws-event-platform-vpc  (10.0.0.0/16)                 │  ║
║  │                                                             │  ║
║  │  ┌──────────────────────────────────────────────────────┐   │  ║
║  │  │         Availability Zone: ap-south-1a               │   │  ║
║  │  │                                                      │   │  ║
║  │  │  ┌────────────────────────────────────────────────┐  │   │  ║
║  │  │  │   PUBLIC SUBNET  10.0.1.0/24                   │  │   │  ║
║  │  │  │                                                │  │   │  ║
║  │  │  │  [Web-Server-AZ1]         [NAT Gateway]        │  │   │  ║
║  │  │  │   t3.micro                Elastic IP           │  │   │  ║
║  │  │  │   Nginx + Frontend        13.232.97.157        │  │   │  ║
║  │  │  │   10.0.1.226                                   │  │   │  ║
║  │  │  └────────────────────────────────────────────────┘  │   │  ║
║  │  │              │                                        │   │  ║
║  │  │              │ proxy_pass /event/api/                 │   │  ║
║  │  │              ▼                                        │   │  ║
║  │  │  ┌────────────────────────────────────────────────┐  │   │  ║
║  │  │  │   PRIVATE SUBNET  10.0.3.0/24  (App Tier)      │  │   │  ║
║  │  │  │                                                │  │   │  ║
║  │  │  │  [App-Server-AZ1]                              │  │   │  ║
║  │  │  │   t3.micro                                     │  │   │  ║
║  │  │  │   Flask API :5001                              │  │   │  ║
║  │  │  │   10.0.3.248                                   │  │   │  ║
║  │  │  └────────────────────────────────────────────────┘  │   │  ║
║  │  │              │                                        │   │  ║
║  │  │              │ MySQL :3306                            │   │  ║
║  │  │              ▼                                        │   │  ║
║  │  │  ┌────────────────────────────────────────────────┐  │   │  ║
║  │  │  │   PRIVATE SUBNET  10.0.5.0/24  (DB Tier)       │  │   │  ║
║  │  │  │                                                │  │   │  ║
║  │  │  │  [RDS MySQL 8.0]                               │  │   │  ║
║  │  │  │   db.t3.micro                                  │  │   │  ║
║  │  │  │   aws_event_platform                           │  │   │  ║
║  │  │  └────────────────────────────────────────────────┘  │   │  ║
║  │  └──────────────────────────────────────────────────────┘   │  ║
║  │                                                             │  ║
║  │  [Internet-ALB]          [Internal-ALB]                     │  ║
║  │   Public, HTTP:80         Internal, HTTP:80                 │  ║
║  │   Routes to Web-TG        Routes /api/* to Event-API-TG     │  ║
║  └─────────────────────────────────────────────────────────────┘  ║
║                                                                   ║
║  [Internet Gateway]  ←→  Internet  ←→  End Users                  ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 3. Three-Tier Architecture Explained

### Tier 1 — Presentation Layer (Web Tier)

The presentation layer is handled by **Nginx** running on a public EC2 instance.

**Responsibilities:**
- Serve static files (HTML, CSS, JavaScript) to the browser
- Reverse proxy API requests to the Internal ALB
- Handle URL routing (`/event/` for frontend, `/event/api/` for backend)
- Return health check responses for the Internet ALB

**Technology:** Nginx 1.30.4 on Amazon Linux 2023

**Location:** Public Subnet `10.0.1.0/24` — directly reachable from the internet via ALB

**Nginx Routing Logic:**
```
/health         → returns 200 OK (ALB health check)
/event/api/*    → proxy_pass to Internal ALB → Flask
/event/         → alias /var/www/event-portal/ (static files)
/               → redirect to /event/
```

---

### Tier 2 — Application Layer (App Tier)

The application layer runs the **Flask Python API** on a private EC2 instance.

**Responsibilities:**
- Receive API requests from Nginx via Internal ALB
- Validate all input data (backend validation)
- Check for duplicate registrations
- Generate sequential Registration IDs
- Write registration data to RDS MySQL
- Return JSON responses

**Technology:** Python 3.x + Flask 3.0.3

**Location:** Private Subnet `10.0.3.0/24` — not accessible from the internet

**API Endpoints:**
```
GET  /api/health    → health check for ALB
POST /api/register  → register a student
```

**Key Logic — Registration ID Generation:**
```python
def _generate_registration_id():
    year = datetime.datetime.utcnow().year
    prefix = f"EVT{year}"
    # Query last ID for this year
    # Increment sequence
    # Return EVT20260001, EVT20260002, etc.
```

**Key Logic — Duplicate Prevention:**
```python
# Check before inserting
existing = execute_query(
    "SELECT id FROM event_registrations 
     WHERE email = %s AND event = %s LIMIT 1",
    (email, event), fetch=True
)
if existing:
    return {"success": False, "message": "Already registered"}
```

---

### Tier 3 — Data Layer (Database Tier)

The data layer is **Amazon RDS MySQL** running in a private subnet.

**Responsibilities:**
- Store all event registration records
- Enforce data integrity (UNIQUE constraints, NOT NULL)
- Provide fast indexed lookups by email and event

**Technology:** MySQL 8.0 on Amazon RDS (db.t3.micro)

**Location:** Private Subnet `10.0.5.0/24` — accessible only from App EC2

**Table Design:**
```sql
event_registrations:
  id               INT  AUTO_INCREMENT PK
  registration_id  VARCHAR(30) UNIQUE     → EVT20260001
  student_name     VARCHAR(100)
  email            VARCHAR(150)
  phone            VARCHAR(15)
  department       VARCHAR(150)
  college          VARCHAR(200)
  event            VARCHAR(100)
  year             VARCHAR(20)
  created_at       TIMESTAMP DEFAULT NOW()
  
  UNIQUE (email, event)  → prevents duplicate registrations
```

---

## 4. Network Architecture Detail

### VPC Design

```
VPC: 10.0.0.0/16  (65,536 IPs)

Subnet breakdown:
  10.0.1.0/24  → Public Web    (256 IPs)  ap-south-1a
  10.0.3.0/24  → Private App   (256 IPs)  ap-south-1a
  10.0.5.0/24  → Private DB    (256 IPs)  ap-south-1a
```

### Traffic Flow — Complete Request Journey

```
Step 1:  User opens browser
         http://internet-alb-1137595128.ap-south-1.elb.amazonaws.com/event/

Step 2:  DNS resolves ALB hostname to AWS-managed IP
         Request hits Internet-facing ALB on port 80

Step 3:  Internet ALB checks routing rules
         Path /event/* → forward to Web-TG (port 80)

Step 4:  Web-TG routes to healthy Web-Server-AZ1
         Web EC2 receives HTTP request

Step 5:  Nginx serves /event/ from /var/www/event-portal/
         Browser receives index.html, styles.css, script.js

Step 6:  User fills form, clicks REGISTER
         JavaScript sends POST to /event/api/register

Step 7:  Nginx receives POST /event/api/register
         location ^~ /event/api/ matched
         proxy_pass to Internal ALB /api/register

Step 8:  Internal ALB routes /api/* to Event-API-TG (port 5001)

Step 9:  App-Server-AZ1 Flask receives POST /api/register
         Validates input
         Checks for duplicate in RDS
         Generates EVT20260XXX
         Inserts into RDS

Step 10: RDS MySQL executes INSERT
         Returns success

Step 11: Flask returns JSON: {success: true, registration_id: "EVT20260002"}

Step 12: Response travels back through Internal ALB → Nginx → Internet ALB → Browser

Step 13: JavaScript reads response
         Saves data to sessionStorage
         Redirects to success.html

Step 14: success.html loads, reads sessionStorage
         Displays Registration ID prominently
         Shows all student details
```

---

## 5. Security Architecture

### Defense in Depth

The project implements multiple security layers so that compromising one layer does not expose others.

```
Internet
    │
    ▼ Port 80/443 only
[Frontend-ALB-SG]
    │
    ▼ Port 80 from Frontend-ALB-SG only
[WebServer-SG]
    │
    ▼ Port 5001 from WebServer-SG only
[Backend-ALB-SG]
    │
    ▼ Port 5001 from Backend-ALB-SG only
[AppServer-SG]
    │
    ▼ Port 3306 from AppServer-SG only
[Database-SG]
    │
    ▼
RDS MySQL (never exposed to internet)
```

### Security Measures Implemented

| Measure | Where | How |
|---------|-------|-----|
| Input validation | Frontend + Backend | Both layers independently validate all 7 fields |
| SQL injection prevention | db.py | All queries use `%s` parameterized placeholders |
| Credential security | .env file | Loaded via python-dotenv, never hardcoded, in .gitignore |
| Error hiding | registration.py | RuntimeError logged server-side, generic message to client |
| Duplicate prevention | DB + App layer | UNIQUE constraint + pre-insert check |
| CORS protection | app.py | Flask-CORS restricts to specific ALB origin |
| Network isolation | VPC subnets | App and DB in private subnets, no internet route |
| Security Group references | All SGs | Source is SG ID, not IP range |

---

## 6. Application Code Architecture

### Backend (Flask)

```
app.py
  └── create_app()
        ├── Config.from_object(Config)
        ├── CORS(origins=Config.CORS_ORIGINS)
        ├── register_blueprint(registration_bp)
        └── route("/") → ping

config.py
  └── class Config
        ├── SECRET_KEY  (from ENV)
        ├── DB_HOST     (from ENV)
        ├── DB_PORT     (from ENV)
        ├── DB_USER     (from ENV)
        ├── DB_PASSWORD (from ENV)
        ├── DB_NAME     (from ENV)
        ├── CORS_ORIGINS (from ENV)
        └── PORT        (from ENV)

db.py
  ├── get_connection()    → mysql.connector.connect()
  └── execute_query()     → parameterized query execution
        ├── fetch=True  → returns list[dict]
        └── fetch=False → returns lastrowid

routes/registration.py
  ├── GET  /api/health   → {"status": "healthy"}
  └── POST /api/register
        ├── validate JSON
        ├── sanitise inputs
        ├── _validate_payload() → list of errors
        ├── duplicate check
        ├── _generate_registration_id()
        └── INSERT into DB
```

### Frontend (Vanilla JavaScript)

```
script.js
  ├── API_BASE detection (localhost vs deployed)
  ├── Phone input filter (digits only)
  ├── Inline blur validation per field
  ├── validateForm(data) → true/false
  │     ├── name: min 3, max 100
  │     ├── email: regex + max 150
  │     ├── phone: /^[6-9][0-9]{9}$/
  │     ├── department: required
  │     ├── college: required + max 200
  │     ├── event: required
  │     └── year: required
  ├── collectFormData() → object
  ├── setLoading(bool) → button state
  └── form.submit handler
        ├── validateForm()
        ├── fetch POST /event/api/register
        ├── on success → sessionStorage.setItem() → redirect success.html
        └── on error   → showAlert()

success.html
  └── inline script
        ├── JSON.parse(sessionStorage.getItem("registrationSuccess"))
        ├── fills all display fields
        └── sessionStorage.removeItem() (prevents stale data on refresh)
```

---

## 7. Deployment Process (Step by Step)

### Phase 1 — Network Setup
1. Created VPC `aws-event-platform-vpc` (10.0.0.0/16)
2. Created 3 subnets in ap-south-1a (public web, private app, private DB)
3. Created Internet Gateway, attached to VPC
4. Created NAT Gateway in public subnet with Elastic IP
5. Created route tables: Public-RT (→ IGW), Private-App-RT (→ NAT), Private-DB-RT (local only)
6. Created 5 Security Groups with chained inbound rules

### Phase 2 — Database Setup
1. Created RDS DB Subnet Group using Private-DB-AZ1
2. Launched RDS MySQL 8.0 (db.t3.micro, single AZ, Dev/Test template)
3. Connected from App EC2 and imported `database/commands.sql`
4. Verified tables and seed data

### Phase 3 — Application Deployment
1. Launched Web-Server-AZ1 (t3.micro, public subnet, WebServer-SG)
2. Launched App-Server-AZ1 (t3.micro, private subnet, AppServer-SG)
3. Installed Nginx on Web EC2, configured event-platform.conf
4. Cloned project from GitHub on both EC2 instances
5. Installed Python dependencies on App EC2
6. Created .env file with RDS credentials on App EC2
7. Started Flask with nohup on port 5001
8. Verified health endpoints on both servers

### Phase 4 — Load Balancer Setup
1. Created Target Groups: Web-TG (port 80), Event-API-TG (port 5001)
2. Created Internal ALB in private subnet with Backend-ALB-SG
3. Added routing rule: `/api/*` → Event-API-TG
4. Created Internet-facing ALB in public subnet with Frontend-ALB-SG
5. Added routing rules: `/event/*` → Web-TG
6. Updated Nginx proxy_pass to point to Internal ALB
7. Updated CORS origins in .env to match ALB DNS

### Phase 5 — Testing and Verification
1. Tested `GET /api/health` on both ALB DNS endpoints
2. Submitted registration form through browser
3. Verified Registration ID displayed on success page
4. Verified data stored in RDS via MySQL query
5. Tested duplicate prevention (same email + event returns 409)

---

## 8. Challenges Faced and Solutions

### Challenge 1 — EC2 Instance Connect Failure
**Problem:** EC2 Instance Connect showed "Error establishing SSH connection"
**Root Cause:** VPC DNS hostnames were not enabled
**Solution:** Enabled DNS hostnames and DNS resolution on VPC settings

### Challenge 2 — App EC2 Wrong Security Group
**Problem:** App-Server-AZ1 had WebServer-SG instead of AppServer-SG
**Symptom:** Event-API-TG showed "Unhealthy — Request timed out"
**Solution:** Changed security group via EC2 → Actions → Security → Change security groups

### Challenge 3 — 504 Gateway Timeout on Registration
**Problem:** Form submission returned 504 from Nginx
**Root Cause:** AppServer-SG was missing inbound rule for port 5001 from WebServer-SG
**Solution:** Added `Custom TCP 5001 from WebServer-SG` to AppServer-SG inbound rules

### Challenge 4 — 404 on API calls
**Problem:** POST /event/api/register returned 404
**Root Cause:** script.js was calling `/api/register` but Nginx expected `/event/api/register`
**Solution:** Updated script.js using `sed` on Web EC2:
```bash
sudo sed -i 's|/api/register|/event/api/register|g' /var/www/event-portal/script.js
```

### Challenge 5 — Internal ALB 404 Response
**Problem:** Internal ALB returned Flask 404 for `/event/api/health`
**Root Cause:** Nginx sent full path `/event/api/health` to ALB, but Flask only knows `/api/health`
**Solution:** Fixed `proxy_pass` to strip the `/event/api/` prefix and send `/api/` to ALB

### Challenge 6 — Flask Crash on Start
**Problem:** Flask process started then immediately terminated (Exit 1)
**Root Cause:** .env file was in wrong directory path (`aws-event-platform/` vs `3-tierarchitecture/`)
**Solution:** Used correct project path `/home/ec2-user/3-tierarchitecture/event-portal/backend`

### Challenge 7 — Session Manager Not Working
**Problem:** Session Manager tab greyed out for private App EC2
**Root Cause:** EC2 instance not registered with Systems Manager
**Solution:** Created IAM role `EC2-SSM-Role` with `AmazonSSMManagedInstanceCore` policy, attached to App EC2, rebooted instance

---

## 9. Key Learnings

### AWS Networking
- VPC DNS hostnames must be enabled for EC2 Instance Connect to work
- Private subnets route outbound internet through NAT Gateway, not Internet Gateway
- Security Groups are stateful — only inbound rules needed for response traffic
- ALB requires minimum 2 AZs in subnet mapping (even if instances are in 1 AZ)

### Load Balancer Behavior
- Internet-facing ALB handles external traffic, Internal ALB handles tier-to-tier traffic
- ALB health checks must hit a specific path that returns 200
- Target Groups define where ALB sends traffic and track instance health
- Path-based routing rules must be specific — `/event/api/*` before `/event/*`

### Nginx as Reverse Proxy
- `location ^~ /path/` has highest priority, prevents other patterns from matching
- `proxy_pass` URL trailing slash matters — `/event/api/` strips prefix, `/api/` replaces it
- Order of `location` blocks matters when patterns overlap

### Flask Deployment
- `host="0.0.0.0"` required to listen on all interfaces (not just localhost)
- `nohup python3 app.py &` required to keep process running after terminal closes
- `.env` file path must match the directory Flask is started from

### Security Best Practices
- Never expose database port (3306) to internet
- App servers should be in private subnets
- Use Security Group references (not IP ranges) for inter-tier rules
- Parameterized queries prevent SQL injection at the code level

---

## 10. AWS Resources Summary

| Service | Resource | Purpose |
|---------|----------|---------|
| VPC | aws-event-platform-vpc | Network isolation |
| Subnet | Public-Web-AZ1 | Web EC2 + NAT |
| Subnet | Private-App-AZ1 | App EC2 Flask |
| Subnet | Private-DB-AZ1 | RDS MySQL |
| Internet Gateway | aws-event-platform-igw | Internet access for public subnet |
| NAT Gateway | NAT-GW | Outbound internet for private App EC2 |
| Security Group | Frontend-ALB-SG | Internet ALB inbound |
| Security Group | WebServer-SG | Web EC2 Nginx |
| Security Group | Backend-ALB-SG | Internal ALB inbound |
| Security Group | AppServer-SG | App EC2 Flask |
| Security Group | Database-SG | RDS MySQL |
| EC2 | Web-Server-AZ1 | Nginx + static files |
| EC2 | App-Server-AZ1 | Flask API |
| RDS | aws-event-db | MySQL database |
| ALB | Internet-ALB | Public entry point |
| ALB | Internal-ALB | App tier routing |
| Target Group | Web-TG | Web EC2 targets |
| Target Group | Event-API-TG | App EC2 targets |
| Elastic IP | NAT EIP | NAT Gateway fixed IP |
| IAM Role | EC2-SSM-Role | Session Manager access |

---

## 11. Live URLs

| URL | Purpose |
|-----|---------|
| `http://internet-alb-1137595128.ap-south-1.elb.amazonaws.com/event/` | Event Registration Portal |
| `http://internet-alb-1137595128.ap-south-1.elb.amazonaws.com/event/api/health` | API Health Check |

---

## 12. Future Improvements

| Improvement | Benefit |
|-------------|---------|
| Add HTTPS with ACM certificate | Secure data in transit |
| Add Route 53 domain | Professional URL (events.college.edu) |
| Enable Multi-AZ for RDS | Database high availability |
| Add second AZ for EC2 + ASG | True high availability |
| Move to Gunicorn | Production WSGI server |
| Add CloudWatch alarms | Monitor CPU, error rates |
| Add S3 for static assets | CDN-backed image delivery |
| Add certificate generation | Event participation certificates |
| Implement JWT authentication | Admin panel for viewing registrations |

---

## 13. Technology Stack Summary

```
Frontend:
  HTML5         → Semantic markup, accessible forms
  CSS3          → Responsive grid, CSS variables, animations
  JavaScript    → Fetch API, form validation, sessionStorage

Backend:
  Python 3.x    → Application language
  Flask 3.0.3   → Web framework with blueprints
  Flask-CORS    → Cross-origin resource sharing
  mysql-connector-python → RDS MySQL driver
  python-dotenv → Environment variable management
  Gunicorn      → Production WSGI server (ready to use)

Infrastructure:
  Amazon EC2    → Virtual servers (t3.micro)
  Amazon RDS    → Managed MySQL 8.0
  Amazon VPC    → Network isolation
  Amazon ALB    → Application Load Balancers (2)
  Amazon NAT    → Outbound internet for private EC2
  Amazon IGW    → Internet gateway
  Amazon IAM    → EC2 roles and permissions
  Nginx         → Web server and reverse proxy
  Amazon Linux 2023 → EC2 operating system
```

---

*Report generated: August 19, 2026*
*Project: AWS 3-Tier Architecture — Technical Event Registration Portal*
*Developer: Karthikeyan M A*
