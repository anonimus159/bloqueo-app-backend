import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.pdfgen import canvas

# ─────────────────────────────────────────────────────────────────────────────
# Canvas con numeración de páginas y cabecera/pie de página
# ─────────────────────────────────────────────────────────────────────────────
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        if self._pageNumber == 1:
            self.restoreState()
            return

        # Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0f172a"))
        self.drawString(54, 750, "FINCONTROL — DOCUMENTACIÓN TÉCNICA DEL SISTEMA WEB")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 742, letter[0] - 54, 742)

        # Footer
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawRightString(letter[0] - 54, 40, f"Página {self._pageNumber} de {page_count}")
        self.drawString(54, 40, "Confidencial — CodeCraft Programming Forge  |  Junio 2026")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.line(54, 52, letter[0] - 54, 52)
        self.restoreState()


def draw_cover_bg(c, doc):
    c.saveState()
    # Fondo degradado oscuro
    c.setFillColor(colors.HexColor("#0f172a"))
    c.rect(0, 0, letter[0], letter[1], fill=True, stroke=False)
    # Franja de acento
    c.setFillColor(colors.HexColor("#6366f1"))
    c.rect(0, 0, letter[0], 8, fill=True, stroke=False)
    c.restoreState()


# ─────────────────────────────────────────────────────────────────────────────
# Estilos personalizados
# ─────────────────────────────────────────────────────────────────────────────
def build_styles():
    styles = getSampleStyleSheet()
    DARK  = colors.HexColor("#0f172a")
    BLUE  = colors.HexColor("#6366f1")
    BODY  = colors.HexColor("#334155")
    MUTED = colors.HexColor("#64748b")

    add = styles.add

    add(ParagraphStyle('CoverTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=26, leading=32,
        textColor=colors.white, spaceAfter=14, alignment=1))

    add(ParagraphStyle('CoverSub', parent=styles['Normal'],
        fontName='Helvetica', fontSize=13, leading=18,
        textColor=colors.HexColor("#cbd5e1"), spaceAfter=8, alignment=1))

    add(ParagraphStyle('CoverMeta', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9, leading=14,
        textColor=colors.HexColor("#94a3b8"), alignment=1))

    add(ParagraphStyle('CoverBadge', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9, leading=14,
        textColor=colors.HexColor("#6366f1"), alignment=1))

    add(ParagraphStyle('MyH1', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=17, leading=22,
        textColor=DARK, spaceBefore=18, spaceAfter=10, keepWithNext=True))

    add(ParagraphStyle('MyH2', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=12, leading=16,
        textColor=colors.HexColor("#2563eb"), spaceBefore=10, spaceAfter=6, keepWithNext=True))

    add(ParagraphStyle('MyBody', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, leading=15,
        textColor=BODY, spaceAfter=8))

    add(ParagraphStyle('MyBullet', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, leading=15,
        textColor=BODY, leftIndent=16, firstLineIndent=-12, spaceAfter=5))

    add(ParagraphStyle('MyCode', parent=styles['Normal'],
        fontName='Courier', fontSize=9, leading=13,
        textColor=colors.HexColor("#1e293b"), backColor=colors.HexColor("#f1f5f9"),
        leftIndent=8, rightIndent=8, spaceAfter=6, spaceBefore=4))

    add(ParagraphStyle('MyCaption', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8, leading=12,
        textColor=MUTED, spaceAfter=4, alignment=1))

    add(ParagraphStyle('MyLabel', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9, leading=13,
        textColor=BLUE, spaceAfter=4))

    return styles


# ─────────────────────────────────────────────────────────────────────────────
# Tablas helper
# ─────────────────────────────────────────────────────────────────────────────
HEADER_BG = colors.HexColor("#eef2ff")
GRID_CLR   = colors.HexColor("#cbd5e1")
STRIPE     = colors.HexColor("#f8fafc")
BLUE_DARK  = colors.HexColor("#3730a3")

