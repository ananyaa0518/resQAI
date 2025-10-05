# ResQAI: Report. Respond. Rescue.

## Overview

When disaster strikes, every second counts.  
**ResQAI** is an AI-powered platform that connects citizens and first responders in real time.  
Report emergencies, get instant AI classification, and help coordinate rescues more effectively.
## Demo Video: https://youtu.be/r5XmbAlUuz8

---

## Table of Contents
- [Problem Solved](#problem-solved)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Project Structure](#project-structure)
- [Usage](#usage)
  - [Authentication](#authentication)
  - [Machine Learning Model](#machine-learning-model)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## Problem Solved

Rescue operations often face challenges like lack of timely information, resource allocation, and situation assessment.  
resQAI addresses these by:
- Automating data analysis from various sources.
- Providing real-time situational predictions.
- Improving coordination and response time.
- **Enabling immediate, high-priority response for women’s safety emergencies via dedicated SOS alerts.**

## Features

- 🚨 Women’s Safety SOS with priority alerts.
- 📝 Submit reports with mandatory text and location.
- 🤖 AI classification of reports (Flood/Fire/Earthquake/Other) and confidence scoring.
- 💾 Store and manage reports in PostgreSQL database.
- 🗺️ Interactive Mapbox map with clickable pins for details.
- ✅ Admin verification: only verified reports are shown.
- 🛡️ CAPTCHA and API rate limiting for spam protection.

## Tech Stack

- **Languages:** Python, JavaScript
- **Frameworks:** Next.js, FastAPI, React, Tailwind CSS 
- **Libraries:** SQLAlchemy, Mongoose, Axios, bcryptjs
- **Tools:** Google Maps API, Pydantic Settings, SlowAPI 

## Getting Started

### Prerequisites

- Python 3.x
- Node.js and npm
- pip

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ananyaa0518/resQAI.git
   cd resQAI
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install frontend dependencies (if applicable):**
   ```bash
   cd frontend
   npm install
   ```

4. **Set up environment variables:**  
   Create a `.env` file based on `.env.example`.

5. **Run the application:**
   ```bash
   python app.py
   # or frontend start command
   ```

## Project Structure

```
resQAI/
├── app.py
├── requirements.txt
├── frontend/
│   ├── package.json
│   └── src/
├── models/
│   └── rescue_model.pkl
├── data/
└── README.md
```

## Usage

### Authentication

- User authentication is required for accessing sensitive endpoints.
- Supported via JWT or OAuth (specify as per implementation).
- Example:
  ```bash
  curl -X POST /login -d '{"username": "user", "password": "pass"}'
  ```

### Machine Learning Model

- The integrated ML model predicts incident urgency and resource needs.
- Model training and inference scripts are in the `models/` directory.
- Results are displayed in the dashboard or accessible via API.

## Future Enhancements

- Expand ML capabilities for new incident types.
- Integrate geospatial data for better resource mapping.
- Mobile application for field responders.

## Contributing

Contributions are welcome!  
Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License.  
See [LICENSE](LICENSE) for details.


