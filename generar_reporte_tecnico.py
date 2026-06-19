"""
Generador de Reporte Técnico — CodeCraft Programming Forge
Sistema FinControl — Reporte de Arquitectura y Stack Tecnológico
"""

import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image, KeepTogether, PageBreak
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas

# ─── Paleta de colores CodeCraft ───────────────────────────────────────────
DARK_BG     = colors.HexColor('#0d1117')
NAVY        = colors.HexColor('#1a2234')
CYAN        = colors.HexColor('#00b4d8')
CYAN_LIGHT  = colors.HexColor('#48cae4')
CYAN_DIM    = colors.HexColor('#0077b6')
WHITE       = colors.HexColor('#ffffff')
GRAY_100    = colors.HexColor('#f0f4f8')
GRAY_300    = colors.HexColor('#cbd5e1')
GRAY_500    = colors.HexColor('#64748b')
GRAY_700    = colors.HexColor('#334155')
GRAY_900    = colors.HexColor('#0f172a')
EMERALD     = colors.HexColor('#10b981')
ROSE        = colors.HexColor('#f43f5e')
AMBER       = colors.HexColor('#f59e0b')
VIOLET      = colors.HexColor('#8b5cf6')
INDIGO      = colors.HexColor('#6366f1')
ACCENT_BG   = colors.HexColor('#e0f2fe')
ACCENT_BG2  = colors.HexColor('#f0fdf4')
ACCENT_BG3  = colors.HexColor('#fdf4ff')
ACCENT_BG4  = colors.HexColor('#fff7ed')

PAGE_W, PAGE_H = A4
MARGIN_L = 2.0 * cm
MARGIN_R = 2.0 * cm
MARGIN_T = 2.5 * cm
MARGIN_B = 2.0 * cm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH  = os.path.join(BASE_DIR, 'logo_codecraft.png')
OUTPUT_PDF = os.path.join(BASE_DIR, 'Reporte_Tecnico_FinControl.pdf')
DATE_STR   = datetime.now().strftime('%d de %B de %Y').replace(
    'January','enero').replace('February','febrero').replace('March','marzo').replace(
    'April','abril').replace('May','mayo').replace('June','junio').replace(
    'July','julio').replace('August','agosto').replace('September','septiembre').replace(
    'October','octubre').replace('November','noviembre').replace('December','diciembre')
TIME_STR   = datetime.now().strftime('%H:%M')

# ─── Estilos ───────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def style(name, **kwargs):
    return ParagraphStyle(name, **kwargs)

s_title = style('s_title',
    fontName='Helvetica-Bold', fontSize=22, textColor=WHITE,
    leading=28, alignment=TA_CENTER, spaceAfter=4)

s_subtitle = style('s_subtitle',
    fontName='Helvetica', fontSize=11, textColor=CYAN_LIGHT,
    leading=16, alignment=TA_CENTER, spaceAfter=2)

s_section = style('s_section',
    fontName='Helvetica-Bold', fontSize=13, textColor=GRAY_900,
    leading=18, spaceBefore=18, spaceAfter=8,
    borderPad=(0,0,4,0))

s_sub = style('s_sub',
    fontName='Helvetica-Bold', fontSize=10, textColor=INDIGO,
    leading=14, spaceBefore=10, spaceAfter=4)

s_body = style('s_body',
    fontName='Helvetica', fontSize=9, textColor=GRAY_700,
    leading=14, spaceAfter=4, alignment=TA_JUSTIFY)

s_bullet = style('s_bullet',
    fontName='Helvetica', fontSize=9, textColor=GRAY_700,
    leading=14, leftIndent=14, spaceAfter=2,
    bulletIndent=6)

s_code = style('s_code',
    fontName='Courier', fontSize=8, textColor=CYAN_DIM,
    leading=12, leftIndent=10, backColor=GRAY_100,
    spaceAfter=2)

s_caption = style('s_caption',
    fontName='Helvetica', fontSize=7.5, textColor=GRAY_500,
    leading=11, alignment=TA_CENTER, spaceBefore=2)

s_footer = style('s_footer',
    fontName='Helvetica', fontSize=7, textColor=GRAY_500,
    leading=10, alignment=TA_CENTER)

s_badge_text = style('s_badge_text',
    fontName='Helvetica-Bold', fontSize=8, textColor=WHITE,
    leading=11, alignment=TA_CENTER)

s_white = style('s_white',
    fontName='Helvetica', fontSize=9, textColor=WHITE,
    leading=13, alignment=TA_CENTER)

