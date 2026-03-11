# Platform Compatibility Guide

## OBD2 Bluetooth Scanning

### ✅ Supported Platforms

| Platform | Browser | Status | Notes |
|----------|---------|--------|-------|
| **Windows Desktop** | Chrome | ✅ Full Support | Recommended |
| **Windows Desktop** | Edge | ✅ Full Support | Recommended |
| **Windows Desktop** | Brave | ✅ Full Support | Works well |
| **Mac Desktop** | Chrome | ✅ Full Support | Recommended |
| **Mac Desktop** | Edge | ✅ Full Support | Works well |
| **Mac Desktop** | Brave | ✅ Full Support | Works well |
| **Android** | Chrome | ✅ Full Support | Best mobile option |
| **Android** | Edge | ✅ Full Support | Works well |

### ❌ Unsupported Platforms

| Platform | Browser | Status | Reason |
|----------|---------|--------|--------|
| **iOS** | Safari | ❌ Not Supported | Apple blocks Web Bluetooth API |
| **iOS** | Chrome | ❌ Not Supported | Uses Safari engine, no Bluetooth |
| **Mac Desktop** | Safari | ❌ Not Supported | Apple doesn't support Web Bluetooth |
| **Any** | Firefox | ❌ Not Supported | Firefox disabled Web Bluetooth |

## Hardware Requirements

### OBD2 Bluetooth Adapter

**Recommended Adapters:**
- **BAFX Products** ELM327 Bluetooth ($22-27 Amazon)
- **BlueDriver** Professional Scan Tool ($99 Amazon)
- **KONNWEI KW902** ELM327 ($18-25 Amazon)
- **Veepeak OBDCheck** BLE+ ($35-40 Amazon)

**Requirements:**
- ✅ Must support Bluetooth 4.0+ (BLE) or Classic Bluetooth
- ✅ Must be ELM327 compatible
- ✅ Must support OBD2 protocols (ISO 9141-2, ISO 14230-4, ISO 15765-4, SAE J1850 PWM, SAE J1850 VPM)

