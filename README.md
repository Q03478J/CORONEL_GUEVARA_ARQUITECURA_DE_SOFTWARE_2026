# PORTAFOLIO CORONEL GUEVARA - Arquitectura de Software

> Plataforma educativa moderna para el curso de Arquitectura de Software

## 🚀 Características

### Sistema de Usuarios y Autenticación ⭐ NUEVO

- **Autenticación Real**: Integración completa con Supabase Authentication
- **Roles de Usuario**: Sistema de roles (Administrador y Estudiante)
- **Dashboard Administrador**: Gestión completa de estudiantes, asignaciones y configuración
- **Dashboard Estudiante**: Vista personalizada de progreso, asignaciones y entregas
- **Seguridad RLS**: Row Level Security para protección de datos

### Características Principales

- **Diseño Moderno**: Interfaz premium con glassmorphism, gradientes y animaciones
- **Modo Oscuro**: Soporte completo para tema claro y oscuro
- **Responsive Design**: Optimizado para dispositivos móviles, tablets y escritorio
- **Sistema de Progreso**: Cálculo backend-driven preciso (100% exacto)
- **Carga de Archivos**: Integración con Supabase Storage con tracking de usuarios
- **EDW Bot Mejorado**: Asistente virtual con 30+ respuestas sobre el curso
- **Navegación Intuitiva**: Breadcrumbs y menú móvil optimizado
- **Accesibilidad**: ARIA labels y navegación por teclado

## 📚 Estructura del Curso

El curso está dividido en 4 unidades:

1. **UNIDAD I**: Fundamentos de Arquitectura de Software
2. **UNIDAD II**: Patrones y Estilos Arquitectónicos
3. **UNIDAD III**: Diseño y Modelado de Arquitecturas
4. **UNIDAD IV**: Evaluación y Optimización

Cada unidad contiene 4 semanas de contenido con material descargable y espacio para subir tareas.

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Variables CSS, Grid, Flexbox, Animaciones
- **JavaScript (Vanilla)**: Sin frameworks, código limpio y modular
- **Supabase**: Backend completo
  - Authentication (usuarios y roles)
  - Database (PostgreSQL con RLS)
  - Storage (archivos de estudiantes)
  - Realtime (sincronización automática)
- **Google Fonts**: Inter y Poppins

## 📦 Instalación

1. Clona este repositorio:

```bash
git clone [https://github.com/TU_USUARIO/PORTAFOLIO_ERY_CURSOS.git](https://q03478j.github.io/CORONEL_GUEVARA_ARQUITECURA_DE_SOFTWARE_2026/index.html)](https://q03478j.github.io/CORONEL_GUEVARA_ARQUITECURA_DE_SOFTWARE_2026/pages/unidad1.html)
cd PORTAFOLIO_CORONEL_GUEVARA
```