s_white_bold = style('s_white_bold',
    fontName='Helvetica-Bold', fontSize=10, textColor=WHITE,
    leading=14, alignment=TA_CENTER)

s_metric_val = style('s_metric_val',
    fontName='Helvetica-Bold', fontSize=22, textColor=WHITE,
    leading=26, alignment=TA_CENTER)

s_metric_lbl = style('s_metric_lbl',
    fontName='Helvetica', fontSize=8, textColor=CYAN_LIGHT,
    leading=11, alignment=TA_CENTER)

s_toc = style('s_toc',
    fontName='Helvetica', fontSize=9, textColor=GRAY_700,
    leading=16, leftIndent=14)

# ─── Helpers ───────────────────────────────────────────────────────────────
def bullet(text, color=CYAN):
    return Paragraph(f'<font color="#{color.hexval()[2:]}">▸</font> {text}', s_bullet)

def check(text, color=EMERALD):
    return Paragraph(f'<font color="#{color.hexval()[2:]}">✓</font> {text}', s_bullet)

def section_title(text, icon=''):
    return Paragraph(f'{icon} {text}' if icon else text, s_section)

def subsection(text):
    return Paragraph(text, s_sub)

def body(text):
    return Paragraph(text, s_body)

def hr(color=GRAY_300, thickness=0.5):
    return HRFlowable(width='100%', thickness=thickness, color=color,
                      spaceAfter=6, spaceBefore=6)

def spacer(h=0.3):
    return Spacer(1, h * cm)

def colored_table(data, col_widths, header_bg=NAVY, row_colors=None):
    n_cols = len(data[0])
    style_cmds = [
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8.5),
        ('TOPPADDING', (0,1), (-1,-1), 6),
        ('BOTTOMPADDING', (0,1), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, GRAY_100]),
        ('TEXTCOLOR', (0,1), (-1,-1), GRAY_700),
        ('GRID', (0,0), (-1,-1), 0.4, GRAY_300),
        ('LINEBELOW', (0,0), (-1,0), 1.5, CYAN),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [4,4,4,4]),
    ]
    if row_colors:
        for (row, col, bg_col, txt_col) in row_colors:
            style_cmds.append(('BACKGROUND', (col, row), (col, row), bg_col))
            style_cmds.append(('TEXTCOLOR', (col, row), (col, row), txt_col))
    tbl = Table(data, colWidths=col_widths)
    tbl.setStyle(TableStyle(style_cmds))
    return tbl

def badge_table(items, bg_color, text_color=WHITE):
    """Items: list of (label, value) tuples as metric cards"""
    data = [[Paragraph(v, s_metric_val) for _,v in items],
            [Paragraph(l, s_metric_lbl) for l,_ in items]]
    w = CONTENT_W / len(items)
    tbl = Table(data, colWidths=[w]*len(items))
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_color),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEAFTER', (0,0), (-2,-1), 0.5, colors.HexColor('#ffffff44')),
    ]))
    return tbl

def info_card(label, value, desc='', bg=ACCENT_BG, lcolor=INDIGO):
    inner = [
        [Paragraph(f'<font color="#{lcolor.hexval()[2:]}" size="8"><b>{label}</b></font>', s_body),
         Paragraph(f'<b>{value}</b>', s_body)],
    ]
    if desc:
        inner.append([Paragraph(desc, style('d', fontName='Helvetica', fontSize=7.5,
            textColor=GRAY_500, leading=11)), ''])
    t = Table(inner, colWidths=[CONTENT_W*0.38, CONTENT_W*0.62])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,0), (-1,0), 0.3, GRAY_300),
    ]))
    return t

# ─── Encabezado/pie de página ──────────────────────────────────────────────
def header_footer(c: canvas.Canvas, doc):
    c.saveState()
    page_num = doc.page
    # Header bar (solo desde pag 2)
    if page_num > 1:
        c.setFillColor(DARK_BG)
        c.rect(0, PAGE_H - 1.1*cm, PAGE_W, 1.1*cm, fill=1, stroke=0)
        c.setFillColor(CYAN)
        c.rect(0, PAGE_H - 1.1*cm, PAGE_W, 2, fill=1, stroke=0)
        # Logo pequeño en header
        if os.path.exists(LOGO_PATH):
            c.drawImage(LOGO_PATH, MARGIN_L, PAGE_H - 0.95*cm,
                        width=1.6*cm, height=0.7*cm, preserveAspectRatio=True, mask='auto')
        c.setFont('Helvetica', 7.5)
        c.setFillColor(GRAY_300)
        c.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 0.65*cm,
                          'Reporte Técnico — FinControl v1.0 | CodeCraft Programming Forge')

    # Footer bar
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, 1.3*cm, fill=1, stroke=0)
    c.setFillColor(CYAN)
    c.rect(0, 1.3*cm, PAGE_W, 1.5, fill=1, stroke=0)
    c.setFont('Helvetica', 7)
    c.setFillColor(GRAY_300)
    c.drawString(MARGIN_L, 0.55*cm, f'Generado el {DATE_STR} a las {TIME_STR}')
    c.drawCentredString(PAGE_W/2, 0.55*cm, '© 2025 CodeCraft Programming Forge — Confidencial')
    c.setFillColor(CYAN)
    c.setFont('Helvetica-Bold', 8)
    c.drawRightString(PAGE_W - MARGIN_R, 0.55*cm, f'Página {page_num}')
    c.restoreState()

