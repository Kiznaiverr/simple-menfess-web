# 💌 SendMenfess - Anonymous Message Web App

<div align="center">
  <img src="https://pomf2.lain.la/f/onfz3s58.png" alt="SendMenfess Preview" width="100%">
  
  ![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
  ![Express Version](https://img.shields.io/badge/express-%5E4.18.2-blue)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green)
</div>

## ✨ Features

- 🔒 **100% Anonymous** - No login required for sending messages
- 🚀 **Real-time Updates** - Messages appear instantly
- 🔍 **Smart Search** - Search by recipient or message content
- 📱 **Fully Responsive** - Works perfectly on all devices
- 🎨 **Modern UI** - Clean and intuitive TailwindCSS interface
- 🔐 **Admin Panel** - Secure message management dashboard
- ⚡ **Session Management** - Auto logout after 5 minutes inactivity
- 📊 **Storage Monitor** - MongoDB Free Tier storage monitoring
- 🛑 **Maintenance Mode** - Redirect all users to maintenance page except admin
- 🛡️ **Error Popup** - User-friendly error popups for DB/network issues
- 📄 **Legal Pages** - Privacy Policy & Terms of Service included

## 🚀 Quick Start

1. Clone and install
```bash
git clone https://github.com/Kiznaiverr/simple-menfess-web.git
cd simple-menfess-web
npm install
```

2. Set up environment variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

3. Start the server
```bash
npm start
```

Visit `http://your-web.com` 🎉

## 💻 Tech Stack

- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Icons**: Font Awesome 6
- **Deployment**: Vercel (with `vercel.json`)

## 📂 Project Structure
```
sendmenfess/
├── public/
│   └── assets/
│       ├── css/
│       │   ├── style.css
│       │   ├── login.css
│       │   └── dashboard.css
│       └── js/
│           ├── main.js
│           ├── explore.js
│           ├── dashboard.js
│           ├── db-error-popup.js
│           ├── error-popup.js
│           └── login.js
├── views/
│   ├── index.html
│   ├── explore.html
│   ├── admin/
│   │   ├── login.html
│   │   └── dashboard.html
│   └── errors/
│       ├── 404.html
│       ├── offline.html
│       └── maintenance.html
│   └── legal/
│       ├── privacy.html
│       └── terms.html
├── models/
│   └── Message.js
├── services/
│   └── db.service.js
├── utils/
├── data/
│   └── database.json
├── server.js
├── .env
├── package.json
├── vercel.json
└── README.md
```

## 🔧 System Features

### Maintenance Mode
Enable maintenance mode by setting `MAINTENANCE_MODE=true` in .env:
- Redirects all routes to maintenance page (`maintenance.html`)
- Keeps static assets accessible
- Allows admin access
- Useful for system updates

### Error Handling
The system includes smart error handling:

- **Database Connection:**
  - Shows popup for temporary issues (see `db-error-popup.js`)
  - Auto-retry connection
  - User-friendly error messages

- **Error Types:**
  - Database Connection Issues
  - Network Problems
  - System Maintenance
  - Service Unavailable

### System Status
- Real-time connection monitoring
- Automatic error reporting
- Status indicators in admin dashboard
- MongoDB storage usage tracking (512MB limit)
- Storage usage warnings at 90%

### Storage Management
- Visual storage indicators
- Storage limit monitoring
- Usage threshold alerts
- Manual data management tools
- Real-time storage stats

### Legal Pages
- Privacy Policy (`privacy.html`)
- Terms of Service (`terms.html`)

## 🛡️ Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Server port number | 3000 | No |
| NODE_ENV | Environment mode | development | No |
| MONGODB_URI | MongoDB connection string | - | Yes |
| DB_PASSWORD | Database password | - | Yes |
| ADMIN_PASSWORD | Admin dashboard access | - | Yes |
| SITE_NAME | Website name | SendMenfess | No |
| SITE_URL | Website URL | - | Yes |
| MAINTENANCE_MODE | Enable maintenance mode | false | No |

## 🌟 Key Features

### For Users
- Send anonymous messages
- No registration required
- Real-time message updates
- Search & filter messages
- Mobile-friendly interface
- Legal & privacy compliance

### For Admins
- Secure admin dashboard
- Message moderation
- Bulk message actions
- System status monitoring
- Auto session management
- Maintenance mode control

## 📱 Mobile Support

The app is fully responsive and tested on:
- iOS Safari
- Android Chrome
- Mobile Firefox
- Microsoft Edge Mobile

## 🚀 Deployment

Ready to deploy on:
- Vercel (recommended, with `vercel.json`)
- Heroku
- Railway
- Any Node.js hosting

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add NewFeature'`)
4. Push to branch (`git push origin feature/NewFeature`)
5. Open a Pull Request at [https://github.com/Kiznaiverr/simple-menfess-web](https://github.com/Kiznaiverr/simple-menfess-web)

Project Link: [https://github.com/Kiznaiverr/simple-menfess-web](https://github.com/Kiznaiverr/simple-menfess-web)

---
<div align="center">
  Made with ❤️ by <a href="https://github.com/Kiznaiverr">Kiznaiverr</a>
</div>
