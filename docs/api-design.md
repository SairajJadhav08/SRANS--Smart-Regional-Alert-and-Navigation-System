# SRANS API Design Specification

This document details the REST API specification for the Smart Regional Alert & Navigation System (SRANS). It lists endpoint definitions, request formats, responses, error states, and role requirements.

---

## 🤖 1. AI API Endpoints (Groq Llama 3.3 Engine)

The following endpoints power the SRANS AI capabilities. They are listed at the beginning as prioritized.

### AI Endpoints Executive Summary

*   **`POST /api/ai/routine-planner`**
    *   **Purpose**: Suggests safe travel departures by matching route coordinates against nearby alerts.
    *   **Input**: JSON payload containing `route_id` (integer) and optional `arrival_time` (string).
    *   **Output**: JSON containing a text `recommendation` under 150 words.
    *   **LLM/AI Used**: Groq `llama-3.3-70b-versatile` (Llama-3 Serverless).
    *   **Business Value**: Increases driver safety and reduces commute time through proactive warning advisories.
*   **`POST /api/ai/chat`**
    *   **Purpose**: Answers general commuter questions on regional travel hazards using live database alerts.
    *   **Input**: JSON payload containing user query `message` (string).
    *   **Output**: JSON response containing the chatbot's structured text `reply` (under 200 words).
    *   **LLM/AI Used**: Groq `llama-3.3-70b-versatile`.
    *   **Business Value**: Provides a low-friction conversational portal for accessing complex safety and weather advisories.
*   **`POST /api/ai/detect-alerts`**
    *   **Purpose**: Autogenerates alerts near a user's location based on local coordinates, time, and seasonal trends.
    *   **Input**: JSON payload containing `lat` (latitude float) and `lng` (longitude float).
    *   **Output**: JSON detailing the count of `created` alerts and a list of new hazard records.
    *   **LLM/AI Used**: Groq `llama-3.3-70b-versatile` (with system-enforced JSON schema parsing).
    *   **Business Value**: Pre-seeds regional hazard maps with high probability risks, lowering bootstrap data requirements.
*   **`POST /api/ai/navigation-chat`**
    *   **Purpose**: Acts as an in-route co-pilot by digesting driving metrics (steps, coordinates, distance) and answering questions.
    *   **Input**: JSON containing `message`, route bounding coordinates, `current_step` text, `total_distance`, and `total_time`.
    *   **Output**: JSON containing co-pilot advice `reply` (under 150 words).
    *   **LLM/AI Used**: Groq `llama-3.3-70b-versatile`.
    *   **Business Value**: Maximizes app session duration and creates a highly interactive, sticky navigator experience.
*   **`POST /api/ai/daily-briefing`**
    *   **Purpose**: Produces a structured morning travel report for a specific city or geographical bounds.
    *   **Input**: JSON containing optional `city` name (string) or user coordinate pair `lat`/`lng`.
    *   **Output**: JSON containing a structured `briefing` bullet list and an `alertCount` tally.
    *   **LLM/AI Used**: Groq `llama-3.3-70b-versatile`.
    *   **Business Value**: Drives daily recurring traffic to the application by sending actionable, simple briefings.

---

### AI Endpoints Reference Specification

#### POST /api/ai/routine-planner
*   **Authentication**: Required (JWT Bearer Token)
*   **Role Clearance**: Citizen or Government User
*   **Headers**: `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "route_id": 4,
      "arrival_time": "09:30 AM"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "recommendation": "Your route 'Daily Office Commute' has 1 active Construction alert at (18.52, 73.85). We suggest departing by 08:50 AM instead of 09:00 AM. Avoid SB Road due to roadworks; take Senapati Bapat Marg as an alternative."
    }
    ```
*   **Error Codes**:
    *   `400 Bad Request`: Missing `route_id` or non-numerical value.
    *   `404 Not Found`: Route not found or doesn't belong to current user.
    *   `500 Internal Server Error`: Groq API timeout or database failure.

#### POST /api/ai/chat
*   **Authentication**: Required (JWT Bearer Token)
*   **Headers**: `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "message": "Is it safe to drive near Shivajinagar right now?"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "reply": "Currently, there is a Weather alert for waterlogging near Shivajinagar Metro Station. It is advised to avoid low-lying roads. High-clearance vehicles are passing slowly, but hatchbacks should divert via JM Road."
    }
    ```
*   **Error Codes**:
    *   `400 Bad Request`: Empty message parameter.
    *   `500 Internal Server Error`: LLM response parser failed.