# ─── Portada ───────────────────────────────────────────────────────────────
def build_cover(c: canvas.Canvas, doc):
    c.saveState()
    # Fondo degradado oscuro
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Franja cyan superior
    c.setFillColor(CYAN)
    c.rect(0, PAGE_H - 4*mm, PAGE_W, 4*mm, fill=1, stroke=0)
    # Banda lateral izquierda
    c.setFillColor(CYAN_DIM)
    c.rect(0, 0, 5*mm, PAGE_H, fill=1, stroke=0)
    # Círculos decorativos de fondo
    c.setFillColor(colors.HexColor('#ffffff08'))
    c.circle(PAGE_W - 3*cm, PAGE_H - 3*cm, 5*cm, fill=1, stroke=0)
    c.circle(3*cm, 4*cm, 3.5*cm, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#00b4d810'))
    c.circle(PAGE_W/2, PAGE_H/2, 7*cm, fill=1, stroke=0)

    # Logo empresa
    logo_w = 8*cm
    logo_h = 4*cm
    logo_x = (PAGE_W - logo_w) / 2
    logo_y = PAGE_H - 7*cm
    if os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH, logo_x, logo_y,
                    width=logo_w, height=logo_h,
                    preserveAspectRatio=True, mask='auto')

    # Línea divisoria cyan
    c.setStrokeColor(CYAN)
    c.setLineWidth(1.2)
    c.line(MARGIN_L + 1*cm, logo_y - 0.5*cm, PAGE_W - MARGIN_R - 1*cm, logo_y - 0.5*cm)

    # Título principal
    c.setFont('Helvetica-Bold', 28)
    c.setFillColor(WHITE)
    c.drawCentredString(PAGE_W/2, logo_y - 2.0*cm, 'REPORTE TÉCNICO')

    # Subtítulo
    c.setFont('Helvetica-Bold', 17)
    c.setFillColor(CYAN)
    c.drawCentredString(PAGE_W/2, logo_y - 2.9*cm, 'FinControl — Sistema de Créditos Móviles')

    # Descripción
    c.setFont('Helvetica', 10)
    c.setFillColor(GRAY_300)
    c.drawCentredString(PAGE_W/2, logo_y - 3.7*cm,
        'Documentación de Arquitectura y Stack Tecnológico')

    # Caja de metadata
    box_y = 4.5*cm
    box_h = 3.5*cm
    c.setFillColor(NAVY)
    c.setStrokeColor(CYAN_DIM)
    c.setLineWidth(0.6)
    c.roundRect(MARGIN_L + 1*cm, box_y, CONTENT_W - 2*cm, box_h, 6*mm, fill=1, stroke=1)

    # Info dentro de la caja
    line1_y = box_y + box_h - 1.0*cm
    c.setFont('Helvetica-Bold', 9)
    c.setFillColor(CYAN_LIGHT)
    meta_items = [
        ('Versión del Sistema:', 'v1.0.0'),
        ('Fecha del Reporte:', DATE_STR),
        ('Autor / Empresa:', 'CodeCraft Programming Forge'),
        ('Clasificación:', 'Confidencial — Solo uso interno'),
    ]
    left_x  = MARGIN_L + 1.8*cm
    right_x = PAGE_W/2 + 1*cm
    for i, (lbl, val) in enumerate(meta_items):
        y = line1_y - i * 0.65*cm
        c.setFont('Helvetica-Bold', 8.5)
        c.setFillColor(CYAN_LIGHT)
        c.drawString(left_x, y, lbl)
        c.setFont('Helvetica', 8.5)
        c.setFillColor(WHITE)
        c.drawString(right_x, y, val)

    # Barra inferior
    c.setFillColor(CYAN)
    c.rect(0, 0, PAGE_W, 1*cm, fill=1, stroke=0)
    c.setFont('Helvetica', 8)
    c.setFillColor(DARK_BG)
    c.drawCentredString(PAGE_W/2, 0.35*cm,
        '© 2025 CodeCraft Programming Forge — Documento Confidencial')
    c.restoreState()

