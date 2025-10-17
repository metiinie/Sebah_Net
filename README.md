# 🎬 MediaStream - Advanced Streaming Platform

A comprehensive, modern streaming platform built with React, TypeScript, and Supabase, featuring Netflix-style video listings and Spotify-style music streaming with advanced analytics and personalization.

## 🚀 **System Architecture**

### **Frontend Stack**
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for modern, responsive styling
- **Framer Motion** for smooth animations and transitions
- **React Router** for client-side routing
- **Lucide React** for consistent iconography

### **Backend & Database**
- **Supabase** for authentication, database, and real-time features
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates
- **File storage** for media assets

### **Key Features**
- **Advanced Media Player** with adaptive streaming
- **Real-time Analytics** and performance monitoring
- **Personalization Engine** with user profiles and recommendations
- **Admin Dashboard** with content management
- **Streaming Intelligence** with transcoding pipeline
- **Search & Discovery** with AI-powered recommendations

## 📁 **Project Structure**

```
src/
├── components/           # Reusable UI components
│   ├── SmartMediaPlayer.tsx      # Advanced media player
│   ├── UnifiedSearch.tsx         # Search functionality
│   ├── AdvancedSearchEngine.tsx  # Advanced search engine
│   ├── AnalyticsDashboard.tsx    # Content analytics
│   ├── StreamingAnalyticsDashboard.tsx # Streaming metrics
│   ├── UnifiedProfile.tsx        # User profile management
│   ├── EnhancedHeader.tsx        # Navigation header
│   └── ... (other components)
├── pages/               # Application pages
│   ├── Auth.tsx                  # Authentication
│   ├── Choice.tsx                # Main dashboard
│   ├── Movies.tsx                # Movie streaming
│   ├── Music.tsx                 # Music streaming
│   ├── Admin.tsx                 # Admin panel
│   ├── StreamingAdmin.tsx        # Streaming management
│   ├── Upload.tsx                # Content upload
│   ├── SearchAndDiscovery.tsx    # Search & discovery
│   ├── Personalization.tsx       # User preferences
│   └── NotFound.tsx              # 404 page
├── hooks/               # Custom React hooks
│   ├── usePermissions.ts         # Role-based access
│   ├── useStreamingAnalytics.ts  # Analytics tracking
│   ├── usePersonalization.ts     # User preferences
│   ├── useKeyboardShortcuts.ts   # Keyboard navigation
│   ├── useLoading.ts             # Loading states
│   └── usePageNavigation.ts      # Navigation management
├── lib/                 # Core services and utilities
│   ├── supabase.ts              # Database client
│   ├── constants.ts             # Application constants
│   ├── dataService.ts           # Data fetching
│   ├── personalizationService.ts # User profiles
│   ├── searchService.ts         # Search & recommendations
│   ├── streamingService.ts      # Streaming analytics
│   └── errorHandler.ts          # Error management
├── contexts/            # React contexts
│   ├── AuthContext.tsx          # Authentication state
│   └── ThemeContext.tsx         # Theme management
└── App.tsx             # Main application component
```

## 🎯 **Core Features**

### **1. Advanced Media Player**
- **Universal Support**: Video and audio playback
- **Adaptive Streaming**: Quality selection and bitrate adaptation
- **Advanced Controls**: Play, pause, seek, volume, fullscreen
- **Keyboard Shortcuts**: Full keyboard navigation
- **Analytics Integration**: Real-time playback tracking
- **Resume Functionality**: Continue from last position
- **Picture-in-Picture**: Modern PiP support
- **Error Recovery**: Robust error handling

### **2. Netflix-Style Video Listings**
- **Responsive Grid**: 2-6 columns based on screen size
- **Hover Effects**: Scale, zoom, and overlay animations
- **Rating Badges**: Star ratings and duration indicators
- **Genre Filtering**: Advanced filtering and sorting
- **Search Integration**: Real-time search with debouncing
- **Loading States**: Skeleton loaders and smooth transitions

### **3. Spotify-Style Music Streaming**
- **Track Listings**: Elegant track cards with album art
- **Play Indicators**: Visual feedback for current track
- **Queue Management**: Playlist and queue functionality
- **Audio Controls**: Advanced audio settings
- **Metadata Display**: Artist, album, genre information
- **Rating System**: User ratings and reviews

### **4. Admin Dashboard**
- **Content Management**: Full CRUD operations for movies and music
- **User Management**: Role-based access control
- **Analytics Overview**: Real-time statistics and metrics
- **Upload Management**: File upload and processing
- **System Monitoring**: Performance and health metrics