1. Configura Supabase (opcional pero recomendado):
   - Crea una cuenta en [Supabase](https://supabase.com)
   - Crea un nuevo proyecto
   - Crea un bucket llamado `course-uploads` en Storage
   - Copia tus credenciales (URL y Anon Key)
   - Actualiza las meta tags en cada archivo HTML:

   ```html
   <meta name="supabase-url" content="TU_SUPABASE_URL">
   <meta name="supabase-key" content="TU_SUPABASE_ANON_KEY">
   ```

2. Abre `index.html` en tu navegador o usa un servidor local:

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (npx)
npx serve

# Con VS Code Live Server
# Instala la extensión Live Server y haz clic derecho > "Open with Live Server"
```

## 🌐 Despliegue en GitHub Pages

1. Sube el código a GitHub:

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

1. Ve a Settings > Pages en tu repositorio
2. Selecciona la rama `main` y carpeta `/root`
3. Haz clic en "Save"
4. Tu sitio estará disponible en `[https://TU_USUARIO.github.io/PORTAFOLIO_ERY_CURSOS/](https://q03478j.github.io/CORONEL_GUEVARA_ARQUITECURA_DE_SOFTWARE_2026/pages/unidad1.html)`

## ⚙️ Configuración de Supabase (REQUERIDO)

### Paso 1: Configuración Inicial

Este proyecto requiere Supabase configurado. Sigue estos pasos:

1. **Ejecutar SQL Schema**:
   - Ve a tu proyecto Supabase → SQL Editor
   - Abre el archivo `supabase_complete_schema.sql`
   - Copia y pega todo el contenido
   - Haz clic en RUN

2. **Crear Usuarios**:

   **Administrador**:

   ```
   Email: dobleeimportaciones@gmail.com
   Password: [tu contraseña segura]
   ```

   **Estudiante Inicial**:

   ```
   Email: cordedwinegsep@gmail.com
   Password: [tu contraseña]
   ```

3. **Vincular Usuarios** (ver `INSTRUCCIONES_SUPABASE_RAPIDO.md` para detalles)

4. **Configurar Storage**:
   - Crear bucket `course-uploads` (público)
   - Configurar políticas de acceso

### Paso 2: Credenciales

Las credenciales ya están configuradas en los archivos HTML:

- URL: `https://ziawcvjvfpvudzkmtkba.supabase.co`
- Anon Key: (ya incluida)

### Documentación Completa

📘 **Guía Detallada**: Ver `SUPABASE_SETUP_GUIDE.md`  
📗 **Guía Rápida**: Ver `INSTRUCCIONES_SUPABASE_RAPIDO.md`

## 📱 Características del Sistema

### Sistema de Autenticación 🔐

- **Login Real**: Autenticación con Supabase Auth
- **Roles**: Administrador, Estudiante, Evaluador y Asistente
- **Sesiones**: Persistencia automática
- **Seguridad**: Row Level Security (RLS)
- **Redirección**: Automática según rol

### Dashboard Administrador 👨‍💼

- **Gestión Completa de Usuarios**: Crear, editar, desactivar usuarios (todos los roles)
- **Estadísticas**: Total estudiantes, progreso promedio, entregas, archivos
- **Gestión de Fechas Límite**: Establecer deadlines para las 16 asignaciones
- **Sistema de Calificaciones**: Calificar entregas (0-20) con feedback
- **Sistema de Notificaciones**: Envío masivo por rol con tipos
- **Configuración**: Tamaño de archivos, entregas tardías
- **Vista Global**: Progreso de todos los estudiantes
- **Exportación**: Calificaciones a CSV

### Dashboard Evaluador 📝

- **Calificación de Tareas**: Calificar entregas pendientes
- **Estadísticas**: Tareas calificadas, pendientes, promedio general
- **Vista de Estudiantes**: Lista completa (solo lectura)
- **Filtros**: Por unidad y estado
- **Exportación**: Calificaciones a CSV

### Dashboard Asistente 🤝

- **Gestión de Estudiantes**: Crear nuevos estudiantes
- **Gestión de Fechas**: Establecer/editar fechas límite
- **Estadísticas**: Estudiantes activos, asignaciones, fechas próximas
- **Vista de Asignaciones**: Con estados visuales

### Dashboard Estudiante 👨‍🎓

- **Mi Progreso**: Vista personal con % exacto por unidad
- **Mis Asignaciones**: Lista completa con estados y fechas
- **Historial**: Últimas 10 entregas con timestamps
- **Acceso Rápido**: Links directos a cada unidad

### Sistema de Progreso Backend-Driven 📊

- **Cálculo Real**: Desde base de datos con funciones SQL
- **Fórmula**: (completed_items / total_items) * 100
- **Precisión**: Llega exactamente al 100%
- **Sincronización**: Actualización automática
- **Fallback**: localStorage cuando no hay conexión

### Sistema de Carga de Archivos 📁

- **Drag & Drop**: Arrastra archivos para subir
- **Validación**: Tamaño (10MB default, configurable hasta 50MB)
- **Tipos permitidos**: PDF, Word, PowerPoint, imágenes, ZIP
- **Tracking**: Usuario, fecha, hora de cada upload
- **Storage**: Supabase Storage con estructura organizada
- **Estados**: Pendiente, Entregado, Completado, Bloqueado

### EDW Bot Asistente Virtual 🤖

- **30+ Respuestas**: Info de curso, tareas, fechas, progreso
- **Ayuda Contextual**: Según rol de usuario
- **FAQs**: Preguntas frecuentes respondidas
- **Soporte**: Contactos y troubleshooting

## 🎨 Personalización

### Colores

Edita las variables CSS en `css/styles.css`:

```css
:root {
    --color-primary: hsl(250, 84%, 54%);
    --color-secondary: hsl(340, 82%, 52%);
    --color-accent: hsl(170, 77%, 46%);
    /* ... más colores */
}
```

### Fuentes

Cambia las fuentes en `css/styles.css`:

```css
:root {
    --font-primary: 'Inter', sans-serif;
    --font-display: 'Poppins', sans-serif;
}
```

## 📄 Estructura de Archivos

```
PORTAFOLIO_ERY_CURSOS/
├── index.html                          # Página principal
├── courses.html                        # Vista general del curso
├── login.html                          # Login con Supabase Auth
├── dashboard-admin.html                # Dashboard administrador ⭐ MEJORADO
├── dashboard-evaluator.html            # Dashboard evaluador ⭐ NUEVO
├── dashboard-assistant.html            # Dashboard asistente ⭐ NUEVO
├── dashboard-student.html              # Dashboard estudiante
├── unidad1.html                        # Unidad I
├── unidad2.html                        # Unidad II
├── unidad3.html                        # Unidad III
├── unidad4.html                        # Unidad IV
├── contact.html                        # Página de contacto
├── css/
│   ├── styles.css                      # Estilos principales
│   ├── components.css                  # Componentes reutilizables
│   ├── animations.css                  # Animaciones
│   ├── chatbox.css                     # Estilos del chatbot
│   ├── fileViewer.css                  # Visor de archivos
│   └── trophy.css                      # Celebración de trofeos
├── js/
│   ├── main.js                         # JavaScript principal
│   ├── auth.js                         # Sistema de autenticación ⭐ ACTUALIZADO
│   ├── progress.js                     # Sistema de progreso (backend-driven)
│   ├── fileUpload.js                   # Sistema de carga de archivos
│   ├── fileViewer.js                   # Visor de archivos
│   ├── chatbox.js                      # EDW Bot
│   ├── admin-users.js                  # Gestión de usuarios ⭐ NUEVO
│   ├── admin-assignments.js            # Gestión de asignaciones ⭐ NUEVO
│   ├── grading.js                      # Sistema de calificaciones ⭐ NUEVO
│   ├── notifications.js                # Sistema de notificaciones ⭐ NUEVO
│   └── dashboard-admin.js              # Script principal admin ⭐ NUEVO
├── images/
│   ├── upla.png                        # Logo UPLA
│   └── ed.jpg                          # Avatar EDW Bot
├── supabase_complete_schema.sql        # Schema completo de BD ⭐ ACTUALIZADO
├── SUPABASE_SETUP_GUIDE.md             # Guía detallada Supabase
├── INSTRUCCIONES_SUPABASE_RAPIDO.md    # Guía rápida paso a paso
├── SUPABASE_CONFIG.md                  # Configuración Storage
├── README.md                           # Este archivo ⭐ ACTUALIZADO
└── .gitignore                          # Archivos ignorados por Git
```

## 👤 Autor

**Coronel Guevara**

- Email: <q03478j@upla.edu.pe>
- Teléfono: +51 927 125 942

## 📝 Licencia

© 2026 Coronel Guevara Jack Yhems. Todos los derechos reservados.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🐛 Reportar Bugs

Si encuentras algún bug, por favor crea un issue en GitHub con:

- Descripción del problema
- Pasos para reproducirlo
- Comportamiento esperado vs actual
- Screenshots (si aplica)

## 📞 Soporte

Para soporte, contacta a <q03478j@upla.edu.pe>

---

**Nota**: Este proyecto fue creado como portafolio educativo para el curso de Arquitectura de Software. La integración con Supabase es opcional y el sistema funciona completamente con localStorage si no se configura.