# ─── Construcción del documento ────────────────────────────────────────────
def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T + 0.5*cm, bottomMargin=MARGIN_B + 1*cm,
        title='Reporte Técnico — FinControl',
        author='CodeCraft Programming Forge',
        subject='Documentación de Arquitectura y Stack Tecnológico',
    )

    story = []

    # ── PORTADA (página especial) ──────────────────────────────────────────
    story.append(PageBreak())   # la portada se dibuja en on_first_page

    # ══════════════════════════════════════════════════════════════════════
    # 1. RESUMEN EJECUTIVO
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_title('1.  Resumen Ejecutivo', '📋'))
    story.append(hr(CYAN, 1.2))
    story.append(spacer(0.15))
    story.append(body(
        '<b>FinControl</b> es una plataforma empresarial de gestión de ventas a crédito y '
        'control remoto de dispositivos móviles, desarrollada por <b>CodeCraft Programming Forge</b>. '
        'El sistema permite a empresas que otorgan financiamiento de equipos celulares '
        'administrar créditos, cuotas y enviar comandos de bloqueo/desbloqueo a los terminales '
        'de sus clientes, garantizando el cobro seguro de los pagos pactados.'
    ))
    story.append(spacer(0.3))

    # Métricas de resumen
    metrics = [
        ('Módulos del sistema', '3'),
        ('Lenguajes de programación', '4'),
        ('Tecnologías integradas', '12+'),
        ('Vistas del panel web', '4'),
    ]
    story.append(badge_table(metrics, NAVY))
    story.append(spacer(0.4))

    story.append(body(
        'La plataforma consta de tres componentes principales: un <b>Panel de Administración Web</b> '
        '(React + TypeScript), un <b>Backend REST API</b> (Node.js + TypeScript + Express) y una '
        '<b>base de datos relacional</b> (PostgreSQL en Supabase). El sistema fue diseñado siguiendo '
        'principios de seguridad por diseño, con autenticación JWT, firmas criptográficas ECDSA '
        'y cifrado TLS en todas las comunicaciones.'
    ))
    story.append(spacer(0.5))

    # ══════════════════════════════════════════════════════════════════════
    # 2. STACK TECNOLÓGICO
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_title('2.  Stack Tecnológico Completo', '🛠️'))
    story.append(hr(CYAN, 1.2))
    story.append(spacer(0.1))

    # 2.1 Lenguajes
    story.append(subsection('2.1  Lenguajes de Programación'))
    story.append(spacer(0.1))

    lang_data = [
        ['Lenguaje', 'Versión', 'Capa', 'Rol principal'],
        ['TypeScript', '5.5+', 'Frontend + Backend', 'Lógica de aplicación con tipado estático'],
        ['JavaScript (JS)', 'ES2022+', 'Runtime (Node.js)', 'Ejecución del servidor compilado'],
        ['SQL (PostgreSQL)', '15+', 'Base de datos', 'Definición de esquema, índices y consultas'],
        ['HTML5 / CSS3', 'HTML5', 'Frontend', 'Estructura y estilos de la interfaz web'],
    ]
    lang_col_w = [CONTENT_W*0.20, CONTENT_W*0.13, CONTENT_W*0.28, CONTENT_W*0.39]
    story.append(colored_table(lang_data, lang_col_w, NAVY))
    story.append(spacer(0.4))

    # 2.2 Frontend
    story.append(subsection('2.2  Frontend (Panel de Administración Web)'))
    story.append(spacer(0.1))

    fe_data = [
        ['Tecnología / Librería', 'Versión', 'Función'],
        ['React', '18+', 'Framework UI basado en componentes'],
        ['TypeScript', '5.5+', 'Tipado estático sobre JavaScript'],
        ['Vite', '5+', 'Bundler y servidor de desarrollo ultrarrápido'],
        ['Lucide React', 'Latest', 'Librería de iconos SVG modernos'],
        ['CSS3 Variables (Vanilla CSS)', '—', 'Design system con temas dark/light'],
        ['View Transitions API', 'Nativa', 'Animación de transición entre temas'],
        ['Fetch API (nativa)', 'Nativa', 'Comunicación asíncrona con el backend'],
        ['localStorage API', 'Nativa', 'Persistencia local de ventas y preferencias'],
    ]
    fe_col_w = [CONTENT_W*0.33, CONTENT_W*0.17, CONTENT_W*0.50]
    story.append(colored_table(fe_data, fe_col_w, INDIGO))
    story.append(spacer(0.4))

    # 2.3 Backend
    story.append(subsection('2.3  Backend (API REST)'))
    story.append(spacer(0.1))

    be_data = [
        ['Tecnología / Librería', 'Versión', 'Función'],
        ['Node.js', '20 LTS', 'Entorno de ejecución JavaScript del servidor'],
        ['TypeScript', '5.5+', 'Lenguaje fuente del backend'],
        ['Express.js', '4.19+', 'Framework HTTP para la API REST'],
        ['JSON Web Token (jsonwebtoken)', '9.0+', 'Autenticación stateless con tokens firmados'],
        ['bcryptjs', '2.4+', 'Hash seguro de contraseñas'],
        ['pg (node-postgres)', '8.12+', 'Driver de conexión a PostgreSQL'],
        ['firebase-admin', '14.0+', 'SDK de Firebase para envío de push notifications (FCM)'],
        ['dotenv', '16+', 'Gestión de variables de entorno'],
        ['cors', '2.8+', 'Habilitación de Cross-Origin Resource Sharing'],
        ['ts-node-dev', '2.0+', 'Hot reload para desarrollo en TypeScript'],
    ]
    be_col_w = [CONTENT_W*0.33, CONTENT_W*0.17, CONTENT_W*0.50]
    story.append(colored_table(be_data, be_col_w, CYAN_DIM))
    story.append(spacer(0.4))

    # 2.4 Base de datos
    story.append(subsection('2.4  Base de Datos'))
    story.append(spacer(0.1))

    db_data = [
        ['Tecnología', 'Proveedor', 'Función'],
        ['PostgreSQL 15+', 'Supabase (cloud)', 'Base de datos relacional principal'],
        ['SQL DDL (CREATE TABLE, INDEX)', '—', 'Definición de esquema y optimización'],
        ['JSONB', 'PostgreSQL nativo', 'Almacenamiento flexible del payload de comandos'],
        ['Timestamps con zona horaria', 'PostgreSQL nativo', 'Trazabilidad temporal de eventos'],
    ]
    db_col_w = [CONTENT_W*0.30, CONTENT_W*0.25, CONTENT_W*0.45]
    story.append(colored_table(db_data, db_col_w, colors.HexColor('#0f4c75')))
    story.append(spacer(0.4))

    # 2.5 Infraestructura
    story.append(subsection('2.5  Infraestructura y Servicios Externos'))
    story.append(spacer(0.1))

    infra_data = [
        ['Servicio', 'Rol'],
        ['Firebase (Google)', 'Envío de notificaciones push a dispositivos Android (FCM)'],
        ['Supabase', 'Base de datos PostgreSQL como servicio (cloud)'],
        ['Apple Push Notification Service (APNs)', 'Notificaciones push a dispositivos iOS'],
        ['TLS 1.3 / HTTPS', 'Cifrado de todas las comunicaciones en tránsito'],
        ['ECDSA P-256', 'Firma criptográfica asimétrica de comandos'],
    ]
    infra_col_w = [CONTENT_W*0.38, CONTENT_W*0.62]
    story.append(colored_table(infra_data, infra_col_w, colors.HexColor('#1e3a5f')))
    story.append(spacer(0.5))

    # ══════════════════════════════════════════════════════════════════════
    # 3. ARQUITECTURA DEL SISTEMA
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_title('3.  Arquitectura del Sistema', '🏗️'))
    story.append(hr(CYAN, 1.2))
    story.append(spacer(0.1))

    story.append(body(
        'El sistema sigue una arquitectura de <b>tres capas desacopladas</b> que se comunican '
        'mediante HTTP/REST y notificaciones push asíncronas (FCM/APNs):'
    ))
    story.append(spacer(0.2))

    arch_data = [
        ['Capa', 'Componente', 'Tecnología', 'Comunicación'],
        ['Presentación', 'Panel Web Admin', 'React + TypeScript + Vite', 'HTTP REST (fetch API)'],
        ['Lógica de Negocio', 'API Backend', 'Node.js + Express + TypeScript', 'JWT + TLS 1.3'],
        ['Datos', 'Base de Datos', 'PostgreSQL (Supabase)', 'Driver pg (TCP/SSL)'],
        ['Dispositivos', 'App Móvil (cliente)', 'Android / iOS', 'FCM / APNs + HTTPS'],
        ['Notificaciones', 'Firebase Admin', 'firebase-admin SDK', 'Push silencioso (FCM)'],
    ]
    arch_col_w = [CONTENT_W*0.18, CONTENT_W*0.22, CONTENT_W*0.30, CONTENT_W*0.30]
    story.append(colored_table(arch_data, arch_col_w, DARK_BG))
    story.append(spacer(0.4))

    # ══════════════════════════════════════════════════════════════════════
    # 4. ESTRUCTURA DEL PROYECTO
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_title('4.  Estructura de Directorios del Proyecto', '📁'))
    story.append(hr(CYAN, 1.2))
    story.append(spacer(0.1))

    dir_data = [
        ['Directorio / Archivo', 'Descripción'],
        ['src/', 'Código fuente del backend Node.js + TypeScript'],
        ['src/server.ts', 'Punto de entrada del servidor Express'],
        ['src/controllers/', 'Controladores de rutas (lógica de dispositivos y comandos)'],
        ['src/routes/', 'Definición de rutas de la API REST'],
        ['src/middlewares/', 'Middlewares: autenticación JWT, validaciones'],
        ['src/config/', 'Configuración de base de datos y Firebase'],
        ['src/db/', 'Módulo de conexión a PostgreSQL'],
        ['frontend/', 'Aplicación web React (Panel de Administración)'],
        ['frontend/src/App.tsx', 'Componente raíz — toda la UI del panel'],
        ['frontend/src/index.css', 'Design system — variables CSS, temas, componentes'],
        ['frontend/index.html', 'HTML base con fuentes Google (Inter, JetBrains Mono)'],
        ['schema.sql', 'Esquema SQL de la base de datos (tablas, índices, seed)'],
        ['android/', 'Proyecto de la aplicación cliente Android (cliente MDM)'],
        ['mobile-app/', 'Proyecto de app móvil multiplataforma'],
        ['firebase-service-account.json', 'Credenciales de servicio Firebase (confidencial)'],
        ['.env', 'Variables de entorno (DB_URL, JWT_SECRET, PORT…)'],
        ['package.json', 'Dependencias y scripts del backend'],
        ['tsconfig.json', 'Configuración del compilador TypeScript'],
    ]
    dir_col_w = [CONTENT_W*0.42, CONTENT_W*0.58]
    story.append(colored_table(dir_data, dir_col_w, GRAY_700))
    story.append(spacer(0.5))

    # ══════════════════════════════════════════════════════════════════════
    # 5. FUNCIONALIDADES DEL PANEL WEB
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_title('5.  Funcionalidades del Panel Web', '💻'))
    story.append(hr(CYAN, 1.2))
    story.append(spacer(0.1))

    func_data = [
        ['Vista', 'Funcionalidades incluidas', 'Estado'],
        ['📊 Dashboard', 'KPIs en tiempo real, consola de comandos, log de actividad,\ntabla de dispositivos con búsqueda', '✅ Activo'],
        ['💳 Créditos', 'Registro de ventas, seguimiento de cuotas, marcado de pagos,\nbloqueo manual por mora, progreso visual', '✅ Activo'],
        ['📅 Calendario', 'Vista mensual de pagos, puntos de color por estado,\nlista de cuotas del mes seleccionado', '✅ Activo'],
        ['🔔 Alertas', 'Listado de moras críticas (≥2 días), ordenadas por severidad,\nacceso rápido a bloqueo', '✅ Activo'],
    ]
    func_col_w = [CONTENT_W*0.18, CONTENT_W*0.63, CONTENT_W*0.19]
    story.append(colored_table(func_data, func_col_w, NAVY,
        row_colors=[(1,2,ACCENT_BG2,EMERALD),(2,2,ACCENT_BG2,EMERALD),
                    (3,2,ACCENT_BG2,EMERALD),(4,2,ACCENT_BG2,EMERALD)]))
    story.append(spacer(0.5))

    # ══════════════════════════════════════════════════════════════════════
    # 6. ESQUEMA DE BASE DE DATOS
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_title('6.  Esquema de Base de Datos', '🗄️'))
    story.append(hr(CYAN, 1.2))
    story.append(spacer(0.1))

    story.append(subsection('Tabla: devices'))
    story.append(spacer(0.05))
    dev_tbl_data = [
        ['Campo', 'Tipo', 'Descripción'],
        ['id', 'SERIAL PK', 'Identificador único autoincremental'],
        ['serial_number', 'VARCHAR(100) UNIQUE', 'Número de serie del dispositivo'],
        ['imei', 'VARCHAR(50)', 'IMEI del equipo móvil'],
        ['brand / model', 'VARCHAR', 'Marca y modelo del dispositivo'],
        ['status', "VARCHAR CHECK ('active','locked',\n'suspended','wiped')", 'Estado actual del equipo'],
        ['customer_name / phone', 'VARCHAR', 'Datos de contacto del cliente'],
        ['device_token', 'TEXT NOT NULL', 'Token JWT de autenticación de hardware'],
        ['last_sync_at', 'TIMESTAMPTZ', 'Último check-in del dispositivo'],
        ['created_at', 'TIMESTAMPTZ', 'Fecha de registro en el sistema'],
    ]
    dev_col_w = [CONTENT_W*0.25, CONTENT_W*0.32, CONTENT_W*0.43]
    story.append(colored_table(dev_tbl_data, dev_col_w, colors.HexColor('#0f4c75')))
    story.append(spacer(0.3))

    story.append(subsection('Tabla: commands'))
    story.append(spacer(0.05))
    cmd_tbl_data = [
        ['Campo', 'Tipo', 'Descripción'],
        ['id', 'SERIAL PK', 'Identificador único del comando'],
        ['device_id', 'INTEGER FK → devices', 'Dispositivo al que se dirige el comando'],
        ['type', "VARCHAR CHECK ('lock','unlock','wipe')", 'Tipo de acción a ejecutar'],
        ['status', "VARCHAR CHECK ('pending','sent',\n'executed','failed')", 'Estado de ejecución del comando'],
        ['signature', 'TEXT NOT NULL', 'Firma criptográfica ECDSA del backend'],
        ['token', 'VARCHAR(100)', 'Nonce único anti-replay attack'],
        ['payload', 'JSONB', 'Datos del comando (ej. mensaje en pantalla)'],
        ['executed_at', 'TIMESTAMPTZ', 'Momento de ejecución en el dispositivo'],
        ['created_at', 'TIMESTAMPTZ', 'Momento de creación del comando'],
    ]
    cmd_col_w = [CONTENT_W*0.25, CONTENT_W*0.32, CONTENT_W*0.43]
    story.append(colored_table(cmd_tbl_data, cmd_col_w, colors.HexColor('#0f4c75')))
    story.append(spacer(0.5))

    # ══════════════════════════════════════════════════════════════════════
    # 7. SEGURIDAD
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_title('7.  Modelo de Seguridad', '🔒'))
    story.append(hr(CYAN, 1.2))
    story.append(spacer(0.1))

    sec_data = [
        ['Mecanismo', 'Implementación', 'Cobertura'],
        ['Autenticación API', 'JWT (JSON Web Tokens) firmados', 'Todos los endpoints REST'],
        ['Cifrado en tránsito', 'TLS 1.3 / HTTPS obligatorio', 'Backend ↔ Frontend ↔ Móvil'],
        ['Firmas de comandos', 'ECDSA con curva P-256', 'Comandos lock/unlock/wipe'],
        ['Tokens anti-replay', 'Nonce único por comando', 'Capa de comandos MDM'],
        ['Certificate Pinning', 'Network Security Config (Android)', 'App móvil cliente'],
        ['Hash de contraseñas', 'bcryptjs (cost factor 10+)', 'Credenciales de administradores'],
        ['Attestation API', 'Play Integrity API (Android)', 'Verificación de integridad del app'],
        ['Detección Root/Jailbreak', 'Detección en runtime de Magisk/Cydia', 'App móvil cliente'],
    ]
    sec_col_w = [CONTENT_W*0.28, CONTENT_W*0.38, CONTENT_W*0.34]
    story.append(colored_table(sec_data, sec_col_w, GRAY_900))
    story.append(spacer(0.5))

    # ══════════════════════════════════════════════════════════════════════
    # 8. ROADMAP DE PRODUCCIÓN
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_title('8.  Roadmap hacia Producción', '🚀'))
    story.append(hr(CYAN, 1.2))
    story.append(spacer(0.1))

    road_data = [
        ['#', 'Módulo', 'Descripción', 'Estado'],
        ['1', '📱 App Android Real',
         'Implementar Device Owner Mode (MDM), bloqueo de pantalla con\nsuperposición, prevención de desinstalación y formateo.',
         '⏳ Pendiente'],
        ['2', '🔒 Auth Estricta',
         'Login de administradores con tabla users en Supabase,\neliminar token de prueba, firmas criptográficas reales.',
         '⏳ Pendiente'],
        ['3', '⚡ Push FCM Real',
         'Reemplazar polling (8s) por notificaciones push silenciosas\nde Firebase Cloud Messaging para bloqueo instantáneo.',
         '⏳ Pendiente'],
        ['4', '💼 Panel Empresarial',
         'Registro de inventario por IMEI, historial de auditoría\ninalterable, actualización en tiempo real con WebSockets.',
         '⏳ Pendiente'],
    ]
    road_col_w = [CONTENT_W*0.05, CONTENT_W*0.22, CONTENT_W*0.55, CONTENT_W*0.18]
    story.append(colored_table(road_data, road_col_w, DARK_BG))
    story.append(spacer(0.5))

    # ══════════════════════════════════════════════════════════════════════
    # 9. CONFIGURACIÓN DEL ENTORNO
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_title('9.  Configuración del Entorno', '⚙️'))
    story.append(hr(CYAN, 1.2))
    story.append(spacer(0.1))

    story.append(subsection('Variables de Entorno requeridas (.env)'))
    story.append(spacer(0.1))

    env_data = [
        ['Variable', 'Descripción', 'Ejemplo'],
        ['PORT', 'Puerto del servidor Express', '3000'],
        ['DATABASE_URL', 'URL de conexión a Supabase/PostgreSQL', 'postgresql://user:pass@host/db'],
        ['JWT_SECRET', 'Secreto para firmar tokens JWT', 'clave_secreta_256_bits'],
        ['FIREBASE_SA_KEY', 'Ruta al archivo de credenciales Firebase', './firebase-service-account.json'],
        ['NODE_ENV', 'Entorno de ejecución', 'production / development'],
    ]
    env_col_w = [CONTENT_W*0.25, CONTENT_W*0.45, CONTENT_W*0.30]
    story.append(colored_table(env_data, env_col_w, GRAY_700))
    story.append(spacer(0.3))

    story.append(subsection('Comandos de ejecución'))
    story.append(spacer(0.05))
    cmds = [
        '# Instalar dependencias del backend',
        'npm install',
        '',
        '# Iniciar backend en modo desarrollo',
        'npm run dev',
        '',
        '# Instalar y ejecutar el frontend',
        'cd frontend && npm install && npm run dev',
        '',
        '# Compilar para producción',
        'npm run build && node dist/server.js',
    ]
    for cmd in cmds:
        story.append(Paragraph(cmd if cmd else ' ', s_code))
    story.append(spacer(0.5))

    # ══════════════════════════════════════════════════════════════════════
    # 10. CONCLUSIONES
    # ══════════════════════════════════════════════════════════════════════
    story.append(section_title('10.  Conclusiones', '✅'))
    story.append(hr(CYAN, 1.2))
    story.append(spacer(0.1))

    concl = [
        ('El sistema FinControl cuenta con un <b>stack tecnológico moderno y robusto</b>, '
         'centrado en TypeScript como lenguaje principal tanto en frontend como en backend.'),
        ('La arquitectura de tres capas desacopladas permite <b>escalabilidad independiente</b> '
         'de cada componente sin afectar a los demás.'),
        ('El modelo de seguridad basado en JWT + TLS 1.3 + ECDSA proporciona una <b>defensa '
         'en profundidad</b> adecuada para el manejo de activos financieros.'),
        ('El sistema está en fase de <b>prototipo funcional</b> y requiere la implementación '
         'de los 4 pilares del roadmap antes de su despliegue en producción.'),
        ('La integración con Firebase (FCM) y Supabase posiciona al sistema para una <b>fácil '
         'escalabilidad cloud</b> sin infraestructura propia.'),
    ]
    for i, c in enumerate(concl, 1):
        story.append(Paragraph(
            f'<font color="#{CYAN.hexval()[2:]}"><b>{i}.</b></font>  {c}', s_body))
        story.append(spacer(0.15))

    story.append(spacer(0.6))
    story.append(hr(CYAN_DIM, 0.8))
    story.append(spacer(0.2))
    story.append(Paragraph(
        'Documento generado automáticamente por el sistema de reportes de '
        '<b>CodeCraft Programming Forge</b>. Para información adicional contactar al '
        'equipo de desarrollo.',
        s_footer))
    story.append(spacer(0.1))
    story.append(Paragraph(f'Generado el {DATE_STR} a las {TIME_STR}', s_footer))

    # ── Build ──────────────────────────────────────────────────────────────
    def on_first_page(c, doc):
        build_cover(c, doc)

    def on_later_pages(c, doc):
        header_footer(c, doc)

    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
    print(f'\n✅  PDF generado exitosamente:\n   {OUTPUT_PDF}\n')

if __name__ == '__main__':
    build_pdf()