### **5. Streaming Intelligence**
- **Transcoding Pipeline**: Automated video processing
- **CDN Management**: Content delivery optimization
- **Performance Analytics**: Real-time streaming metrics
- **Error Monitoring**: Playback error tracking
- **Quality Analytics**: Bitrate and resolution tracking

### **6. Personalization Engine**
- **User Profiles**: Multiple profiles per account
- **Watchlist System**: Save and organize content
- **Continue Watching**: Resume from last position
- **Recommendations**: AI-powered content suggestions
- **Viewing History**: Track watched content
- **Kids Profiles**: Parental controls and restrictions

### **7. Search & Discovery**
- **Advanced Search**: Multi-criteria search engine
- **Filter System**: Genre, year, rating, duration filters
- **Recommendation Engine**: Personalized suggestions
- **Trending Content**: Popular and trending searches
- **Search History**: Previous search tracking
- **Real-time Results**: Instant search results

## 🔐 **Security & Permissions**

### **Role-Based Access Control**
- **Admin Users**: Full system access and management
- **Regular Users**: Content viewing and personalization
- **Permission Guards**: Component-level access control
- **Protected Routes**: Authentication-based routing

### **Security Features**
- **Row Level Security (RLS)**: Database-level access control
- **Input Validation**: Client and server-side validation
- **Rate Limiting**: Upload and API rate limits
- **Audit Logging**: Security event tracking
- **HTTPS Enforcement**: Secure data transmission

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- A Supabase project
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd movie-music-Streamer
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the project root:
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=ey... (anon public key)
```

4. **Database Setup**
Run the consolidated migration:
```bash
supabase/migrations/20251010000003_simple_tables_only.sql
```

This creates all necessary tables, policies, and functions:
- `profiles`, `movies`, `music`, `uploads`, `rate_limits`, `audit_logs`
- Row Level Security (RLS) policies for role-based access
- Admin-only upload permissions for movies and music
- Rate limiting (50 uploads per hour)
- Security audit logging

### **Development**

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📊 **Performance & Optimization**

### **Build Optimization**
- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Unused code elimination
- **Bundle Analysis**: Optimized asset delivery
- **Caching**: Efficient resource caching

### **Runtime Performance**
- **Virtual Scrolling**: Large list optimization
- **Image Optimization**: Lazy loading and compression
- **State Management**: Efficient state updates
- **Memory Management**: Proper cleanup and garbage collection

### **User Experience**
- **Loading States**: Skeleton loaders and spinners
- **Error Boundaries**: Graceful error handling
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliance

## 🛠 **Development Guidelines**

### **Code Quality**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks

### **Testing Strategy**
- **Unit Tests**: Component and utility testing
- **Integration Tests**: Feature testing
- **E2E Tests**: User journey testing
- **Performance Tests**: Load and stress testing

### **Deployment**
- **Environment Variables**: Secure configuration
- **Build Optimization**: Production-ready builds
- **CDN Integration**: Global content delivery
- **Monitoring**: Error tracking and analytics

## 📈 **Analytics & Monitoring**

### **Streaming Analytics**
- **Real-time Tracking**: Live playback metrics
- **Quality Monitoring**: Bitrate and resolution tracking
- **Buffer Analysis**: Network performance insights
- **Error Tracking**: Playback error monitoring
- **User Behavior**: Watch time and completion rates

### **System Health**
- **Performance Metrics**: CPU, memory, storage monitoring
- **CDN Status**: Global delivery network health
- **Database Performance**: Query optimization and monitoring
- **Error Rates**: System error tracking and alerting

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id

# Optional: CDN
VITE_CDN_URL=your_cdn_url
```

### **Feature Flags**
- **Enable Analytics**: Real-time tracking
- **Enable Personalization**: User recommendations
- **Enable Upload**: Content upload functionality
- **Enable Admin**: Administrative features

## 📚 **API Documentation**

### **Supabase Integration**
- **Authentication**: User management and sessions
- **Database**: Content and user data storage
- **Storage**: Media file management
- **Real-time**: Live updates and subscriptions

### **Custom Services**
- **Data Service**: Content fetching and management
- **Search Service**: Advanced search and recommendations
- **Personalization Service**: User preferences and profiles
- **Streaming Service**: Analytics and performance tracking

## 🤝 **Contributing**

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Code Standards**
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure responsive design
- Test on multiple devices

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 **Support**

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples
- Contact the development team

## 🎉 **Acknowledgments**

- **Supabase** for the backend infrastructure
- **React** and **TypeScript** communities
- **Tailwind CSS** for the design system
- **Framer Motion** for animations
- **Lucide** for the icon library

---

**Built with ❤️ for the streaming community**