# Biometric Authentication Guide

## Overview
Version 1.2.0 introduces biometric authentication (fingerprint and face recognition) for the PWA app, allowing users to login quickly and securely using their device's biometric sensors.

## Features

### Supported Biometric Methods
- **Fingerprint**: Touch ID (iOS), Fingerprint sensor (Android)
- **Face Recognition**: Face ID (iOS), Face Unlock (Android)
- **Other**: Any platform authenticator supported by WebAuthn

### How It Works
The system uses the Web Authentication API (WebAuthn) which is a W3C standard for secure authentication. This provides:
- **Security**: Biometric data never leaves the device
- **Privacy**: No biometric data is stored on servers
- **Convenience**: One-touch login without typing passwords

## User Experience

### First Time Setup

1. **Login with Email/Password**: User logs in normally
2. **Enable Biometric Prompt**: After successful login, a toast notification appears:
   - "Enable fingerprint/face login for faster access"
   - User can click "Enable" or dismiss
3. **Biometric Registration**: 
   - Device prompts for fingerprint/face scan
   - Credentials are securely stored locally
4. **Ready to Use**: Next time, user can login with biometric

### Subsequent Logins

1. **Biometric Button**: Login page shows "Login with Fingerprint/Face" button
2. **One-Touch Login**: User clicks button → scans fingerprint/face → logged in
3. **Fallback**: Email/password login still available

## Technical Details

### Browser Support
- **Chrome/Edge**: Android 7+, Windows 10+ with Windows Hello
- **Safari**: iOS 14+, macOS with Touch ID
- **Firefox**: Android 8+, Windows 10+

### Requirements
- **HTTPS**: Biometric auth only works on HTTPS (or localhost for testing)
- **PWA**: Works in both browser and installed PWA
- **Device**: Must have biometric hardware (fingerprint sensor, face camera)

### Security

#### What's Stored
- **LocalStorage**: 
  - Credential ID (public identifier)
  - Encrypted email/password (for auto-login)
  - Public key reference

#### What's NOT Stored
- Biometric data (stays on device)
- Raw passwords (encrypted before storage)
- Server-side biometric information

#### Security Measures
- Credentials are device-specific
- Biometric verification required for each login
- User can disable anytime
- Automatic cleanup on logout

## Mobile Photo Handling Improvements

### Fixed Issues
1. **Photo Upload**: Better file handling on mobile browsers
2. **Camera Access**: Improved camera permissions and initialization
3. **Image Loading**: Force complete image load before processing
4. **Cache Clearing**: Proper cleanup of file inputs

### Mobile-Specific Enhancements
- `playsinline` attribute for iOS video
- `webkit-playsinline` for older iOS versions
- Better error handling for camera permissions
- Optimized constraints for mobile cameras
- Automatic fallback to simpler camera settings

### Camera Features
- **Front/Back Camera**: Switch between cameras
- **Auto-focus**: Better focus on mobile
- **Resolution**: Optimized for mobile (1280x720 ideal, up to 1920x1080)
- **Orientation**: Proper handling of device rotation

## Testing Biometric Auth

### On Mobile Device (Recommended)

1. **Deploy to HTTPS**: Push to Vercel (automatic HTTPS)
2. **Open in Browser**: Visit the deployed URL
3. **Install PWA**: Click "Install Mobile App" button
4. **Login**: Use email/password first time
5. **Enable Biometric**: Click "Enable" when prompted
6. **Test**: Logout and login with biometric

### On Desktop (Limited)

- **Windows 10+**: Works with Windows Hello (fingerprint/face)
- **macOS**: Works with Touch ID on supported Macs
- **Linux**: Limited support, depends on hardware

### Testing Checklist

- [ ] Biometric button appears after enabling
- [ ] Fingerprint/face prompt shows on click
- [ ] Login succeeds after biometric verification
- [ ] Fallback to email/password works
- [ ] Biometric persists after app restart
- [ ] Logout clears biometric session

## User Guide

### How to Enable Biometric Login

1. Login with your email and password
2. Look for the notification: "Enable fingerprint/face login"
3. Click "Enable" button
4. Follow your device's biometric prompt
5. Done! Next time use the biometric button

### How to Disable Biometric Login

1. Go to Profile/Settings
2. Find "Biometric Authentication" section
3. Click "Disable Biometric Login"
4. Confirm the action

### Troubleshooting

**"Biometric authentication not available"**
- Check if your device has fingerprint/face sensor
- Ensure biometric is set up in device settings
- Try using HTTPS (not HTTP)

**"Biometric authentication failed"**
- Try again with better finger/face positioning
- Check if biometric sensor is clean
- Re-register biometric if issue persists

**"No biometric credential found"**
- You need to enable biometric first
- Login with email/password and enable it

## Future Enhancements

- [ ] Server-side credential verification
- [ ] Multiple device support
- [ ] Biometric re-authentication for sensitive actions
- [ ] Admin portal biometric support
- [ ] Biometric for staff login

## Version History

- **v1.2.0** (2026-02-20): Initial biometric authentication release
  - Fingerprint/face login support
  - Mobile photo handling improvements
  - Camera enhancements for mobile devices
