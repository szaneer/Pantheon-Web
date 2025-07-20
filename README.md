# Pantheon Web

The web client for Pantheon's decentralized AI platform. Access AI models hosted on remote devices through your browser with real-time P2P communication.

## 🌟 Features

- **Remote Model Access**: Connect to models hosted on other Pantheon devices
- **Real-time Chat**: WebRTC-based low-latency communication
- **Device Discovery**: Automatic discovery of available devices and models
- **Responsive Design**: Works on desktop and mobile browsers
- **No Installation**: Run directly in your browser
- **PWA Support**: Install as a progressive web app

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A running Pantheon signaling server

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Docker Deployment

```bash
# Build Docker image
docker build -t pantheon-web .

# Run container
docker run -p 8080:80 pantheon-web

# Using docker-compose
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for development:

```env
VITE_SIGNALING_SERVER_URL=http://localhost:3001
VITE_AUTH_KEY=your-optional-auth-key
```

### Build-time Configuration

For production builds, set environment variables:

```bash
VITE_SIGNALING_SERVER_URL=https://your-server.com \
VITE_AUTH_KEY=your-auth-key \
npm run build
```

## 🖥️ Usage

1. **Access**: Open the web app in your browser
2. **Onboarding**: Configure your signaling server on first visit
3. **Connect**: The app automatically discovers available devices
4. **Chat**: Select any remote model and start chatting

### Supported Browsers

- **Chrome/Chromium**: Full WebRTC support
- **Firefox**: Full WebRTC support
- **Safari**: WebRTC support (iOS 15+)
- **Edge**: Full WebRTC support

## 🛠️ Development

### Project Structure

```
apps/web/
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and P2P services
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
└── nginx.conf           # Production nginx config
```

### Tech Stack

- **React**: UI framework with TypeScript
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.IO**: Signaling communication
- **WebRTC**: P2P connections

### Development Commands

```bash
# Start dev server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

### Static Hosting

The built app is a static SPA that can be deployed to:

- **Vercel**: Zero-config deployment
- **Netlify**: Automatic deployments from Git
- **GitHub Pages**: Free static hosting
- **AWS S3**: Static website hosting

### Docker Production

```dockerfile
# Multi-stage build for optimal size
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

## 🔒 Security

- **No Local Storage of Credentials**: Auth tokens are session-only
- **HTTPS Recommended**: For production deployments
- **WebRTC Encryption**: All P2P communication is encrypted
- **No Data Persistence**: Conversations are client-side only

## 📱 Progressive Web App

The web client supports PWA features:

- **Install Prompt**: Add to home screen on mobile
- **Offline Ready**: Basic functionality without network
- **App-like Experience**: Full-screen mode and app icons

## 🤝 Contributing

This is part of the [Pantheon](https://github.com/szaneer/Pantheon) ecosystem. Please refer to the main repository for contribution guidelines.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.