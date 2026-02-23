@echo off
title Labour Management System Setup

echo 🚀 Setting up Labour Management System...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js (v14 or higher) first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm found

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if .env file exists
if not exist ".env" (
    echo 📋 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created. Please update the values in .env file
) else (
    echo ✅ .env file already exists
)

REM Create backups directory
if not exist "backups" mkdir backups
echo 📁 Created backups directory

echo.
echo 🎉 Setup complete!
echo.
echo To start the application:
echo    npm start
echo.
echo The application will be available at http://localhost:5000
echo.
echo For production deployment, see DEPLOYMENT.md
echo.
pause