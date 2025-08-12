@echo off
echo 🚀 Starting Blockchain Explorer...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm run install:all
)

REM Build shared package
echo 🔨 Building shared package...
cd shared
call npm run build
cd ..

REM Start development servers
echo 🌐 Starting development servers...
call npm run dev

pause
