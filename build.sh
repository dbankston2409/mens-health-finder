#!/bin/bash
# Build script for Render deployment

# Install dependencies at the root level
npm install

# Navigate to web app directory
cd apps/web

# Install web app dependencies
npm install

# Build web app
npm run build

# Start the web app
npm run start