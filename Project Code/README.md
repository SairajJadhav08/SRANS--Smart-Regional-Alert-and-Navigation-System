# Smart Regional Alert & Navigation System

A web application that provides real-time alerts and smart navigation for regional travel. Built with Flask, SQLite, and Bulma CSS.

## Features

- **Real-time Alerts**: Traffic, Emergency, Construction, and Weather alerts
- **Interactive Map**: Google Maps integration with traffic overlay
- **User Roles**: Regular users and Government users with different permissions
- **Government Dashboard**: Create and manage alerts
- **Mobile Responsive**: Works on all device sizes

## Screenshots

(Screenshots to be added after deployment)

## Setup & Installation

### Prerequisites

- Python 3.7+
- pip

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd smart-regional-alert
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install the dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up the Google Maps API:
   - Create a Google Maps API key at https://developers.google.com/maps/documentation/javascript/get-api-key
   - Replace `YOUR_API_KEY` in the map-related templates with your actual API key

5. Run the application:
   ```
   python app.py
   ```

6. Access the application in your browser:
   ```
   http://localhost:5000
   ```

## Default Users

The application comes with two default users:

- **Government User**:
  - Username: admin
  - Password: admin123

- **Regular User**:
  - Username: user
  - Password: user123

## Project Structure

```
smart-regional-alert/
├── app.py                  # Main application file
├── requirements.txt        # Python dependencies
├── README.md               # This file
├── templates/              # HTML templates
│   ├── base.html           # Base template with common elements
│   ├── index.html          # Home page
│   ├── features.html       # Features page
│   ├── alerts.html         # Alerts page
│   ├── map.html            # Map page
│   ├── about.html          # About page
│   ├── contact.html        # Contact page
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── dashboard.html      # Government dashboard
│   └── new_alert.html      # Create new alert page
└── static/                 # Static files (to be added if needed)
```

## Technology Stack

- **Backend**: Flask, SQLAlchemy
- **Database**: SQLite
- **Frontend**: HTML5, CSS3, JavaScript, Bulma CSS
- **Maps API**: Google Maps JavaScript API

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or suggestions, please open an issue in the GitHub repository. 