**Where to Buy:**
- Amazon: Search "ELM327 Bluetooth OBD2"
- eBay: Search "OBD2 Bluetooth adapter"
- Local auto parts stores (AutoZone, O'Reilly, etc.)

### Vehicle Requirements

**Compatible Vehicles:**
- ✅ All vehicles sold in USA after 1996
- ✅ All vehicles sold in EU after 2001
- ✅ Most vehicles sold in other markets after 2004

**OBD2 Port Location:**
- Usually under the dashboard, driver's side
- Near the steering column
- Sometimes hidden behind a panel

## Setup Instructions

### Step 1: Install Hardware
1. Locate OBD2 port in your vehicle
2. Plug in ELM327 Bluetooth adapter
3. Turn vehicle ignition to "ON" (engine doesn't need to run)
4. Wait for adapter LED to blink (usually blue)

### Step 2: Open Platform
1. Use a supported browser (Chrome recommended)
2. Navigate to platform URL
3. Login to your account
4. Go to "Diagnostics" section

### Step 3: Connect
1. Click "Bluetooth Scanner" tab
2. Click "Connect to OBD2 Adapter"
3. Browser will show available Bluetooth devices
4. Select your OBD2 adapter (usually starts with "OBD", "ELM327", or "V-Link")
5. Click "Pair"
6. Wait for "Connected" status

### Step 4: Scan
1. Click "Scan DTC Codes"
2. Platform will automatically:
   - Connect to vehicle ECU
   - Read stored diagnostic codes
   - Analyze codes with AI
   - Generate repair recommendations
3. Review results and repair plan

## Troubleshooting

### "Web Bluetooth Not Supported"
**Solution:** Use Chrome, Edge, or Brave browser. Safari and Firefox don't support Web Bluetooth.

### Can't Find OBD2 Adapter
**Solutions:**
1. Make sure adapter is plugged in and vehicle ignition is ON
2. Check adapter LED is blinking (indicates pairing mode)
3. Try unpairing from Bluetooth settings and reconnect
4. Move closer to vehicle (within 10 feet)
5. Restart browser

### Connection Drops During Scan
**Solutions:**
1. Keep device close to vehicle (within 5 feet)
2. Close other Bluetooth connections
3. Restart adapter by unplugging and replugging
4. Clear browser cache and try again

### No DTC Codes Found
**This is good!** It means your vehicle has no stored error codes. The check engine light should be off.

### "Failed to Initialize"
**Solutions:**
1. Make sure vehicle ignition is ON
2. Wait 10 seconds after turning ignition on
3. Try a different OBD2 adapter (yours may be incompatible)
4. Verify adapter is ELM327 compatible

## For Entrepreneurs Licensing This Platform

### What to Tell Your Customers

**Supported Devices:**
"Our platform works on Windows and Mac computers using Chrome or Edge browsers, and on Android phones using Chrome. It does not work on iPhones due to Apple's restrictions."

**Hardware Recommendation:**
"You'll need a Bluetooth OBD2 adapter. We recommend the BAFX Products ELM327 ($25 on Amazon). Just plug it into your car's OBD2 port and connect through our platform."

**Setup Time:**
"5 minutes - plug in adapter, connect via browser, scan. No app installation required."

### Customer Support Scripts

**"Does it work on iPhone?"**
"Unfortunately, no. Apple doesn't allow web apps to use Bluetooth. You can use it on any Android phone, Windows PC, or Mac computer with Chrome or Edge."

**"Do I need to install anything?"**
"No installation needed! Just plug the Bluetooth adapter into your car's OBD2 port and access the platform through your Chrome or Edge browser."

**"What if I don't have the adapter?"**
"You can enter diagnostic codes manually, or purchase a Bluetooth OBD2 adapter for $20-25 on Amazon. Search for 'ELM327 Bluetooth OBD2'."

## Web Bluetooth API Details

### Technology Used
- **Web Bluetooth API** (W3C standard)
- **ELM327 AT Commands** for OBD2 communication
- **ISO 9141-2, ISO 14230-4, ISO 15765-4** protocols
- **Bluetooth Low Energy (BLE)** or Classic Bluetooth

### Security & Privacy
- ✅ All communication is direct (device ↔ adapter)
- ✅ No data sent to third parties
- ✅ User must explicitly grant Bluetooth permission
- ✅ Connection is encrypted via Bluetooth
- ✅ No stored vehicle data without user consent

### Browser Permissions Required
- Bluetooth access (user must approve)
- No microphone, camera, or location required

## Progressive Web App (PWA) Features

The platform works as:
- ✅ Regular website (access from any browser)
- ✅ Installable app (add to home screen)
- ✅ Works offline (after first visit)
- ✅ Automatic updates
- ✅ Push notifications (for inspection reminders)

### Installation Instructions
1. Visit platform URL in Chrome or Edge
2. Look for "Install" button in address bar
3. Click "Install" → Platform works like a native app
4. Access from desktop or app drawer

## Future Roadmap

**Planned Features:**
- 🔜 iOS support via native app (App Store)
- 🔜 Live data streaming (RPM, speed, temp)
- 🔜 Freeze frame data capture
- 🔜 Emissions readiness status
- 🔜 Fuel trim analysis
- 🔜 O2 sensor monitoring

**Current Features:**
- ✅ DTC code reading
- ✅ AI-powered analysis
- ✅ Repair recommendations
- ✅ Code clearing
- ✅ Connection diagnostics

---

## Support

**For Technical Issues:**
- Check browser compatibility first
- Verify hardware is ELM327 compatible
- Try different adapter if connection fails

**For Licensing/Business Questions:**
- Contact: elite@aiautopro.com
- Documentation: /DEPLOYMENT.md
- Sales: See INSPECTOR_SALES_PLAYBOOK.md
