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

## 🚀 Quick Start

1. Clone and install
```bash
git clone https://github.com/Kiznaiverr/simple-menfess-web.git
cd simple-menfess-web
npm install
```

2. Database Configuration
```env
# Use MongoDB (true/false)
USE_MONGODB=false     # true for MongoDB, false for local JSON

# If using MongoDB:
MONGODB_URI=your_mongodb_uri
DB_PASSWORD=your_db_password

# Local JSON will be stored in data/database.json if USE_MONGODB=false
```

3. Create .env file
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
DB_PASSWORD=your_db_password
ADMIN_PASSWORD=your_admin_password
SITE_NAME=SendMenfess
```

4. Start the server
```bash
npm start
```

Visit `http://your-web.com` 🎉

## 💻 Tech Stack

- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Icons**: Font Awesome 6
- **Deployment**: Vercel

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
│           └── dashboard.js
├── views/
│   ├── index.html
│   ├── explore.html
│   ├── admin/
│   │   ├── login.html
│   │   └── dashboard.html
│   └── errors/
│       ├── 404.html
│       └── offline.html
├── models/
│   └── Message.js
├── server.js
├── .env
└── package.json
```

## 🔧 System Features

### Maintenance Mode
Set maintenance mode through environment variable:
```env
MAINTENANCE_MODE=true  # Enable maintenance mode
MAINTENANCE_MODE=false # Disable maintenance mode
```

When maintenance mode is enabled:
- All routes redirect to maintenance page
- Static assets remain accessible
- Admin can still access dashboard

### Error Handling
The system includes smart error handling:

- **Database Connection:**
  - Shows popup for temporary issues
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

## 🛡️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port (default: 3000) | 3000 |
| MONGODB_URI | MongoDB connection string | - |
| DB_PASSWORD | Database password | - |
| ADMIN_PASSWORD | Admin dashboard password | - |
| NODE_ENV | Environment (development/production) | development |
| MAINTENANCE_MODE | Enable/disable maintenance mode | false |

## 🌟 Key Features

### For Users
- Send anonymous messages
- No registration required
- Real-time message updates
- Search & filter messages
- Mobile-friendly interface

### For Admins
- Secure admin dashboard
- Message moderation
- Bulk message actions
- System status monitoring
- Auto session management

## 📱 Mobile Support

The app is fully responsive and tested on:
- iOS Safari
- Android Chrome
- Mobile Firefox
- Microsoft Edge Mobile

## 🚀 Deployment

Ready to deploy on:
- Vercel
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
