# Models Directory

This directory contains all the data models for the ResqueAI project, organized in a structured way.

## Structure

### Python Models (SQLAlchemy)

- `base.py` - Base class for all SQLAlchemy models
- `user.py` - User model with authentication
- `report.py` - Report model with disaster classification
- `__init__.py` - Package initialization and exports

### JavaScript Models (Mongoose)

- `User.js` - User model for MongoDB
- `Report.js` - Report model for MongoDB
- `index.js` - Exports all JavaScript models

## Usage

### Python (FastAPI)

```python
from models import User, Report, ReportStatus, DisasterType
# or
from models.user import User
from models.report import Report, ReportStatus, DisasterType
```

### JavaScript (Next.js API)

```javascript
import User from "../../../../models/User";
import Report from "../../../../models/Report";
// or
import { User, Report } from "../../../../models";
```

## Model Features

### User Model

- Phone number authentication
- Password hashing with bcrypt
- Role-based access (user/admin)
- Account status management

### Report Model

- Disaster type classification
- Geographic location (lat/lng)
- Status tracking (Pending/Verified/Rejected)
- SOS emergency support
- Image attachments
- Verification workflow

## Database Support

- **Python**: SQLAlchemy with PostgreSQL/SQLite
- **JavaScript**: Mongoose with MongoDB