def tech_table(data, col_widths, styles_obj):
    """Tabla de tecnologías con fila de encabezado coloreada."""
    rows = []
    for i, row in enumerate(data):
        rows.append([Paragraph(str(cell), styles_obj['MyBody']) for cell in row])
    t = Table(rows, colWidths=col_widths)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('FONTNAME',   (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',   (0, 0), (-1, 0), 9),
        ('TEXTCOLOR',  (0, 0), (-1, 0), BLUE_DARK),
        ('GRID',       (0, 0), (-1, -1), 0.5, GRID_CLR),
        ('VALIGN',     (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]
    for i in range(2, len(data), 2):
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), STRIPE))
    t.setStyle(TableStyle(style_cmds))
    return t


def badge_row(items, color_hex, styles_obj):
    """Fila de badges de tecnología en una sola tabla."""
    cells = [Paragraph(f"<b>{item}</b>", styles_obj['MyBody']) for item in items]
    t = Table([cells], colWidths=[1.5*inch] * len(items))
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(color_hex)),
        ('TEXTCOLOR',  (0, 0), (-1, -1), colors.white),
        ('FONTNAME',   (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE',   (0, 0), (-1, -1), 9),
        ('ALIGN',      (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN',     (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0, colors.transparent),
    ]))
    return t


# ─────────────────────────────────────────────────────────────────────────────
# Construcción del PDF
# ─────────────────────────────────────────────────────────────────────────────
def build_pdf(filename="FinControl_Documentacion_Tecnica_Sistema_Web.pdf"):
    doc = SimpleDocTemplate(
        filename, pagesize=letter,
        leftMargin=54, rightMargin=54,
        topMargin=72, bottomMargin=72
    )
    s = build_styles()
    story = []
    hr = lambda: HRFlowable(width="100%", thickness=0.5,
                             color=colors.HexColor("#e2e8f0"), spaceAfter=10, spaceBefore=4)

    # ══════════════════════════════════════════════════════════════════════
    # PORTADA
    # ══════════════════════════════════════════════════════════════════════
    logo_path = "logo_codecraft.png"
    if os.path.exists(logo_path):
        from reportlab.platypus import Image as RLImage
        logo_img = RLImage(logo_path, width=200, height=130)
        logo_tbl = Table([[logo_img]], colWidths=[doc.width])
        logo_tbl.setStyle(TableStyle([('ALIGN', (0,0),(-1,-1),'CENTER')]))
        story.append(Spacer(1, 30))
        story.append(logo_tbl)
        story.append(Spacer(1, 30))
    else:
        story.append(Spacer(1, 80))

    story.append(Paragraph("FINCONTROL", s['CoverTitle']))
    story.append(Paragraph("Sistema Web de Control de Dispositivos Financiados", s['CoverSub']))
    story.append(Paragraph("Documentación Técnica — Stack, Arquitectura y Despliegue", s['CoverSub']))
    story.append(Spacer(1, 60))
    story.append(Paragraph("<b>Preparado por:</b> CodeCraft Programming Forge", s['CoverMeta']))
    story.append(Paragraph("<b>Versión:</b> 1.0.0  |  <b>Fecha:</b> Junio 2026", s['CoverMeta']))
    story.append(Paragraph("<b>Entorno:</b> Producción / Desarrollo Local", s['CoverMeta']))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # 1. RESUMEN EJECUTIVO
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. Resumen del Sistema", s['MyH1']))
    story.append(hr())
    story.append(Paragraph(
        "FinControl es una aplicación web full-stack diseñada para gestionar la venta de dispositivos móviles "
        "a crédito. Permite al administrador registrar ventas, hacer seguimiento de cuotas, visualizar "
        "calendarios de pago y enviar comandos de bloqueo/desbloqueo a dispositivos registrados. "
        "El sistema está dividido en dos capas independientes: un <b>Backend (API REST)</b> y un <b>Frontend SPA</b>.",
        s['MyBody']))
    story.append(Spacer(1, 8))

    overview_data = [
        ["Componente", "Tecnología principal", "Puerto / URL", "Rol"],
        ["Backend API", "Node.js + TypeScript + Express", "localhost:3000", "Lógica de negocio, BD, comandos"],
        ["Frontend SPA", "React 18 + TypeScript + Vite", "localhost:5173", "Interfaz web de administración"],
        ["Base de datos", "PostgreSQL (Supabase)", "Supabase Cloud / local", "Persistencia de datos"],
        ["Notificaciones Push", "Firebase Admin SDK", "FCM / APNs", "Comandos a dispositivos móviles"],
    ]
    story.append(tech_table(overview_data,
        [1.5*inch, 2.0*inch, 1.8*inch, 2.2*inch], s))
    story.append(Spacer(1, 12))

    # ══════════════════════════════════════════════════════════════════════
    # 2. STACK TECNOLÓGICO
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("2. Stack Tecnológico Completo", s['MyH1']))
    story.append(hr())

    # 2.1 Backend
    story.append(Paragraph("2.1  Backend — API REST", s['MyH2']))
    story.append(Paragraph(
        "El servidor está escrito en <b>TypeScript</b> sobre <b>Node.js</b> usando el framework <b>Express.js</b>. "
        "Expone una API RESTful en la ruta base <b>/api/v1/</b> con tres módulos: autenticación, "
        "dispositivos y pagos.",
        s['MyBody']))

    backend_data = [
        ["Tecnología / Librería", "Versión", "Propósito"],
        ["Node.js", "≥ 18 LTS", "Entorno de ejecución JavaScript del servidor"],
        ["TypeScript", "^5.5", "Tipado estático, mayor seguridad en el código"],
        ["Express.js", "^4.19", "Framework HTTP para enrutamiento y middlewares"],
        ["PostgreSQL (pg)", "^8.12", "Driver para conectarse a la base de datos relacional"],
        ["Firebase Admin SDK", "^14.0", "Envío de notificaciones push silenciosas (FCM/APNs)"],
        ["jsonwebtoken (JWT)", "^9.0", "Autenticación stateless con tokens firmados"],
        ["bcryptjs", "^2.4", "Hash seguro de contraseñas de administradores"],
        ["dotenv", "^16.4", "Gestión de variables de entorno (.env)"],
        ["cors", "^2.8", "Habilitación de peticiones cross-origin desde el frontend"],
        ["ts-node-dev", "^2.0", "Recarga automática en desarrollo (hot reload)"],
    ]
    story.append(tech_table(backend_data, [2.5*inch, 1.0*inch, 3.0*inch], s))
    story.append(Spacer(1, 10))

    # Rutas de la API
    story.append(Paragraph("Rutas de la API disponibles:", s['MyH2']))
    routes_data = [
        ["Método", "Ruta", "Descripción"],
        ["GET",    "/health",                           "Verificación de estado del servidor"],
        ["POST",   "/api/v1/auth/login",                "Inicio de sesión del administrador (JWT)"],
        ["GET",    "/api/v1/devices",                   "Listar todos los dispositivos registrados"],
        ["POST",   "/api/v1/devices",                   "Registrar un nuevo dispositivo"],
        ["POST",   "/api/v1/devices/:id/command",       "Enviar comando lock / unlock / wipe"],
        ["GET",    "/api/v1/devices/:id/commands",      "Historial de comandos de un dispositivo"],
        ["GET",    "/api/v1/devices/:id/pending",       "Comandos pendientes (polling del agente móvil)"],
        ["POST",   "/api/v1/payments/confirm",          "Confirmar un pago recibido"],
    ]
    story.append(tech_table(routes_data, [0.8*inch, 2.7*inch, 3.0*inch], s))
    story.append(Spacer(1, 12))

    # 2.2 Frontend
    story.append(Paragraph("2.2  Frontend — Single Page Application (SPA)", s['MyH2']))
    story.append(Paragraph(
        "La interfaz de usuario es una <b>SPA</b> construida con <b>React 18</b> y <b>TypeScript</b>, "
        "empaquetada con <b>Vite 5</b> para desarrollo ultrarrápido. Los estilos utilizan <b>TailwindCSS</b> "
        "con componentes personalizados. La comunicación con el backend se realiza mediante <b>fetch API</b> nativo.",
        s['MyBody']))

    frontend_data = [
        ["Tecnología / Librería", "Versión", "Propósito"],
        ["React", "^18.3", "Librería UI basada en componentes y hooks"],
        ["TypeScript", "^5.2", "Tipado estático en el frontend"],
        ["Vite", "^5.3", "Bundler y servidor de desarrollo (HMR instantáneo)"],
        ["TailwindCSS", "^3.4", "Framework de estilos utility-first"],
        ["PostCSS + Autoprefixer", "^8.4 / ^10.4", "Procesamiento de CSS y compatibilidad de navegadores"],
        ["Lucide React", "^0.395", "Librería de iconos SVG consistentes"],
        ["localStorage API", "nativo", "Persistencia local de ventas y preferencias de tema"],
        ["Fetch API", "nativo", "Peticiones HTTP al backend (sin librerías externas)"],
    ]
    story.append(tech_table(frontend_data, [2.3*inch, 1.2*inch, 3.0*inch], s))
    story.append(Spacer(1, 12))

    # Vistas del frontend
    story.append(Paragraph("Vistas / Módulos del Frontend:", s['MyH2']))
    views_data = [
        ["Vista", "Ruta interna", "Funcionalidad"],
        ["Panel de Control", "dashboard",  "Stats de créditos, consola de comandos, tabla de dispositivos"],
        ["Ventas a Crédito",  "credits",   "Registro y seguimiento de ventas a crédito con cuotas"],
        ["Calendario de Pagos","calendar", "Vista mensual de cuotas programadas con indicadores visuales"],
        ["Alertas de Mora",   "alerts",    "Listado de clientes con cuotas vencidas (+2 días = crítico)"],
    ]
    story.append(tech_table(views_data, [1.5*inch, 1.3*inch, 3.7*inch], s))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # 3. BASE DE DATOS
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("3. Base de Datos — PostgreSQL / Supabase", s['MyH1']))
    story.append(hr())
    story.append(Paragraph(
        "El sistema utiliza <b>PostgreSQL</b> como base de datos relacional. "
        "Se puede alojar en <b>Supabase</b> (cloud gratuito) o en un servidor local. "
        "El esquema consta de dos tablas principales con índices de optimización.",
        s['MyBody']))

    story.append(Paragraph("Tabla: <b>devices</b>", s['MyH2']))
    devices_cols = [
        ["Columna", "Tipo", "Descripción"],
        ["id",              "SERIAL PK",              "Identificador único autoincremental"],
        ["serial_number",   "VARCHAR(100) UNIQUE",    "Número de serie del dispositivo (obligatorio)"],
        ["imei",            "VARCHAR(50)",             "IMEI del dispositivo (opcional)"],
        ["brand",           "VARCHAR(50)",             "Marca del equipo (Samsung, Apple, etc.)"],
        ["model",           "VARCHAR(100)",            "Modelo del equipo (Galaxy S24, iPhone 15...)"],
        ["status",          "VARCHAR(20)",             "Estado: active | locked | suspended | wiped"],
        ["customer_name",   "VARCHAR(150)",            "Nombre del cliente propietario del crédito"],
        ["customer_phone",  "VARCHAR(50)",             "Teléfono de contacto del cliente"],
        ["device_token",    "TEXT",                    "Token JWT de autenticación del hardware"],
        ["last_sync_at",    "TIMESTAMP WITH TZ",       "Última vez que el dispositivo hizo check-in"],
        ["created_at",      "TIMESTAMP WITH TZ",       "Fecha de registro del dispositivo"],
    ]
    story.append(tech_table(devices_cols, [1.5*inch, 1.5*inch, 3.5*inch], s))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Tabla: <b>commands</b>", s['MyH2']))
    commands_cols = [
        ["Columna", "Tipo", "Descripción"],
        ["id",          "SERIAL PK",     "Identificador único"],
        ["device_id",   "INTEGER FK",    "Referencia a devices.id (CASCADE ON DELETE)"],
        ["type",        "VARCHAR(50)",   "Tipo de comando: lock | unlock | wipe"],
        ["status",      "VARCHAR(20)",   "Estado: pending | sent | executed | failed"],
        ["signature",   "TEXT",          "Firma criptográfica asimétrica ECDSA del comando"],
        ["token",       "VARCHAR(100)",  "Nonce único anti-replay por comando"],
        ["payload",     "JSONB",         "Datos adjuntos, ej: { message: 'Realice su pago' }"],
        ["executed_at", "TIMESTAMP TZ",  "Marca de tiempo de ejecución en el dispositivo"],
        ["created_at",  "TIMESTAMP TZ",  "Fecha de emisión del comando"],
    ]
    story.append(tech_table(commands_cols, [1.3*inch, 1.3*inch, 3.9*inch], s))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Índices de rendimiento:", s['MyLabel']))
    story.append(Paragraph("• <b>idx_devices_serial</b> → devices(serial_number)  — búsqueda rápida por número de serie.", s['MyBullet']))
    story.append(Paragraph("• <b>idx_commands_device_status</b> → commands(device_id, status)  — consulta eficiente de comandos pendientes por dispositivo.", s['MyBullet']))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # 4. ESTRUCTURA DE ARCHIVOS
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("4. Estructura de Archivos del Proyecto", s['MyH1']))
    story.append(hr())
    story.append(Paragraph(
        "El repositorio está organizado en dos carpetas principales que mantienen separados "
        "el backend y el frontend, permitiendo desplegarlos de forma independiente.",
        s['MyBody']))

    file_tree = (
        "bloqueo app/\n"
        "├── src/                        ← Backend (API)\n"
        "│   ├── server.ts               ← Punto de entrada Express\n"
        "│   ├── config/                 ← Configuración DB y Firebase\n"
        "│   ├── controllers/\n"
        "│   │   ├── authController.ts   ← Login / JWT\n"
        "│   │   ├── deviceController.ts ← CRUD dispositivos + comandos\n"
        "│   │   └── paymentController.ts← Confirmación de pagos\n"
        "│   ├── routes/\n"
        "│   │   ├── authRoutes.ts\n"
        "│   │   ├── deviceRoutes.ts\n"
        "│   │   └── paymentRoutes.ts\n"
        "│   ├── middlewares/            ← Auth JWT middleware\n"
        "│   └── db/                     ← Pool de conexión a PostgreSQL\n"
        "│\n"
        "├── frontend/                   ← Frontend (SPA React)\n"
        "│   ├── index.html              ← HTML base\n"
        "│   ├── vite.config.ts          ← Configuración Vite\n"
        "│   ├── tailwind.config.js      ← Configuración TailwindCSS\n"
        "│   └── src/\n"
        "│       ├── main.tsx            ← Punto de entrada React\n"
        "│       ├── App.tsx             ← Componente raíz + todas las vistas\n"
        "│       └── index.css           ← Variables CSS + estilos globales\n"
        "│\n"
        "├── schema.sql                  ← DDL de la base de datos\n"
        "├── .env                        ← Variables de entorno (privado)\n"
        "├── firebase-service-account.json← Credenciales Firebase Admin\n"
        "└── package.json                ← Dependencias del backend"
    )
    story.append(Paragraph(file_tree.replace('\n', '<br/>').replace(' ', '&nbsp;'), s['MyCode']))
    story.append(Spacer(1, 10))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # 5. GUÍA DE INSTALACIÓN Y DESPLIEGUE
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("5. Guía de Instalación y Montaje del Sistema", s['MyH1']))
    story.append(hr())

    # 5.1 Requisitos previos
    story.append(Paragraph("5.1  Requisitos Previos", s['MyH2']))
    prereq_data = [
        ["Herramienta", "Versión mínima", "Descarga"],
        ["Node.js",   "18 LTS o superior",  "nodejs.org"],
        ["npm",       "9.x o superior",      "Incluido con Node.js"],
        ["PostgreSQL","14 o superior  (o cuenta Supabase gratuita)", "postgresql.org / supabase.com"],
        ["Git",       "2.x",                 "git-scm.com"],
        ["Editor",    "VS Code recomendado", "code.visualstudio.com"],
    ]
    story.append(tech_table(prereq_data, [1.3*inch, 2.5*inch, 2.7*inch], s))
    story.append(Spacer(1, 10))

    # 5.2 Configuración de Variables de Entorno
    story.append(Paragraph("5.2  Archivo de Variables de Entorno (.env)", s['MyH2']))
    story.append(Paragraph(
        "Crea el archivo <b>.env</b> en la raíz del proyecto (junto a package.json) con el siguiente contenido:",
        s['MyBody']))
    env_content = (
        "# Puerto del servidor\n"
        "PORT=3000\n"
        "NODE_ENV=development\n\n"
        "# Base de datos PostgreSQL\n"
        "DB_HOST=db.tuproyecto.supabase.co\n"
        "DB_PORT=5432\n"
        "DB_NAME=postgres\n"
        "DB_USER=postgres\n"
        "DB_PASSWORD=tu_contrasena_segura\n\n"
        "# JWT para autenticación de admins\n"
        "JWT_SECRET=clave_secreta_muy_larga_y_segura_aqui\n\n"
        "# Firebase (para notificaciones push)\n"
        "FIREBASE_PROJECT_ID=tu-proyecto-firebase"
    )
    story.append(Paragraph(env_content.replace('\n', '<br/>').replace(' ', '&nbsp;'), s['MyCode']))
    story.append(Spacer(1, 8))

    # 5.3 Pasos de instalación
    story.append(Paragraph("5.3  Pasos de Instalación — Backend", s['MyH2']))
    backend_steps = [
        ("Paso 1 — Instalar dependencias del backend",
         "cd \"bloqueo app\"\nnpm install"),
        ("Paso 2 — Crear la base de datos",
         "# En Supabase: SQL Editor → New Query → pegar schema.sql\n# En local: psql -U postgres -f schema.sql"),
        ("Paso 3 — Iniciar el servidor en modo desarrollo",
         "npm run dev\n# Salida esperada:\n# Servidor iniciado en el puerto 3000 (Entorno: development)"),
        ("Paso 4 — Verificar que funciona",
         "# Abrir en el navegador o con curl:\n# GET http://localhost:3000/health\n# Respuesta: { \"status\": \"UP\", \"timestamp\": \"...\" }"),
    ]
    for title, cmd in backend_steps:
        story.append(Paragraph(f"<b>{title}</b>", s['MyLabel']))
        story.append(Paragraph(cmd.replace('\n', '<br/>').replace(' ', '&nbsp;'), s['MyCode']))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 6))
    story.append(Paragraph("5.4  Pasos de Instalación — Frontend", s['MyH2']))
    frontend_steps = [
        ("Paso 1 — Instalar dependencias del frontend",
         "cd \"bloqueo app/frontend\"\nnpm install"),
        ("Paso 2 — Iniciar el servidor de desarrollo",
         "npm run dev\n# Salida esperada:\n# VITE v5.x.x  ready in 300 ms\n# ➜  Local:   http://localhost:5173/"),
        ("Paso 3 — Abrir la interfaz",
         "# Navegar a: http://localhost:5173\n# El frontend se conecta automáticamente al backend en localhost:3000"),
    ]
    for title, cmd in frontend_steps:
        story.append(Paragraph(f"<b>{title}</b>", s['MyLabel']))
        story.append(Paragraph(cmd.replace('\n', '<br/>').replace(' ', '&nbsp;'), s['MyCode']))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # 6. DESPLIEGUE EN PRODUCCIÓN
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("6. Despliegue en Producción (Servidor VPS)", s['MyH1']))
    story.append(hr())
    story.append(Paragraph(
        "Para producción se recomienda un servidor VPS con Ubuntu 22.04. "
        "El backend se ejecuta como servicio con PM2, el frontend se construye como archivos "
        "estáticos y se sirve con Nginx.",
        s['MyBody']))

    prod_data = [
        ["Componente", "Herramienta", "Descripción"],
        ["Proceso Backend", "PM2",          "Gestor de procesos Node.js. Reinicio automático al fallar."],
        ["Servidor Web",    "Nginx",         "Reverse proxy para el backend y servidor de archivos estáticos."],
        ["SSL/HTTPS",       "Certbot (Let's Encrypt)", "Certificado SSL gratuito y renovación automática."],
        ["Base de datos",   "Supabase / Render", "PostgreSQL gestionado en la nube (opción más económica)."],
        ["CI/CD",           "GitHub Actions (opcional)", "Deploy automático al hacer push a la rama main."],
    ]
    story.append(tech_table(prod_data, [1.5*inch, 1.8*inch, 3.2*inch], s))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Comandos de despliegue en VPS:", s['MyH2']))
    deploy_cmds = (
        "# 1. Clonar el repositorio\n"
        "git clone https://github.com/tu-usuario/fincontrol.git /var/www/fincontrol\n\n"
        "# 2. Instalar dependencias backend y compilar\n"
        "cd /var/www/fincontrol\n"
        "npm install && npm run build\n\n"
        "# 3. Compilar el frontend\n"
        "cd frontend && npm install && npm run build\n\n"
        "# 4. Configurar variables de entorno\n"
        "cp .env.example .env && nano .env\n\n"
        "# 5. Iniciar el backend con PM2\n"
        "npm install -g pm2\n"
        "pm2 start dist/server.js --name fincontrol-api\n"
        "pm2 save && pm2 startup\n\n"
        "# 6. Configurar Nginx (ver configuración en docs/)\n"
        "sudo nginx -t && sudo systemctl reload nginx"
    )
    story.append(Paragraph(deploy_cmds.replace('\n', '<br/>').replace(' ', '&nbsp;'), s['MyCode']))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Configuración básica de Nginx:", s['MyH2']))
    nginx_conf = (
        "server {\n"
        "    listen 80;\n"
        "    server_name tudominio.com;\n\n"
        "    # Frontend: archivos estáticos\n"
        "    root /var/www/fincontrol/frontend/dist;\n"
        "    index index.html;\n"
        "    try_files $uri $uri/ /index.html;\n\n"
        "    # Backend: proxy inverso\n"
        "    location /api/ {\n"
        "        proxy_pass http://localhost:3000;\n"
        "        proxy_set_header Host $host;\n"
        "        proxy_set_header X-Real-IP $remote_addr;\n"
        "    }\n"
        "}"
    )
    story.append(Paragraph(nginx_conf.replace('\n', '<br/>').replace(' ', '&nbsp;'), s['MyCode']))
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # 7. RESUMEN RÁPIDO DE TECNOLOGÍAS
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("7. Resumen Visual del Stack Completo", s['MyH1']))
    story.append(hr())
    story.append(Paragraph(
        "Tabla de referencia rápida con todas las tecnologías del sistema, agrupadas por categoría:",
        s['MyBody']))
    story.append(Spacer(1, 6))

    full_stack = [
        ["Categoría", "Tecnología", "Lenguaje / Formato", "Rol en el sistema"],
        # Backend
        ["Backend Runtime",   "Node.js 18 LTS",      "JavaScript",    "Entorno servidor"],
        ["Backend Language",  "TypeScript 5.5",       "TypeScript",    "Código tipado del servidor"],
        ["Backend Framework", "Express.js 4",         "TypeScript/JS", "API REST y rutas HTTP"],
        ["Auth",              "JWT (jsonwebtoken)",   "TypeScript",    "Autenticación stateless"],
        ["Hashing",           "bcryptjs",             "TypeScript",    "Hash seguro de contraseñas"],
        ["Push Notifications","Firebase Admin SDK",   "TypeScript",    "Comandos a dispositivos móviles"],
        # Frontend
        ["Frontend Runtime",  "Vite 5 + React 18",   "TSX / HTML",    "SPA + bundler de desarrollo"],
        ["Frontend Language", "TypeScript 5.2",       "TypeScript",    "Código tipado del cliente"],
        ["UI Styles",         "TailwindCSS 3.4",      "CSS / PostCSS", "Estilos utility-first"],
        ["UI Icons",          "Lucide React",         "TSX / SVG",     "Iconografía consistente"],
        # DB
        ["Base de datos",     "PostgreSQL 14+",       "SQL",           "Persistencia relacional"],
        ["DB Hosting",        "Supabase / local",     "SQL",           "Base de datos en la nube"],
        ["Schema",            "schema.sql",           "SQL (DDL)",     "Definición de tablas e índices"],
        # Config
        ["Variables de entorno","dotenv",             ".env",          "Secretos y configuración"],
        ["Proceso producción", "PM2",                 "JSON / Shell",  "Gestor de procesos Node.js"],
        ["Web Server prod",   "Nginx",                "nginx.conf",    "Reverse proxy + archivos estáticos"],
        ["SSL/HTTPS",         "Let's Encrypt",        "Certbot CLI",   "Certificado TLS gratuito"],
    ]
    story.append(tech_table(full_stack,
        [1.4*inch, 1.5*inch, 1.3*inch, 2.3*inch], s))
    story.append(Spacer(1, 12))

    # ══════════════════════════════════════════════════════════════════════
    # 8. SCRIPTS NPM DISPONIBLES
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("8. Scripts npm Disponibles", s['MyH1']))
    story.append(hr())

    story.append(Paragraph("Backend (raíz del proyecto):", s['MyH2']))
    backend_scripts = [
        ["Script", "Comando", "Descripción"],
        ["npm run dev",   "ts-node-dev --respawn src/server.ts",  "Inicia el servidor con hot-reload (desarrollo)"],
        ["npm run build", "tsc",                                   "Compila TypeScript a JavaScript en /dist"],
        ["npm start",     "node dist/server.js",                   "Inicia el servidor compilado (producción)"],
    ]
    story.append(tech_table(backend_scripts, [1.3*inch, 2.5*inch, 2.7*inch], s))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Frontend (carpeta /frontend):", s['MyH2']))
    frontend_scripts = [
        ["Script", "Comando", "Descripción"],
        ["npm run dev",     "vite",              "Inicia Vite con HMR en localhost:5173 (desarrollo)"],
        ["npm run build",   "tsc && vite build", "Compila TS y genera archivos estáticos en /dist"],
        ["npm run preview", "vite preview",      "Vista previa del build de producción localmente"],
    ]
    story.append(tech_table(frontend_scripts, [1.3*inch, 1.8*inch, 3.4*inch], s))
    story.append(Spacer(1, 12))

    # Pie de documento
    story.append(hr())
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Documento generado automáticamente por CodeCraft Programming Forge — Junio 2026. "
        "Para actualizaciones o soporte técnico, contactar al equipo de desarrollo.",
        s['MyCaption']))

    # ── Build ──────────────────────────────────────────────────────────────
    doc.build(story, onFirstPage=draw_cover_bg, canvasmaker=NumberedCanvas)


if __name__ == "__main__":
    build_pdf()
    print("PDF generado: FinControl_Documentacion_Tecnica_Sistema_Web.pdf")
