#!/data/data/com.termux/files/usr/bin/bash

# Colores para los mensajes
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ACTUALIZADOR NEYZOR BOT     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════╝${NC}"

# Verificar si estamos en el directorio del bot
if [ ! -f "index.js" ] && [ ! -f "package.json" ]; then
    echo -e "${RED}[ERROR]${NC} No estás en el directorio del bot."
    echo "Navega al directorio donde está index.js y ejecuta:"
    echo "bash termux.sh"
    exit 1
fi

echo -e "${YELLOW}[1/5]${NC} Haciendo backup de configuración..."
if [ -f "config.js" ]; then
    cp config.js config.js.backup
    echo -e "  ${GREEN}✓${NC} Backup creado: config.js.backup"
fi

if [ -d "sessions" ]; then
    echo -e "  ${GREEN}✓${NC} Sesiones preservadas"
fi

echo -e "${YELLOW}[2/5]${NC} Actualizando código desde GitHub..."
git pull origin main

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Código actualizado"
else
    echo -e "  ${RED}✗${NC} Error al actualizar"
    echo "  Intenta manualmente: git pull https://github.com/Fer280809/Neyzor.git"
    exit 1
fi

echo -e "${YELLOW}[3/5]${NC} Actualizando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Dependencias actualizadas"
else
    echo -e "  ${RED}✗${NC} Error con npm install"
    exit 1
fi

echo -e "${YELLOW}[4/5]${NC} Verificando estructura..."
# Verificar cambios importantes en package.json
if grep -q "canvas" package.json; then
    echo -e "  ${GREEN}✓${NC} @napi-rs/canvas presente"
fi

echo -e "${YELLOW}[5/5]${NC} Limpieza de caché..."
npm cache clean --force 2>/dev/null
echo -e "  ${GREEN}✓${NC} Caché limpiada"

echo -e "\n${GREEN}[COMPLETADO]${NC} Bot actualizado exitosamente!"
echo -e "\n${BLUE}Opciones:${NC}"
echo "  1. Iniciar bot ahora: ${YELLOW}npm start${NC}"
echo "  2. Ver cambios: ${YELLOW}git log --oneline -5${NC}"
echo "  3. Estado actual: ${YELLOW}git status${NC}"
echo -e "\n${YELLOW}Nota:${NC} Si hay errores, restaura:"
echo "  cp config.js.backup config.js"

# Dar permisos de ejecución si no los tiene
chmod +x termux.sh 2>/dev/null