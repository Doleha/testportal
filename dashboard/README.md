# SPA Dashboard Implementation Guide

This document provides an overview of the Single Page Application (SPA) dashboard implementation for the Student Testing Portal.

## Overview

The SPA Dashboard is a modern, interactive interface that allows students to:
- Take tests with a timer and save progress
- View performance reports with visualizations
- Manage account settings
- Navigate seamlessly between different sections

## Files Included

- `index.html` - Main HTML file with all sections and structure
- `spa_dashboard.js` - Combined JavaScript with all functionality
- `spa_dashboard.css` - Custom CSS styles for the dashboard

## Features

### Dynamic View Routing
- Seamless navigation between different sections
- State persistence across page reloads
- Active tab highlighting

### Test Taking Experience
- Interactive question display
- Timer with visual feedback
- Progress tracking
- Answer saving to localStorage
- Resume capability for interrupted tests

### Performance Reports
- Visual representation of scores
- Subject-specific performance metrics
- Recent tests history
- Areas for improvement

### Settings Management
- View and update academic settings
- Theme customization
- Accessibility options

## Integration with Backend

The dashboard is designed to work with the existing n8n workflow system:

1. All API calls use the `/webhook/frontend` endpoint
2. Actions are specified in the request body (e.g., `start_test`, `view_report`)
3. User authentication is maintained via localStorage

## Demo Mode

For demonstration purposes, the current implementation includes:
- Sample questions for testing
- Simulated API responses
- Realistic delays to simulate server communication

In a production environment, you would:
1. Uncomment the fetch API code blocks
2. Remove the setTimeout simulation code
3. Ensure the backend API endpoints match the expected actions

## Customization

The dashboard can be easily customized:
- Modify the CSS to match your branding
- Add or remove sections as needed
- Adjust the timer duration for tests
- Change the available subjects and grade levels

## Browser Compatibility

The dashboard is compatible with:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Deployment

To deploy the dashboard:
1. Upload all files to your web server
2. Ensure the n8n workflow is properly configured
3. Update the API endpoint URLs if necessary
4. Test all functionality in your production environment

## Security Considerations

- User authentication is handled via localStorage tokens
- All API calls should be made over HTTPS
- Consider implementing CSRF protection for production use