#### POST /api/ai/detect-alerts
*   **Authentication**: Required (JWT Bearer Token)
*   **Headers**: `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "lat": 18.5204,
      "lng": 73.8567
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "created": 1,
      "alerts": [
        {
          "id": 14,
          "title": "Possible Rush-Hour Bottleneck",
          "description": "Typical heavy congestion expected near Pune University Circle during evening hours.",
          "alert_type": "Traffic",
          "location_lat": 18.5302,
          "location_lng": 73.8491,
          "created_at": "2026-07-12T08:30:00.000Z"
        }
      ]
    }
    ```
*   **Error Codes**:
    *   `400 Bad Request`: Missing or non-numeric latitude/longitude.
    *   `500 Internal Server Error`: AI system database seeding user missing.

#### POST /api/ai/navigation-chat
*   **Authentication**: Required (JWT Bearer Token)
*   **Headers**: `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "message": "Should I take this turn?",
      "start_lat": 18.5204,
      "start_lng": 73.8567,
      "end_lat": 18.5501,
      "end_lng": 73.8802,
      "current_step": "Turn right onto Baner Road",
      "total_distance": "5.4 km",
      "total_time": "14 mins"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "reply": "Yes, continue with your turn on Baner Road. The road ahead is clear of active hazards, though there is general construction about 2 km further north which shouldn't impact this segment."
    }
    ```
*   **Error Codes**:
    *   `400 Bad Request`: Missing prompt query.

#### POST /api/ai/daily-briefing
*   **Authentication**: Required (JWT Bearer Token)
*   **Headers**: `Authorization: Bearer <JWT>`
*   **Request Body**:
    ```json
    {
      "city": "Pune",
      "lat": 18.5204,
      "lng": 73.8567
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "briefing": "* **Status**: Minor disruptions in Pune today.\n* **Alerts**: 1 Weather Alert (Waterlogging near Deccan Gymkhana) and 1 Traffic Alert (Heavy construction near Hinjawadi Phase 1).\n* **Avoid**: Avoid low-lying underpasses.\n* **Advice**: Commuters heading towards Hinjawadi should depart 15 minutes early.",
      "alertCount": 2
    }
    ```
*   **Error Codes**:
    *   `400 Bad Request`: Missing both `city` name and coordinates.

---

## 👥 2. Authentication & Admin Endpoints

Manage accounts, retrieve session info, and verify credentials.

#### POST /api/auth/register
*   **Authentication**: None (Public)
*   **Request Body**:
    ```json
    {
      "username": "officer_pune",
      "email": "officer@pune.gov.in",
      "password": "SecurePassword123",
      "user_type": "government",
      "agency_name": "Pune Traffic Police",
      "department": "Infrastructure Control"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "message": "Account created successfully",
      "userId": 5
    }
    ```
*   **Error Codes**:
    *   `400 Bad Request`: Validation checks failed (e.g., password length < 8, username < 4, invalid email format).
    *   `409 Conflict`: Username or Email already in use.

#### POST /api/auth/login
*   **Authentication**: None (Public)
*   **Request Body**:
    ```json
    {
      "username": "officer_pune",
      "password": "SecurePassword123"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 5,
        "username": "officer_pune",
        "email": "officer@pune.gov.in",
        "is_government": true,
        "is_verified": false,
        "is_superuser": false,
        "agency_name": "Pune Traffic Police",
        "department": "Infrastructure Control"
      }
    }
    ```
*   **Error Codes**:
    *   `400 Bad Request`: Missing credentials in request.
    *   `401 Unauthorized`: Invalid credentials.

#### POST /api/auth/logout
*   **Authentication**: Required
*   **Headers**: `Authorization: Bearer <JWT>`
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Logged out successfully"
    }
    ```

#### GET /api/auth/me
*   **Authentication**: Required
*   **Headers**: `Authorization: Bearer <JWT>`
*   **Success Response (200 OK)**:
    ```json
    {
      "id": 5,
      "username": "officer_pune",
      "email": "officer@pune.gov.in",
      "is_government": true,
      "is_verified": false,
      "is_superuser": false,
      "agency_name": "Pune Traffic Police",
      "department": "Infrastructure Control"
    }
    ```
*   **Error Codes**:
    *   `404 Not Found`: Account record has been deleted.

#### GET /api/auth/admin/gov-users
*   **Authentication**: Required
*   **Role Clearance**: Superuser Only
*   **Success Response (200 OK)**:
    ```json
    [
      {
        "id": 5,
        "username": "officer_pune",
        "email": "officer@pune.gov.in",
        "is_government": true,
        "is_verified": false,
        "is_superuser": false,
        "agency_name": "Pune Traffic Police",
        "department": "Infrastructure Control",
        "created_at": "2026-07-12T05:22:10.000Z"
      }
    ]
    ```
*   **Error Codes**:
    *   `403 Forbidden`: User is not a Superuser.

#### POST /api/auth/admin/gov-users/:id/approve
*   **Authentication**: Required
*   **Role Clearance**: Superuser Only
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Government user approved"
    }
    ```

