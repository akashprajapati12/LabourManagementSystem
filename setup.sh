#!/bin/bash

# Setup script for Labour Management System

echo "🚀 Setting up Labour Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v14 or higher) first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update the values in .env file"
else
    echo "✅ .env file already exists"
fi

# Create backups directory
mkdir -p backups
echo "📁 Created backups directory"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "   npm start"
echo ""
echo "The application will be available at http://localhost:5000"
echo ""
echo "For production deployment, see DEPLOYMENT.md"