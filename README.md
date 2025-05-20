# Sistema de Gestión de Hojas de Vida Estudiantiles

Este sistema permite la gestión automatizada de hojas de vida estudiantiles y su visualización por parte de empresas.

## Características Principales

- Generación automática de hojas de vida en PDF
- Sistema de autenticación para empresas
- Filtrado de perfiles por carrera, promedio y experiencia
- Actualización en tiempo real de información académica
- Sistema de validación y verificación de datos
- Protección de datos y cumplimiento de normativas de privacidad

## Requisitos Técnicos

- Node.js >= 14.x
- MongoDB >= 4.x
- React >= 18.x
- Express >= 4.x

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   yarn add react-router-dom react-redux @reduxjs/toolkit axios @mui/material @emotion/react @emotion/styled @mui/icons-material
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Estructura del Proyecto

```
/
├── client/             # Frontend React
├── server/             # Backend Node.js/Express
├── docs/              # Documentación
└── tests/             # Pruebas
```

## Seguridad

- Autenticación de dos factores (2FA)
- Cifrado de extremo a extremo
- Protección contra ataques comunes
- Cumplimiento con normativas de privacidad

## Licencia

MIT 