#### POST /api/auth/admin/gov-users/:id/revoke
*   **Authentication**: Required
*   **Role Clearance**: Superuser Only
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Government user revoked"
    }
    ```

---

## 🚨 3. Alerts API Endpoints

Official alert registry endpoints.

#### GET /api/alerts
*   **Authentication**: Optional (Extracts user metadata if present for author filtering)
*   **Query Params**:
    *   `type`: `Traffic` | `Emergency` | `Construction` | `Weather`
    *   `author_only`: `true` (Lists only alerts created by the requesting User ID)
*   **Success Response (200 OK)**:
    ```json
    [
      {
        "id": 2,
        "title": "Severe Waterlogging near FC Road",
        "description": "High water levels on FC Road. Avoid traveling in small vehicles.",
        "alert_type": "Weather",
        "location_lat": 18.5194,
        "location_lng": 73.8412,
        "is_broadcast": false,
        "author_id": 5,
        "created_at": "2026-07-12T07:11:00.000Z",
        "updated_at": "2026-07-12T07:11:00.000Z"
      }
    ]
    ```

#### GET /api/alerts/:id
*   **Authentication**: None (Public)
*   **Success Response (200 OK)**:
    ```json
    {
      "id": 2,
      "title": "Severe Waterlogging near FC Road",
      "description": "High water levels on FC Road. Avoid traveling in small vehicles.",
      "alert_type": "Weather",
      "location_lat": 18.5194,
      "location_lng": 73.8412,
      "is_broadcast": false,
      "author_id": 5,
      "created_at": "2026-07-12T07:11:00.000Z",
      "updated_at": "2026-07-12T07:11:00.000Z"
    }
    ```
*   **Error Codes**:
    *   `404 Not Found`: Incident alert does not exist.

#### POST /api/alerts
*   **Authentication**: Required
*   **Role Clearance**: Government (Verified) or Superuser
*   **Request Body**:
    ```json
    {
      "title": "Metro Construction Divert",
      "description": "Single-lane bottleneck due to metro girder placement.",
      "alert_type": "Construction",
      "location_lat": 18.5312,
      "location_lng": 73.8510
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "id": 15,
      "title": "Metro Construction Divert",
      "description": "Single-lane bottleneck due to metro girder placement.",
      "alert_type": "Construction",
      "location_lat": 18.5312,
      "location_lng": 73.851,
      "is_broadcast": false,
      "author_id": 5,
      "created_at": "2026-07-12T08:50:00.000Z",
      "updated_at": "2026-07-12T08:50:00.000Z"
    }
    ```
*   **Error Codes**:
    *   `403 Forbidden`: User role lacks verified government clearance.

#### PUT /api/alerts/:id
*   **Authentication**: Required
*   **Role Clearance**: Author of the alert OR Superuser
*   **Request Body**: *(Full update validation required)*
    ```json
    {
      "title": "Metro Construction Road Closed",
      "description": "Complete closure. Diversion posted through Senapati Bapat Road.",
      "alert_type": "Construction",
      "location_lat": 18.5312,
      "location_lng": 73.8510
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "id": 15,
      "title": "Metro Construction Road Closed",
      "description": "Complete closure. Diversion posted through Senapati Bapat Road.",
      "alert_type": "Construction",
      "location_lat": 18.5312,
      "location_lng": 73.851,
      "is_broadcast": false,
      "author_id": 5,
      "created_at": "2026-07-12T08:50:00.000Z",
      "updated_at": "2026-07-12T08:53:11.000Z"
    }
    ```

#### DELETE /api/alerts/:id
*   **Authentication**: Required
*   **Role Clearance**: Author of the alert OR Superuser
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Alert deleted successfully"
    }
    ```

#### POST /api/alerts/broadcast
*   **Authentication**: Required
*   **Role Clearance**: Superuser Only
*   **Request Body**:
    ```json
    {
      "title": "Severe Flash Flood Evacuation",
      "description": "All residents near Mutha River basin must evacuate to high ground immediately.",
      "alert_type": "Emergency",
      "location_lat": 18.5204,
      "location_lng": 73.8567
    }
    ```
