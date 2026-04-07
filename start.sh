#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║   🚀 AgendaPro - Sistema de Agendamento                ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Verifica se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18+."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo ""

# Instala dependências do backend se não existirem
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependências do backend..."
    cd backend
    npm install
    cd ..
fi

# Inicializa o banco de dados se não existir
if [ ! -f "backend/database.sqlite" ]; then
    echo "🗄️  Inicializando banco de dados..."
    cd backend
    npm run init-db
    cd ..
fi

# Inicia o backend em background
echo "🚀 Iniciando backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo "⏳ Aguardando backend iniciar..."
sleep 3

# Inicia o frontend
echo "🎨 Iniciando frontend..."
npm run dev

# Quando o frontend for encerrado, mata o backend também
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM EXIT
