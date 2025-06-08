# 💌 UMNUfes - Anonymous Message Web Platform

<div align="center">
  <img src="https://pomf2.lain.la/f/onfz3s58.png" alt="UMNUfes Preview" width="100%">
  
  ![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
  ![Express Version](https://img.shields.io/badge/express-%5E4.18.2-blue)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green)
  ![Version](https://img.shields.io/badge/version-2.0.0%20beta-orange)
</div>

UMNUfes adalah platform web untuk mengirim pesan anonim yang aman dan mudah digunakan. Dirancang khusus untuk memungkinkan komunikasi tanpa identitas dengan sistem moderasi yang kuat dan antarmuka yang modern.

## ✨ Fitur Utama

### 🔒 Sistem Anonim Total
- **Tanpa registrasi** - Langsung kirim pesan tanpa akun
- **Privasi terjamin** - Tidak ada tracking identitas pengirim
- **IP tidak disimpan** - Sistem tidak menyimpan informasi identifikasi

### 🎨 User Experience
- **UI Modern** - Interface responsif dengan TailwindCSS
- **Real-time** - Pesan muncul langsung tanpa refresh
- **Mobile-friendly** - Optimized untuk semua perangkat
- **Search & Filter** - Cari pesan berdasarkan penerima atau konten

### 🛡️ Content Moderation
- **Indonesian Badwords Filter** - Deteksi kata tidak pantas otomatis
- **Report System** - Users dapat melaporkan konten bermasalah
- **Rate Limiting** - Perlindungan dari spam dan flood
- **Input Validation** - Sanitasi input untuk keamanan

### 🔐 Admin Dashboard
- **JWT Authentication** - Sistem login admin yang aman
- **Message Management** - Kelola, hapus, dan moderasi pesan
- **Bulk Actions** - Hapus multiple pesan sekaligus
- **System Monitoring** - Monitor CPU, RAM, dan database usage
- **Auto Session Timeout** - Logout otomatis setelah 5 menit idle
- **Reported Messages** - Panel khusus untuk pesan yang dilaporkan

### 🔧 System Features
- **MongoDB Integration** - Database dengan connection pooling
- **Error Handling** - Smart error recovery dan user-friendly messages
- **Maintenance Mode** - Mode pemeliharaan dengan kontrol admin
- **Storage Monitoring** - Tracking usage MongoDB Free Tier (512MB)
- **Discord Integration** - Support tickets dikirim ke Discord webhook
- **Legal Compliance** - Halaman Privacy Policy dan Terms of Service

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- MongoDB database (local atau cloud)
- Discord webhook URL (optional, untuk support system)

### Installation

1. **Clone repository**
```bash
git clone https://github.com/Kiznaiverr/simple-menfess-web.git
cd simple-menfess-web
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
# Copy template environment file
cp .env.example .env
```

Edit file `.env` dengan konfigurasi Anda:
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_jwt_secret_key
DISCORD_WEBHOOK_URL=your_discord_webhook_url
MAINTENANCE_MODE=false
```

4. **Start server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

5. **Access application**
- Website: `http://localhost:3000`
- Admin: `http://localhost:3000/login`

## 💻 Tech Stack

- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB dengan Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt, rate limiting, input sanitization
- **Content Filtering**: indonesian-badwords library
- **Styling**: TailwindCSS, Font Awesome 6
- **Deployment**: Vercel-ready dengan `vercel.json`

## 📂 Project Structure
```
UMNUfes/
├── 📁 public/assets/          # Static files
│   ├── 📁 css/               # Stylesheets
│   │   ├── style.css         # Main styling
│   │   ├── login.css         # Admin login styles  
│   │   ├── dashboard.css     # Admin dashboard styles
│   │   └── support.css       # Support page styles
│   └── 📁 js/                # Client-side JavaScript
│       ├── api.service.js    # Centralized API communication
│       ├── main.js           # Homepage functionality
│       ├── explore.js        # Message exploration page
│       ├── dashboard.js      # Admin dashboard logic
│       ├── login.js          # Admin authentication
│       ├── db-error-popup.js # Database error handling
│       ├── error-popup.js    # General error popups
│       └── welcome-popup.js  # Welcome modal
├── 📁 views/                 # HTML templates
│   ├── index.html            # Homepage - send messages
│   ├── explore.html          # Browse all messages
│   ├── support.html          # Support/contact form
│   ├── 📁 admin/             # Admin interface
│   │   ├── login.html        # Admin login page
│   │   └── dashboard.html    # Admin control panel
│   ├── 📁 errors/            # Error pages
│   │   ├── 404.html          # Page not found
│   │   ├── offline.html      # Network offline
│   │   ├── maintenance.html  # Maintenance mode
│   │   └── banned.html       # User banned
│   └── 📁 legal/             # Legal documents
│       ├── privacy.html      # Privacy policy
│       └── terms.html        # Terms of service
├── 📁 models/                # Database models
│   └── Message.js            # Message schema & validation
├── 📁 services/              # Business logic
│   ├── db.service.js         # Database operations
│   ├── discord.service.js    # Discord webhook integration
│   └── rateLimit.service.js  # Rate limiting & spam protection
├── 📁 scripts/               # Utility scripts
│   ├── clean-database.js     # Database cleanup
│   ├── clean-badwords.js     # Content filtering tests
│   └── flood-test.js         # Load testing
├── 📁 data/                  # Data files
│   ├── database.json         # JSON database backup
│   └── badwords.json         # Custom badwords list
├── server.js                 # Main application server
├── package.json              # Dependencies & scripts
├── vercel.json              # Vercel deployment config
└── .env                     # Environment variables
```

## 🔧 System Features

### 🔒 Security & Privacy
- **Anonymous Messaging** - Zero personal data collection
- **Input Sanitization** - XSS protection dengan DOMPurify
- **Rate Limiting** - Perlindungan dari spam dan flooding
- **JWT Authentication** - Secure admin access dengan auto-expiry
- **Content Filtering** - Indonesian badwords detection
- **IP-based Ban System** - Temporary bans untuk violators

### 🛠️ Admin Controls
- **Message Management** - View, delete, bulk actions
- **Reported Content** - Dedicated panel untuk pesan yang dilaporkan
- **System Monitoring** - Real-time CPU, RAM, database usage
- **Storage Analytics** - MongoDB storage usage tracking (512MB limit)
- **Session Security** - Auto-logout setelah 5 menit inactivity
- **Maintenance Mode** - System-wide maintenance dengan admin bypass

### 📊 Monitoring & Analytics
- **Real-time Stats** - Total messages, daily count, active recipients
- **System Resources** - CPU load, memory usage, database size
- **Storage Warnings** - Alert saat storage usage > 90%
- **Connection Status** - Database connection monitoring
- **Error Tracking** - Comprehensive error handling dan reporting

### 🔄 Error Handling
- **Database Recovery** - Auto-retry connection dengan fallback
- **User-friendly Popups** - Error messages yang informatif
- **Offline Detection** - Redirect ke offline page saat network down
- **Graceful Degradation** - Aplikasi tetap functional meski ada issues

### 📱 User Experience
- **Responsive Design** - Mobile-first approach
- **Progressive Enhancement** - Works tanpa JavaScript
- **Fast Loading** - Optimized assets dan lazy loading
- **Search & Filter** - Real-time search dengan pagination
- **Keyboard Navigation** - Full keyboard accessibility

## 🛡️ Environment Variables

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `PORT` | Server port number | `3000` | No | `3000` |
| `NODE_ENV` | Environment mode | `development` | No | `production` |
| `MONGODB_URI` | MongoDB connection string | - | **Yes** | `mongodb://localhost:27017/umnufes` |
| `ADMIN_PASSWORD` | Admin dashboard password | - | **Yes** | `admin123` |
| `JWT_SECRET` | JWT token signing secret | - | **Yes** | `your-secret-key` |
| `DISCORD_WEBHOOK_URL` | Discord webhook for support | - | **Yes** | `https://discord.com/api/webhooks/...` |
| `MAINTENANCE_MODE` | Enable maintenance mode | `false` | No | `true` |
| `SITE_NAME` | Website display name | `UMNUfes` | No | `MyApp` |
| `SITE_URL` | Base website URL | - | No | `https://yoursite.com` |

### 🔧 Configuration Examples

**Development (.env.local)**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/umnufes-dev
ADMIN_PASSWORD=dev123
JWT_SECRET=dev-secret-key
MAINTENANCE_MODE=false
```

**Production (.env.production)**
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/umnufes
ADMIN_PASSWORD=super-secure-password
JWT_SECRET=ultra-secure-jwt-secret-key
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook
MAINTENANCE_MODE=false
```

## 🌟 Key Features

### 👥 For Users
- **Send Anonymous Messages** - Kirim pesan tanpa identitas
- **Browse Messages** - Jelajahi pesan dari pengguna lain
- **Search & Filter** - Cari berdasarkan penerima atau konten
- **Report Content** - Laporkan pesan yang tidak pantas
- **Mobile Responsive** - Interface yang responsif di semua device
- **No Registration** - Langsung gunakan tanpa daftar akun
- **Real-time Updates** - Pesan muncul langsung tanpa refresh
- **Privacy Protected** - Tidak ada tracking atau penyimpanan data pribadi

### 🔐 For Administrators
- **Secure Dashboard** - Panel admin dengan JWT authentication
- **Message Moderation** - Kelola dan hapus pesan bermasalah
- **Bulk Operations** - Hapus multiple pesan sekaligus
- **Reported Content Panel** - Lihat dan tangani laporan pengguna
- **System Monitoring** - Monitor performa server real-time
- **Storage Management** - Tracking penggunaan database MongoDB
- **User Ban System** - Banned IP addresses untuk violators
- **Maintenance Mode** - Kontrol maintenance mode sistem
- **Session Security** - Auto-logout dan session management
- **Discord Integration** - Support tickets langsung ke Discord

### 🔧 Developer Features
- **API Service Layer** - Centralized API communication
- **Error Recovery** - Smart error handling dan retry mechanisms
- **Rate Limiting** - Spam protection dengan configurable limits
- **Content Filtering** - Indonesian badwords detection
- **Database Abstraction** - Clean database service layer
- **Modular Architecture** - Separated concerns untuk maintainability
- **Security Hardening** - Input validation, XSS protection
- **Monitoring Tools** - Built-in system resource monitoring

## 📱 Browser Support & Compatibility

### ✅ Fully Supported
- **Desktop**
  - Chrome 90+ (Windows, macOS, Linux)
  - Firefox 85+ (Windows, macOS, Linux)  
  - Safari 14+ (macOS)
  - Edge 90+ (Windows, macOS)

- **Mobile**
  - Chrome Mobile 90+ (Android, iOS)
  - Safari Mobile 14+ (iOS)
  - Firefox Mobile 85+ (Android)
  - Samsung Internet 14+

### 📱 Mobile Features
- **Touch Optimized** - Gesture navigation support
- **Responsive Design** - Adaptive layout untuk semua screen sizes
- **PWA Ready** - Progressive Web App capabilities
- **Offline Support** - Graceful offline page handling
- **Fast Loading** - Optimized untuk mobile networks

## 🚀 Deployment Options

### 🌐 Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy ke Vercel
vercel --prod
```

**Vercel Environment Variables:**
```
MONGODB_URI=mongodb+srv://...
ADMIN_PASSWORD=your-password
JWT_SECRET=your-jwt-secret
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 🐳 Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### ☁️ Other Platforms
- **Heroku** - Deploy dengan git push
- **Railway** - One-click deployment
- **DigitalOcean App Platform** - Container deployment
- **AWS EC2** - Traditional server deployment
- **Google Cloud Run** - Serverless container

## 🛠️ Development Guide

### 📋 Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0
- MongoDB >= 4.4
- Git

### 🔧 Development Setup
```bash
# Clone repository
git clone https://github.com/Kiznaiverr/simple-menfess-web.git
cd simple-menfess-web

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi development

# Start development server
npm run dev
```

### 📝 Available Scripts
```bash
# Development dengan auto-reload
npm run dev

# Production server
npm start

# Testing (development mode)
npm test

# Database cleanup
node scripts/clean-database.js

# Content filter testing
node scripts/clean-badwords.js

# Load testing
node scripts/flood-test.js
```

### 🧪 Testing Utilities
- **Database Cleanup** - `scripts/clean-database.js`
- **Badwords Testing** - `scripts/clean-badwords.js`
- **Load Testing** - `scripts/flood-test.js`
- **API Testing** - `scripts/apikey-test.js`
- **Browser Flood Test** - `scripts/browser-flood.js`

### 🔍 Debugging
```bash
# Enable debug mode
DEBUG=* npm run dev

# MongoDB connection debugging
DEBUG=mongoose npm run dev

# Express debugging
DEBUG=express:* npm run dev
```

## 🤝 Contributing

### 🌿 Branch Strategy
- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### 📝 Contribution Steps
1. **Fork repository**
   ```bash
   git clone https://github.com/your-username/simple-menfess-web.git
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make changes dan commit**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

4. **Push dan create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Submit Pull Request** ke repository utama

### 📋 Code Standards
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Conventional Commits** - Commit message format
- **JSDoc** - Function documentation

## 📄 License & Legal

### 📜 License
Project ini menggunakan **ISC License**. Lihat file [LICENSE](LICENSE) untuk detail lengkap.

### 🔒 Privacy & Terms
- **Privacy Policy** - Tersedia di `/privacy`
- **Terms of Service** - Tersedia di `/terms`
- **No Data Collection** - Aplikasi tidak mengumpulkan data pribadi
- **Anonymous by Design** - Sistem dirancang untuk menjaga anonimitas

## 📞 Support & Contact

### 🆘 Getting Help
- **GitHub Issues** - [Report bugs atau request features](https://github.com/Kiznaiverr/simple-menfess-web/issues)
- **Support Page** - Gunakan form support di aplikasi (`/support`)
- **Discord** - Support tickets otomatis dikirim ke Discord
- **Documentation** - README ini dan code comments

### 🐛 Bug Reports
Ketika melaporkan bug, sertakan:
- OS dan browser version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (jika relevan)
- Error messages (jika ada)

---

<div align="center">
  
### 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Kiznaiverr/simple-menfess-web&type=Date)](https://github.com/Kiznaiverr/simple-menfess-web)

**Made with ❤️ by [Kiznaiverr](https://github.com/Kiznaiverr)**

[⭐ Star Repository](https://github.com/Kiznaiverr/simple-menfess-web) • [🐛 Report Bug](https://github.com/Kiznaiverr/simple-menfess-web/issues) • [✨ Request Feature](https://github.com/Kiznaiverr/simple-menfess-web/issues)

</div>