*   **Success Response (210 Created)**:
    ```json
    {
      "id": 16,
      "title": "🚨 BROADCAST: Severe Flash Flood Evacuation",
      "description": "All residents near Mutha River basin must evacuate to high ground immediately.",
      "alert_type": "Emergency",
      "location_lat": 18.5204,
      "location_lng": 73.8567,
      "is_broadcast": true,
      "author_id": 1,
      "created_at": "2026-07-12T08:55:00.000Z",
      "updated_at": "2026-07-12T08:55:00.000Z"
    }
    ```

#### GET /api/alerts/broadcast/active
*   **Authentication**: None (Public)
*   **Success Response (200 OK)**:
    ```json
    {
      "id": 16,
      "title": "🚨 BROADCAST: Severe Flash Flood Evacuation",
      "description": "All residents near Mutha River basin must evacuate to high ground immediately.",
      "alert_type": "Emergency",
      "location_lat": 18.5204,
      "location_lng": 73.8567,
      "is_broadcast": true,
      "author_id": 1,
      "created_at": "2026-07-12T08:55:00.000Z",
      "updated_at": "2026-07-12T08:55:00.000Z"
    }
    ```

#### POST /api/alerts/bulk-delete
*   **Authentication**: Required
*   **Role Clearance**: Government or Superuser (Gov users can only bulk-delete their own; Superuser can delete any)
*   **Request Body**:
    ```json
    {
      "ids": [14, 15]
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "2 alert(s) deleted"
    }
    ```

---

## 📢 4. Citizen Reports Endpoints (Crowdsourcing)

Allows citizens to submit hazard details, which officers can verify.

#### GET /api/reports
*   **Authentication**: Required
*   **Role Access**: Gov users/Superusers retrieve all reports. Citizen users receive only their own submitted reports.
*   **Success Response (200 OK)**:
    ```json
    [
      {
        "id": 3,
        "title": "Pothole block on flyover",
        "description": "Huge pothole slowing down cars on flyover climb.",
        "report_type": "Traffic",
        "location_lat": 18.5441,
        "location_lng": 73.8762,
        "status": "pending",
        "submitted_by": 2,
        "promoted_to": null,
        "review_note": null,
        "created_at": "2026-07-12T08:00:00.000Z",
        "updated_at": "2026-07-12T08:00:00.000Z",
        "user": {
          "username": "citizen_sam",
          "email": "sam@mail.com"
        }
      }
    ]
    ```

#### POST /api/reports
*   **Authentication**: Required
*   **Request Body**:
    ```json
    {
      "title": "Waterlogging under bridge",
      "description": "Water logging blocking left lane.",
      "report_type": "Weather",
      "location_lat": 18.5244,
      "location_lng": 73.8611
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "id": 4,
      "title": "Waterlogging under bridge",
      "description": "Water logging blocking left lane.",
      "report_type": "Weather",
      "location_lat": 18.5244,
      "location_lng": 73.8611,
      "status": "pending",
      "submitted_by": 2,
      "promoted_to": null,
      "review_note": null,
      "created_at": "2026-07-12T09:01:00.000Z",
      "updated_at": "2026-07-12T09:01:00.000Z"
    }
    ```

#### POST /api/reports/:id/approve
*   **Authentication**: Required
*   **Role Clearance**: Government or Superuser
*   **Request Body**:
    ```json
    {
      "note": "Verified by traffic patrol crew. Promoted to official construction alert."
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "report": {
        "id": 3,
        "title": "Pothole block on flyover",
        "description": "Huge pothole slowing down cars on flyover climb.",
        "report_type": "Traffic",
        "location_lat": 18.5441,
        "location_lng": 73.8762,
        "status": "approved",
        "submitted_by": 2,
        "promoted_to": 18,
        "review_note": "Verified by traffic patrol crew. Promoted to official construction alert.",
        "created_at": "2026-07-12T08:00:00.000Z",
        "updated_at": "2026-07-12T09:05:00.000Z"
      },
      "alert_id": 18
    }
    ```

#### POST /api/reports/:id/reject
*   **Authentication**: Required
*   **Role Clearance**: Government or Superuser
*   **Request Body**:
    ```json
    {
      "note": "Road cleared by sanitization unit. No active bottleneck remaining."
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "id": 3,
      "status": "rejected",
      "review_note": "Road cleared by sanitization unit. No active bottleneck remaining."
    }
    ```

