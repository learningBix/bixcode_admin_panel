#!/bin/bash

echo "🚀 Setting up BixCode Admin Panel..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Go back to root
cd ..

echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Start MongoDB: mongod"
echo "2. Copy backend/.env.example to backend/.env and configure"
echo "3. Copy frontend/.env.example to frontend/.env and configure"
echo "4. Run: npm run dev (starts both frontend and backend)"
echo ""
echo "📱 Access points:"
echo "- Admin Panel: http://localhost:3001"
echo "- Admin API: http://localhost:5001"
echo ""
echo "🎉 Happy coding!"
