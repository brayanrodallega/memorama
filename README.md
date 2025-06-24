# 🧠 Memorama - Juego de Memoria

Una aplicación web moderna de juego de memoria (Memorama) desarrollada con Angular 19 que incluye autenticación, múltiples niveles de dificultad, estadísticas y ranking de jugadores.

![Angular](https://img.shields.io/badge/Angular-19.2-red?style=for-the-badge&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![SCSS](https://img.shields.io/badge/SCSS-Latest-pink?style=for-the-badge&logo=sass)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Características

### 🎮 Modos de Juego
- **Un Jugador**: Juega contra el tiempo con límites por nivel
- **Multijugador**: Compite contra otro jugador en tiempo real

### 🏆 Niveles de Dificultad
- **Principiante**: 8 cartas, 60 segundos
- **Intermedio**: 16 cartas, 90 segundos  
- **Avanzado**: 24 cartas, 120 segundos
- **Experto**: 32 cartas, 150 segundos

### 📊 Sistema de Estadísticas
- Historial de partidas jugadas
- Tiempo promedio por partida
- Tasa de victoria
- Puntuación y ranking global

### 🔐 Autenticación
- Registro e inicio de sesión de usuarios
- Protección de rutas con guards
- Gestión de sesiones

### 🎨 Interfaz Moderna
- Diseño responsive y accesible
- Animaciones fluidas
- Tema moderno con gradientes y efectos

## 🚀 Demo en Vivo

- **GitHub Pages**: [https://brayanrodallega.github.io/memorama/](https://brayanrodallega.github.io/memorama/)

## 📋 Requisitos

- **Node.js**: 18.x o superior
- **npm**: 9.x o superior
- **Angular CLI**: 19.x

## 🛠️ Instalación

### Clonar el repositorio
```bash
git clone https://github.com/brayanrodallega/memorama.git
cd memorama
```

### Instalar dependencias
```bash
npm install
```

### Ejecutar en desarrollo
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200/`

### Ejecutar con SSR (Server-Side Rendering)
```bash
npm run build
npm run serve:ssr:memorama
```

## 📖 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run build` | Construye la aplicación para producción |
| `npm run watch` | Construye en modo desarrollo con watch |
| `npm test` | Ejecuta las pruebas unitarias |
| `npm run serve:ssr:memorama` | Sirve la aplicación con SSR |

## 🏗️ Arquitectura

### Estructura del Proyecto
```
src/
├── app/
│   ├── components/          # Componentes de la aplicación
│   │   ├── auth/           # Autenticación (login, register)
│   │   ├── dashboard/      # Panel principal
│   │   ├── game/           # Componentes del juego
│   │   ├── ranking/        # Ranking de jugadores
│   │   ├── stats/          # Estadísticas
│   │   └── pagination/     # Componente de paginación
│   ├── guards/             # Guards de autenticación
│   ├── models/             # Modelos de datos
│   ├── services/           # Servicios de la aplicación
│   └── app.config.ts       # Configuración principal
├── styles.scss             # Estilos globales
└── index.html              # Página principal
```

### Servicios Principales
- **AuthService**: Gestión de autenticación y usuarios
- **MemoramaService**: Lógica del juego y gestión de partidas
- **ApiService**: Comunicación con APIs externas
- **StatsService**: Manejo de estadísticas y puntuaciones
- **PaginationService**: Utilidad para paginación

### Componentes Principales
- **GameBoardComponent**: Tablero principal del juego
- **GameSetupComponent**: Configuración de partidas
- **DashboardComponent**: Panel de control del usuario
- **RankingComponent**: Tabla de clasificación
- **StatsComponent**: Visualización de estadísticas

## 🚀 Despliegue

### GitHub Pages
```bash
# Se despliega automáticamente al hacer push a main
git push origin main
```

### Docker
```bash
# Construir imagen
docker build -t memorama .

# Ejecutar contenedor
docker run -p 4000:4000 memorama
```

### Netlify
1. Conecta tu repositorio en [Netlify](https://netlify.com)
2. Configura los secrets en GitHub Actions
3. El despliegue es automático

### Vercel
1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta `vercel` en el proyecto
3. Configura los secrets para despliegue automático

## 🔧 Configuración de Entorno

### Variables de Entorno (Opcional)
```env
# API Configuration
API_BASE_URL=https://api.ejemplo.com
API_KEY=tu_api_key_aqui

# Game Configuration
DEFAULT_TIME_LIMIT=60
MAX_PLAYERS=2
```

### Configuración de GitHub Actions
Los workflows están configurados automáticamente en `.github/workflows/`:
- `deploy.yml`: Despliegue completo con múltiples opciones
- `github-pages-simple.yml`: Despliegue simplificado a GitHub Pages

## 🧪 Testing

### Ejecutar Tests
```bash
# Tests unitarios
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Tecnologías de Testing
- **Jasmine**: Framework de testing
- **Karma**: Test runner
- **Angular Testing Utilities**: Herramientas específicas de Angular

## 🤝 Contribución

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agrega nueva característica'`)
4. Push a la branch (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Angular 19, TypeScript 5.7, SCSS
- **Backend**: Node.js, Express (para SSR)
- **Testing**: Jasmine, Karma
- **Build**: Angular CLI, Webpack
- **Deploy**: GitHub Actions, Docker, Netlify, Vercel
- **Styling**: SCSS, CSS Grid, Flexbox
- **Icons**: Emojis nativos y Font Awesome

## 📞 Contacto

- **Autor**: Brayan Rodallega
- **Email**: thebrayan1a1@gmail.com
- **GitHub**: [@brayanrodallega](https://github.com/brayanrodallega)
- **LinkedIn**: [Tu Perfil](https://linkedin.com/in/brayanrodallega)


---

⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐
