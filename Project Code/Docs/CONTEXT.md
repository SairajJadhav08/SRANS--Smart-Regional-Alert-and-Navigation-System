# Smart Regional Alert & Navigation System – Developer Guide

## Overview
**Smart Regional Alert & Navigation** is a Flask-based web application that provides real-time alerts and smart navigation. It utilises **Bulma** for responsive styling and an **SQLite** database for data storage. The system includes:
1. **Navigation Bar** with sections: Home, Features, Alerts, Map, About, Contact.
2. **User Authentication** with two types of users: 
   - Government Login
   - User Login
3. **Alerts Management** (for logged-in Government users): 
   - Traffic Alerts
   - Emergency Alerts
   - Construction Alerts
   - Weather Alerts
4. **Interactive Map** integration using Google Maps with live user location tracking and traffic status.

---

## Main Pages

1. **Home Page**
   - **Heading:** “Welcome to Smart Regional Alert & Navigation System”
   - **Sub-heading:** “Stay informed about real-time alerts and navigate your region efficiently.”
   - **Three Cards**:
     1. **Live Alerts** – “Get instant notifications about emergencies, road closures, and other disruptions.”
     2. **Smart Navigation** – “Find the best routes to avoid roadblocks and traffic congestion.”
     3. **Government Updates** – “Stay informed about local government projects and regulations.”

2. **Features Page**
   - **Heading:** “Powerful Features”
   - **Sub-heading:** “Explore the capabilities of our Smart Regional Alert & Navigation System.”
   - **Feature Cards** describing the benefits or unique aspects of the system.

3. **Alerts Page**
   - **Heading:** “Real-Time Alerts”
   - **Sub-heading:** “Stay ahead with up-to-the-minute information.”
   - **Four Cards**:
     1. **Traffic Alerts** – “Real-time traffic updates to navigate the most efficient path.”
     2. **Emergency Alerts** – “Immediate notifications on emergencies for quick response.”
     3. **Construction Alerts** – “Stay informed on construction zones to avoid delays.”
     4. **Weather Alerts** – “Be prepared for any weather conditions with real-time alerts.”

4. **Map Page**
   - **Heading:** “Interactive Map”
   - **Sub-heading:** “Explore and navigate your region with live traffic updates.”
   - **Embedded Google Map** with:
     - **Current User Location** (if permission granted).
     - **Traffic Status Overlay**.

5. **About Page**
   - **Heading:** “About Our System”
   - **Sub-heading:** “Learn about our mission to keep communities connected and safe.”
   - **Content**:
     - **Our Mission:** “We strive to provide timely and accurate information to help you navigate your region safely and efficiently. We are dedicated to empowering communities by keeping them informed about critical events and updates.”
     - **Team:** “Our team consists of dedicated developers, community managers, and data analysts who are passionate about leveraging technology for the betterment of society.”

6. **Contact Page**
   - **Heading:** “Contact Us”
   - **Sub-heading:** A basic form or placeholder for user inquiries.
   - **Content Example:** Could include a form with fields for name, email, and message.

---

## User & Government Login

- **Login Pages**:
  - **User Login**
  - **Government Login**
- **Registration** (if needed) or an initial seed user in the database.
- **Role-Based Access**:
  - **Government User** can:
    - Add new alerts (Traffic, Emergency, Construction, Weather).
    - Edit or delete existing alerts.
  - **Regular User** can:
    - View alerts.
    - Access navigation and map features.

---

## Database Schema (SQLite)

You can manage the schema using migrations or a simple script. Below is a conceptual structure:

1. **users** table:
   - **id** (primary key, integer)
   - **username** (string)
   - **password** (string, hashed)
   - **role** (string, e.g., "government" or "user")

2. **alerts** table:
   - **id** (primary key, integer)
   - **alert_type** (string, e.g., “Traffic”, “Emergency”, “Construction”, “Weather”)
   - **title** (string)
   - **description** (text)
   - **created_at** (datetime)
   - **updated_at** (datetime if needed)

---