# XStore - Secure Storage Application

A modern, secure web application for storing sensitive information including secrets, API keys, passwords, code snippets, and files in a multi-folder structure with end-to-end encryption.

## Features

### 🔒 Security & Authentication
- Secure JWT-based authentication
- End-to-end client-side encryption using AES-256
- Encrypted file storage and transmission
- Personal encryption keys for each user

### 📁 Multi-Folder System
- Create, rename, delete, and nest folders infinitely
- Drag-and-drop support for organization
- Hierarchical folder structure with breadcrumbs
- Root folder protection

### 🌟 Frequently Used Section
- Track most accessed files and snippets
- Pin items for quick access
- Analytics on access patterns
- Smart recommendations

### 📝 Storage Types
- **Text Notes**: Plain text content storage
- **Secrets**: Encrypted sensitive information
- **API Keys**: Secure token and key storage  
- **Code Snippets**: Syntax-highlighted code with language detection
- **Files**: Encrypted file uploads up to 50MB

### 💾 Backup & Restore
- Export all data as encrypted JSON
- Import from encrypted backup files
- Preserve folder hierarchy and metadata
- Version compatibility checking

### 🎨 Modern UI/UX
- Beautiful, minimalistic design with Apple-level aesthetics
- Dark mode and light mode support
- Responsive design for all devices
- Smooth animations and micro-interactions
- Collapsible sidebar navigation

### 🔍 Advanced Features
- Full-text search with filtering
- Tag system for organization
- Version history for edited items
- Comprehensive color system and typography
- 8px spacing system for consistency

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **CryptoJS** for encryption

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **JWT** authentication
- **bcrypt** for password hashing
- **Multer** for file uploads
- **Helmet** for security headers

### Infrastructure
- **Docker Compose** for containerization
- **PostgreSQL 15** database container
- **Node 18 Alpine** application container
- Volume persistence for data and files

## Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- PostgreSQL (if running without Docker)

### Production Setup with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd xstore-app
```

2. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the application**
```bash
docker-compose up -d
```

4. **Initialize the database**
```bash
docker-compose exec app npm run init-db
```

The application will be available at `http://localhost:3001`

### Development Setup

1. **Install dependencies**
```bash
npm install
```

2. **Set up PostgreSQL database**
```bash
# Create database and user
createdb xstore_db
createuser -s xstore_user
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit database connection settings
```

4. **Initialize database schema**
```bash
npm run init-db
```

5. **Start development servers**
```bash
# Terminal 1 - Backend
npm run server:dev

# Terminal 2 - Frontend  
npm run dev
```

## Environment Variables

```bash
NODE_ENV=production
PORT=3001
CLIENT_URL=http://localhost:5173

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=xstore_db
DB_USER=xstore_user
DB_PASSWORD=xstore_password

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# File Upload Settings
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify JWT token

### Folder Management
- `GET /api/folders` - Get all folders
- `POST /api/folders` - Create folder
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

### Item Management
- `GET /api/items` - Get items (with filtering)
- `GET /api/items/frequent` - Get frequently used items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `PUT /api/items/:id/pin` - Toggle pin status
- `GET /api/items/:id/versions` - Get item versions

### File Operations
- `POST /api/files/upload` - Upload file
- `GET /api/files/download/:id` - Download file
- `DELETE /api/files/:id` - Delete file

### Backup & Restore
- `GET /api/backup/export` - Export encrypted backup
- `POST /api/backup/import` - Import backup data

## Database Schema

### Tables
- **users**: User accounts with encryption keys
- **folders**: Hierarchical folder structure
- **items**: Encrypted content storage
- **item_versions**: Version history tracking

### Key Features
- Row Level Security (RLS) enabled on all tables
- Proper indexing for performance
- Foreign key constraints for data integrity
- Automatic timestamps and versioning

## Security Features

### Encryption
- Client-side AES-256-GCM encryption
- Unique encryption key per user
- Content encrypted before transmission
- Files encrypted at rest

### Authentication
- JWT tokens with 7-day expiration
- bcrypt password hashing with salt rounds: 12
- Secure session management
- Token verification middleware

### Data Protection
- HTTPS enforcement in production
- Helmet.js security headers
- CORS protection
- SQL injection prevention
- Input validation and sanitization

## Deployment

### Production Deployment
1. Configure production environment variables
2. Set up SSL/TLS certificates
3. Configure reverse proxy (nginx recommended)
4. Set up database backups
5. Monitor logs and performance

### Scaling Considerations
- Database connection pooling
- File storage optimization
- CDN for static assets
- Load balancing for multiple instances
- Redis for session storage (optional)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Examine the Docker logs
- Test with the provided examples

## Security Notice

This application handles sensitive data. Always:
- Use HTTPS in production
- Keep dependencies updated
- Monitor for security vulnerabilities
- Regularly backup your data
- Use strong passwords and JWT secrets