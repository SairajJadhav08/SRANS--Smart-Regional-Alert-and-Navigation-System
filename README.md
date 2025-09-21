# 🔔 Smart Regional Alert and Navigation System

> A smart solution that delivers real-time, location-based alerts on disruptions like floods, power cuts, roadblocks, and disease outbreaks. Built using IoT, AI, and GIS technologies, the system helps residents, commuters, and authorities stay informed and navigate efficiently.

[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.2.3-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Features

### 🚨 Alert Management
- **Real-time Alerts**: Traffic, Emergency, Construction, Weather, and Disease outbreak alerts
- **Location-based Notifications**: GPS-enabled alerts for specific regions
- **Multi-category Alerts**: Power cuts, floods, roadblocks, and infrastructure disruptions
- **Government Dashboard**: Verified authorities can create and manage alerts

### 🗺️ Navigation & Mapping
- **Interactive Maps**: Google Maps integration with real-time traffic overlay
- **Smart Route Planning**: Navigate around affected areas
- **Saved Routes**: Users can save frequently used routes
- **Mobile-responsive Design**: Works seamlessly on all devices

### 👥 User Management
- **Dual User Roles**: Regular users and Government officials
- **Account Verification**: Government users require verification
- **Secure Authentication**: Password hashing and session management
- **User Dashboard**: Personalized experience for each user type

### 📱 Additional Features
- **Contact System**: Direct communication with authorities
- **Responsive UI**: Built with Bulma CSS framework
- **Database Management**: SQLite for efficient data storage
- **Error Handling**: Custom 404 and 500 error pages

## 🛠️ Technology Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Lightweight database
- **Werkzeug** - Password hashing and security

### Frontend
- **HTML5/CSS3** - Modern web standards
- **JavaScript** - Interactive functionality
- **Bulma CSS** - Modern CSS framework
- **Google Maps API** - Mapping and location services

### Development Tools
- **Python 3.7+** - Programming language
- **Flask-SQLAlchemy** - Database integration
- **Jinja2** - Template engine

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SairajJadhav08/Smart-Regional-Alert-and-Navigation-System.git
   cd Smart-Regional-Alert-and-Navigation-System
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Google Maps API**
   - Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Replace `YOUR_API_KEY` in map-related templates with your actual key

5. **Initialize the database**
   ```bash
   python app.py
   ```

6. **Run the application**
   ```bash
   python app.py
   ```

7. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## 👤 Default User Accounts

The system comes with pre-configured accounts for testing:

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| Government Admin | `admin` | `admin123` | Create/Edit alerts, Dashboard access |
| Regular User | `user` | `user123` | View alerts, Save routes |

## 📁 Project Structure

```
Smart-Regional-Alert-and-Navigation-System/
├── 📄 app.py                    # Main Flask application
├── 📄 requirements.txt          # Python dependencies
├── 📄 README.md                 # Project documentation
├── 📁 templates/                # HTML templates
│   ├── 📄 base.html             # Base template
│   ├── 📄 index.html            # Homepage
│   ├── 📄 alerts.html           # Alerts listing
│   ├── 📄 map.html              # Interactive map
│   ├── 📄 dashboard.html        # Government dashboard
│   ├── 📄 login.html            # User authentication
│   ├── 📄 register.html         # User registration
│   ├── 📄 new_alert.html        # Create alerts
│   ├── 📄 edit_alert.html       # Edit alerts
│   ├── 📄 my_routes.html        # Saved routes
│   ├── 📄 contact.html          # Contact form
│   ├── 📄 about.html            # About page
│   ├── 📄 features.html         # Features page
│   ├── 📄 404.html              # Error page
│   └── 📄 500.html              # Server error page
├── 📁 instance/                 # Database files
│   └── 📄 database.db           # SQLite database
└── 📁 Docs/                     # Documentation
    ├── 📄 CONTEXT.md            # Project context
    ├── 📄 DEVELOPMENT.md        # Development guide
    └── 📄 context.txt           # Additional context
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
SECRET_KEY=your_secret_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
DATABASE_URL=sqlite:///database.db
```

### Database Models
- **User**: User accounts and authentication
- **Alert**: Regional alerts and notifications
- **SavedRoute**: User's saved navigation routes
- **ContactMessage**: Contact form submissions

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow PEP 8 style guidelines
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Sairaj Jadhav**
- 🌐 GitHub: [@SairajJadhav08](https://github.com/SairajJadhav08)
- 💼 LinkedIn: [Sairaj Jadhav](https://www.linkedin.com/in/sairaj-jadhav-8521b3226/)

## 🙏 Acknowledgments

- Google Maps API for mapping services
- Flask community for the excellent framework
- Bulma CSS for the beautiful UI components
- Contributors and testers who helped improve this project

## 📞 Support

If you encounter any issues or have questions:
- 🐛 [Report bugs](https://github.com/SairajJadhav08/Smart-Regional-Alert-and-Navigation-System/issues)

- Snapshots:
  <img width="1437" height="978" alt="image" src="https://github.com/user-attachments/assets/5bd6746a-4973-4bc2-a956-2d0bb44b3e44" />

- 💡 [Request features](https://github.com/SairajJadhav08/Smart-Regional-Alert-and-Navigation-System/issues)
- 📧 Contact via the application's contact form
<img width="1525" height="973" alt="image" src="https://github.com/user-attachments/assets/f88dc309-9d7e-4717-8740-f3066f49196d" />

<img width="1566" height="968" alt="image" src="https://github.com/user-attachments/assets/9da5fee3-47db-4908-95ed-a2a02ed96339" />


---

⭐ **Star this repository if you find it helpful!**
