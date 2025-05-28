#!/bin/bash

echo "🚀 Starting Men's Health Finder Local Development"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the MHF root directory"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ Created .env.local - edit this file with your API keys"
fi

echo ""
echo "🔧 Available commands:"
echo "1. Web App (Frontend): npm run dev:web"
echo "2. Worker System: npm run run:worker"
echo "3. Both: Run in separate terminals"
echo ""

# Ask user what to start
read -p "What would you like to start? (1/2/3): " choice

case $choice in
    1)
        echo "🌐 Starting Web Application..."
        npm run dev:web
        ;;
    2)
        echo "⚙️ Starting Worker System..."
        npm run run:worker
        ;;
    3)
        echo "🚀 Starting both systems..."
        echo "Opening new terminal for worker..."
        osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run run:worker"'
        echo "🌐 Starting Web Application in this terminal..."
        npm run dev:web
        ;;
    *)
        echo "❌ Invalid choice. Please run script again and choose 1, 2, or 3."
        exit 1
        ;;
esac