#### DELETE /api/reports/:id
*   **Authentication**: Required
*   **Role Clearance**: Owner of Report OR Government Officer OR Superuser
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Report deleted"
    }
    ```

---

## 🛣️ 5. Saved Routes API Endpoints

Manage traveler bookmarks for daily commutes.

#### GET /api/routes
*   **Authentication**: Required
*   **Success Response (200 OK)**:
    ```json
    [
      {
        "id": 4,
        "name": "Daily Office Commute",
        "start_lat": 18.5204,
        "start_lng": 73.8567,
        "end_lat": 18.5501,
        "end_lng": 73.8802,
        "user_id": 2,
        "created_at": "2026-07-12T05:00:00.000Z"
      }
    ]
    ```

#### POST /api/routes
*   **Authentication**: Required
*   **Request Body**:
    ```json
    {
      "name": "Home to Gym",
      "start_lat": 18.5122,
      "start_lng": 73.8410,
      "end_lat": 18.5190,
      "end_lng": 73.8511
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "id": 5,
      "name": "Home to Gym",
      "start_lat": 18.5122,
      "start_lng": 73.841,
      "end_lat": 18.519,
      "end_lng": 73.8511,
      "user_id": 2,
      "created_at": "2026-07-12T09:10:00.000Z"
    }
    ```

#### DELETE /api/routes/:id
*   **Authentication**: Required
*   **Role Clearance**: Owner of the route
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Route deleted successfully"
    }
    ```

---

## 📊 6. Analytics API Endpoints

Incident and alert statistics for dashboard maps and charts.

#### GET /api/analytics/summary
*   **Authentication**: Required
*   **Role Clearance**: Government or Superuser
*   **Success Response (200 OK)**:
    ```json
    {
      "totalAlerts": 18,
      "totalUsers": 142,
      "totalRoutes": 52,
      "totalReports": 38
    }
    ```

#### GET /api/analytics/by-type
*   **Authentication**: Required
*   **Role Clearance**: Government or Superuser
*   **Success Response (200 OK)**:
    ```json
    [
      { "type": "Traffic", "count": 8 },
      { "type": "Construction", "count": 5 },
      { "type": "Weather", "count": 3 },
      { "type": "Emergency", "count": 2 }
    ]
    ```

#### GET /api/analytics/weekly
*   **Authentication**: Required
*   **Role Clearance**: Government or Superuser
*   **Success Response (200 OK)**:
    ```json
    [
      { "date": "2026-07-06", "count": 1 },
      { "date": "2026-07-07", "count": 3 },
      { "date": "2026-07-08", "count": 2 },
      { "date": "2026-07-09", "count": 5 },
      { "date": "2026-07-10", "count": 4 },
      { "date": "2026-07-11", "count": 1 },
      { "date": "2026-07-12", "count": 2 }
    ]
    ```

#### GET /api/analytics/hotspots
*   **Authentication**: Required
*   **Role Clearance**: Government or Superuser
*   **Success Response (200 OK)**:
    ```json
    [
      {
        "lat": 18.5204,
        "lng": 73.8567,
        "count": 4,
        "types": ["Traffic", "Construction"]
      }
    ]
    ```

#### GET /api/analytics/recent-activity
*   **Authentication**: Required
*   **Role Clearance**: Government or Superuser
*   **Success Response (200 OK)**:
    ```json
    {
      "recentAlerts": [
        {
          "id": 18,
          "title": "Pothole block on flyover",
          "type": "Traffic",
          "author": "Pune Traffic Police",
          "createdAt": "2026-07-12T09:05:00.000Z"
        }
      ],
      "recentReports": [
        {
          "id": 4,
          "title": "Waterlogging under bridge",
          "type": "Weather",
          "status": "pending",
          "submittedBy": "citizen_sam",
          "createdAt": "2026-07-12T09:01:00.000Z"
        }
      ]
    }
    ```

---

## ✉️ 7. Contact Endpoint

Allows guests to submit contact inquiries.

#### POST /api/contact
*   **Authentication**: None (Public)
*   **Request Body**:
    ```json
    {
      "data": {
        "name": "Alex Mercer",
        "email": "alex@mercer.com",
        "subject": "System Question",
        "message": "Is there a mobile application coming soon?"
      }
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Message submitted successfully"
    }
    ```

---

## 🛑 8. Common HTTP Error Codes

| Status Code | Code Name | Description |
| :--- | :--- | :--- |
| **`400`** | `Bad Request` | Request parameters are missing, malformed, or failed schema validations. |
| **`401`** | `Unauthorized` | Credentials failed (login) or authorization header is missing. |
| **`403`** | `Forbidden` | Authenticated session lacks proper user privileges (e.g. non-verified Gov user requesting admin actions). |
| **`404`** | `Not Found` | The requested database resource does not exist. |
| **`409`** | `Conflict` | Resource conflict (e.g. register username or email already present in DB). |
| **`500`** | `Internal Error` | Server/Database crash or external API timeout (Groq, Neon connection limits). |
