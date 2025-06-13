# Outdial Widget

A WebEx Contact Center widget for making outbound calls with secure API integration.

## Overview

This widget provides a user-friendly interface for agents to initiate outbound calls through WebEx Contact Center with built-in validation and notification features.

## Features

- **Outbound Calling**: Make calls directly from the WebEx Contact Center interface
- **API Integration**: Pre-call validation and post-call notifications
- **Dark Mode Support**: Automatic theme switching
- **Real-time Logging**: Activity logs with timestamps
- **Input Validation**: Phone number and parameter validation
- **Event Handling**: Monitors call states and agent contact events

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Build Commands

- **Development build with watch**: `npm run dev`
- **Production build**: `npm run build`
- **Start local server**: `npm run start`

### Project Structure

```
src/
├── pause-resume-recording-widget.js    # Main widget implementation
└── desktop-layout-with-recording-widget.json    # Widget layout configuration
```

## Configuration

### API Endpoints

Update the following placeholder URLs in the widget code:

- Pre-outdial validation: `https://api.example.com/validate-outdial`
- Post-outdial notification: `https://api.example.com/outdial-notification`

### Authentication

Replace the placeholder API token:
```javascript
'Authorization': 'Bearer YOUR_API_TOKEN'
```

### WebEx Configuration

The widget is configured with:
- Entry Point ID: `4610c21f-3968-4835-b3b8-a9422c1771a9`
- Origin Number: `+14697502984`

## Usage

1. Enter a phone number in the format `+1234567890`
2. Add any required API parameters
3. Click "Outdial" to initiate the call
4. Monitor the activity logs for call status

## Widget Integration

Add the widget to your WebEx Contact Center desktop layout using the provided JSON configuration file.

## Dependencies

- **@wxcc-desktop/sdk**: WebEx Contact Center Desktop SDK
- **Webpack**: Build system
- **Babel**: JavaScript transpilation

## License

ISC License