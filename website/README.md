# CosmoNaut Website

## 🌟 Features

### ✨ Animated Twinkling Stars Background
The website features a beautiful, lively animated starfield with three layers of twinkling stars:
- **Purple stars** (brand color #A100FF)
- **Cyan stars** (brand color #00D9FF)
- **White stars** for contrast
- Different animation speeds (5s, 7s, 10s) create depth
- More prominent in dark mode for enhanced visual appeal
- Subtle floating animation adds life to the background

### 🌓 Dark/Light Mode
- **Toggle button** in the navigation bar (sun/moon icon)
- **System theme detection** - automatically matches your OS preference
- **Persistent preference** - remembers your choice using localStorage
- **Smooth transitions** between themes
- **Keyboard shortcut**: `Ctrl/Cmd + Shift + L`

### 🔐 Firebase Authentication
Users who sign in to the CosmoNaut desktop app are **automatically signed in** to the website:
- **Shared Firebase authentication** across desktop app and website
- **Google Sign-In** integration
- **User avatar** with email initial in the navbar
- **Persistent sessions** - stay signed in across page reloads
- **Sign out** functionality
- **Download without signing in** - authentication is optional

### 🎨 Enterprise Design
Inspired by Accenture's professional aesthetic:
- **Minimalist, corporate design language**
- **Clean typography** with Inter font family
- **Sophisticated color palette**
- **Subtle micro-interactions**
- **Professional spacing and layout**
- **Smooth animations and transitions**

### 🚀 Astronaut Logo
- Custom SVG logo integrated throughout the site
- **Brand gradient colors** (Purple → Cyan)
- Animated glow effect on hero section
- Scales perfectly at any size

## 📁 File Structure

```
website/
├── index.html      # Main HTML structure
├── styles.css      # All styling including stars animation
├── script.js       # Theme toggle, OS detection, animations
├── auth.js         # Firebase authentication (ES module)
└── logo.svg        # Astronaut logo
```

## 🔧 How It Works

### Authentication Sync
1. User signs in to the desktop app using Firebase
2. Firebase stores authentication state in browser localStorage
3. When user visits the website, Firebase automatically detects the existing session
4. User is already signed in on the website - no need to sign in again!

### Stars Animation
The stars are created using CSS `radial-gradient` with three layers:
- Each layer has different star positions and sizes
- `@keyframes twinkle` animates opacity (0.3 → 0.8 → 0.3)
- Different animation durations create natural twinkling effect
- Dark mode increases opacity for better visibility

## 🌐 Local Development

1. **Start the server:**
   ```bash
   cd website
   python -m http.server 8000
   ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

3. **Try the features:**
   - Toggle dark/light mode with the sun/moon icon
   - Watch the stars twinkle in the background
   - Sign in with Google (if you have the desktop app running)
   - Download the app without signing in

## 🎯 Key Design Decisions

### Why Twinkling Stars?
- Reinforces the "CosmoNaut" space theme
- Creates a lively, dynamic background
- Subtle enough not to distract from content
- More prominent in dark mode for "night sky" effect

### Why Shared Authentication?
- **Seamless user experience** - sign in once, use everywhere
- **Single source of truth** - Firebase manages all auth
- **No duplicate accounts** - same user across platforms
- **Optional for downloads** - users can download without signing in

### Why Accenture-Inspired Design?
- **Enterprise credibility** - professional, trustworthy appearance
- **Clean and modern** - focuses on content, not decoration
- **Accessible** - high contrast, readable typography
- **Scalable** - design system supports future growth

## 🚀 Deployment

### GitHub Pages (Recommended)
```bash
# Create gh-pages branch
git checkout -b gh-pages

# Add website files
git add website/*
git commit -m "feat: add professional website"

# Push to GitHub
git push origin gh-pages
```

Then enable GitHub Pages in your repository settings:
- Settings → Pages
- Source: `gh-pages` branch
- Folder: `/root`
- Your site will be live at: `https://adith1207.github.io/CosmoNaut/website/`

### Custom Domain (Optional)
1. Add a `CNAME` file to the `website/` directory
2. Configure DNS records with your domain provider
3. Enable HTTPS in GitHub Pages settings

## 📊 Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Purple | `#A100FF` | Primary brand color, buttons, accents |
| Accent Cyan | `#00D9FF` | Secondary brand color, gradients |
| Text (Light) | `#000000` | Primary text in light mode |
| Text (Dark) | `#FFFFFF` | Primary text in dark mode |
| Background (Light) | `#FFFFFF` | Main background in light mode |
| Background (Dark) | `#000000` | Main background in dark mode |

## 🔮 Future Enhancements

- [ ] Add blog/news section
- [ ] Integrate with GitHub API for live release notes
- [ ] Add user dashboard (for signed-in users)
- [ ] Implement analytics
- [ ] Add more interactive demos
- [ ] Create video tutorials section
- [ ] Add testimonials/case studies

## 📝 License

Same as the main CosmoNaut project.

---

**Built with ❤️ for the modern enterprise**
