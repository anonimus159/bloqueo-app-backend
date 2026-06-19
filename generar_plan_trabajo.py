import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image
from reportlab.pdfgen import canvas

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
        
        # Omit header and footer on cover page (page 1)
        if self._pageNumber == 1:
            self.restoreState()
            return

        # Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0f172a")) # Slate 900
        self.drawString(54, 750, "PLAN DE TRABAJO: SISTEMA DE CONTROL DE DISPOSITIVOS FINANCIADOS")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1")) # Slate 300
        self.setLineWidth(0.5)
        self.line(54, 742, letter[0] - 54, 742)

        # Footer
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b")) # Slate 500
        page_text = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(letter[0] - 54, 40, page_text)
        self.drawString(54, 40, "Confidencial - Hoja de Ruta de Implementación")
        self.line(54, 52, letter[0] - 54, 52)
        
        self.restoreState()

def draw_cover_background(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#0f172a")) # Slate 900
    canvas.rect(0, 0, letter[0], letter[1], fill=True, stroke=False)
    canvas.restoreState()

def build_pdf(filename="Plan_Metodologia_Implementacion_Dispositivos.pdf"):
    # Margins: 0.75 inch (54 points). Top margin 72 points to leave space for header.
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom styles to look premium
    primary_color = colors.HexColor("#0f172a") # Dark Slate
    secondary_color = colors.HexColor("#38bdf8") # Light Blue Accent for dark background
    body_text_color = colors.HexColor("#334155") # Slate 700
    
    styles.add(ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=28,
        textColor=colors.white,
        spaceAfter=15,
        alignment=1 # Centered
    ))

    styles.add(ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#cbd5e1"), # Light Slate
        spaceAfter=40,
        alignment=1 # Centered
    ))

    styles.add(ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=14,
        textColor=colors.HexColor("#94a3b8"), # Slate 400
        alignment=1 # Centered
    ))

    styles.add(ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=primary_color,
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'SubsectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#2563eb"), # Royal Blue for body
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'PremiumBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=body_text_color,
        spaceAfter=8
    ))

    styles.add(ParagraphStyle(
        'PremiumBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=body_text_color,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=5
    ))

    story = []

    # --- COVER PAGE ---
    logo_path = "logo_codecraft.png"
    if os.path.exists(logo_path):
        # Center the logo using a Table
        logo_img = Image(logo_path, width=240, height=160)
        logo_table = Table([[logo_img]], colWidths=[doc.width])
        logo_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(Spacer(1, 40))
        story.append(logo_table)
        story.append(Spacer(1, 40))
    else:
        story.append(Spacer(1, 100))
        # Elegant blue accent line on cover
        accent_bar = Table([[""]], colWidths=[100], rowHeights=[6])
        accent_bar.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), secondary_color),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(accent_bar)
        story.append(Spacer(1, 15))
    
    story.append(Paragraph("PLAN DE TRABAJO Y METODOLOGÍA DE IMPLEMENTACIÓN", styles['CoverTitle']))
    story.append(Paragraph("Hoja de Ruta, Cronograma de Fases y Gestión del Proyecto para la Venta de Dispositivos a Crédito", styles['CoverSubtitle']))
    
    story.append(Spacer(1, 100))
    story.append(Paragraph("<b>Preparado por:</b> CodeCraft Programming Forge", styles['CoverMeta']))
    story.append(Paragraph("<b>Rol:</b> Dirección de Proyectos e Ingeniería de Software", styles['CoverMeta']))
    story.append(Paragraph("<b>Fecha:</b> Junio 2026", styles['CoverMeta']))
    story.append(Paragraph("<b>Versión:</b> 1.0.0 (Documento Metodológico)", styles['CoverMeta']))
    story.append(PageBreak())

    # --- SECTION 1 ---
    story.append(Paragraph("1. Metodología de Trabajo Ágil (Scrum)", styles['SectionHeading']))
    story.append(Paragraph(
        "Para garantizar un desarrollo eficiente, transparente y sin desviaciones sobre los requisitos, aplicaremos la metodología ágil **Scrum**. "
        "El proyecto se dividirá en ciclos iterativos de desarrollo llamados **Sprints**, con una duración fija de **2 semanas** por ciclo. "
        "Este enfoque permite realizar entregas funcionales continuas y adaptar el diseño ante eventualidades del negocio o cambios de alcance sugeridos por el cliente.",
        styles['PremiumBody']
    ))
    story.append(Paragraph(
        "Mecanismos clave de comunicación y control durante el proyecto:",
        styles['PremiumBody']
    ))
    story.append(Paragraph("• <b>Reunión de Planificación (Sprint Planning):</b> Al inicio de cada sprint, nos reuniremos con el cliente para definir las funcionalidades exactas que se desarrollarán en las siguientes 2 semanas.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Demos y Revisiones (Sprint Review):</b> Al finalizar cada sprint, presentaremos una demostración en vivo de las funcionalidades completadas para recibir feedback directo e inmediato del cliente.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Canal de Comunicación Directo:</b> Creación de un espacio en Teams/Slack para comunicación diaria, resolución de dudas operativas y reportes rápidos de estado.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Repositorio Privado en GitHub:</b> Todo el código fuente estará alojado en repositorios privados y se dará acceso al equipo técnico del cliente para transparencia absoluta.", styles['PremiumBullet']))
    story.append(Spacer(1, 10))

    # --- SECTION 2 ---
    story.append(Paragraph("2. Cronograma Estimado de Fases", styles['SectionHeading']))
    story.append(Paragraph(
        "La ejecución del proyecto está planificada para completarse en un período estimado de **12 semanas** (3 meses), dividida en las siguientes fases lógicas de ingeniería:",
        styles['PremiumBody']
    ))
    
    # Table of timeline
    timeline_data = [
        [Paragraph("<b>Fase del Proyecto</b>", styles['PremiumBody']), Paragraph("<b>Duración</b>", styles['PremiumBody']), Paragraph("<b>Sprints Asociados</b>", styles['PremiumBody']), Paragraph("<b>Objetivo Principal</b>", styles['PremiumBody'])],
        [
            Paragraph("Fase 1: Infraestructura y Enrolamiento", styles['PremiumBody']),
            Paragraph("Semanas 1 y 2", styles['PremiumBody']),
            Paragraph("Sprint 1", styles['PremiumBody']),
            Paragraph("Registrar la empresa en ABM/Google Enterprise, aprovisionar servidores y bases de datos, y crear la estructura base de la API.", styles['PremiumBody'])
        ],
        [
            Paragraph("Fase 2: Agente Móvil y Políticas", styles['PremiumBody']),
            Paragraph("Semanas 3 a 6", styles['PremiumBody']),
            Paragraph("Sprint 2 y 3", styles['PremiumBody']),
            Paragraph("Desarrollar la app Android (Device Owner), configurar perfiles iOS MDM, e integrar Knox Guard. Implementar mecanismos anti-formateo.", styles['PremiumBody'])
        ],
        [
            Paragraph("Fase 3: Backend, Admin Web y Pagos", styles['PremiumBody']),
            Paragraph("Semanas 7 a 9", styles['PremiumBody']),
            Paragraph("Sprint 4 y 5", styles['PremiumBody']),
            Paragraph("Desarrollar el panel web administrativo, el servicio de envío de comandos (Push/APNs/FCM) y los Webhooks de pago para automatización.", styles['PremiumBody'])
        ],
        [
            Paragraph("Fase 4: Auditoría, Estrés y Despliegue", styles['PremiumBody']),
            Paragraph("Semanas 10 a 12", styles['PremiumBody']),
            Paragraph("Sprint 6", styles['PremiumBody']),
            Paragraph("Pruebas de evasión de bloqueo (Root, Jailbreak, Modo Recovery), endurecimiento, ofuscación de código y pase final a producción.", styles['PremiumBody'])
        ]
    ]

    t_timeline = Table(timeline_data, colWidths=[1.8*inch, 1.0*inch, 1.2*inch, 2.5*inch])
    t_timeline.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_timeline)
    story.append(Spacer(1, 10))
    story.append(PageBreak())

    # --- SECTION 3 ---
    story.append(Paragraph("3. Roles y Responsabilidades en el Proyecto", styles['SectionHeading']))
    story.append(Paragraph(
        "Para el correcto flujo de desarrollo, se conformará un equipo de trabajo con los siguientes roles asignados por parte de CodeCraft y los compromisos requeridos por el Cliente:",
        styles['PremiumBody']
    ))
    
    story.append(Paragraph("Equipo CodeCraft", styles['SubsectionHeading']))
    story.append(Paragraph("• <b>Director de Proyecto / Scrum Master:</b> Encargado de liderar las planificaciones, verificar el cumplimiento de fechas de entrega y servir de puente de comunicación constante con el cliente.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Desarrollador Móvil Senior (Android/iOS):</b> Responsable de programar el WPC (Android Device Owner), integrar el SDK de Samsung Knox y empaquetar los perfiles MDM de iOS bajo los estándares empresariales.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Desarrollador Backend & Fullstack:</b> Encargado del diseño de la Base de Datos, construcción de la API REST cifrada, panel web de administración y Webhooks de pasarelas de pago.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Ingeniero de Calidad (QA / Ciberseguridad):</b> Diseña y ejecuta planes de prueba de evasión, intentando burlar las restricciones para asegurar que el sistema final sea verdaderamente robusto.", styles['PremiumBullet']))

    story.append(Paragraph("Responsabilidades Clave del Cliente", styles['SubsectionHeading']))
    story.append(Paragraph("• <b>Registro Corporativo en Apple y Google:</b> Proveer la documentación legal de la empresa para habilitar la consola de Apple Business Manager (D-U-N-S Number requerido) y Android Enterprise. Este trámite es indispensable y debe iniciarse en la Semana 1.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Pasarela de Pagos:</b> Suministrar accesos de sandbox/producción y las llaves de API de la pasarela de pagos seleccionada para realizar la integración técnica de los Webhooks.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Validación y Retroalimentación:</b> Asistir a las demos al final de cada sprint para aprobar los entregables y evitar reprocesos.", styles['PremiumBullet']))
    story.append(Spacer(1, 10))

    # --- SECTION 4 ---
    story.append(Paragraph("4. Entregables Finales y Garantía de Software", styles['SectionHeading']))
    story.append(Paragraph(
        "Al finalizar las 12 semanas de desarrollo y tras la firma de aceptación en producción, CodeCraft entregará oficialmente al cliente los siguientes activos de software:",
        styles['PremiumBody']
    ))
    story.append(Paragraph("• <b>Código Fuente Completo:</b> Entrega del repositorio Git con el backend, frontend web y código de la app móvil sin encriptaciones propietarias ni dependencias de suscripción externa con nosotros. El cliente es dueño del software.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Manual de Aprovisionamiento y Soporte:</b> Guía paso a paso ilustrada para que el personal en los puntos de venta pueda enrolar correctamente los dispositivos nuevos (tanto Android como iOS).", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Garantía de Software (6 Meses):</b> Cobertura completa de soporte preventivo y correctivo ante fallos inesperados de la aplicación, bugs de código o actualizaciones del sistema operativo móvil que requieran parches de compatibilidad sin costo adicional.", styles['PremiumBullet']))

    # Build document with cover background callback
    doc.build(story, onFirstPage=draw_cover_background, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    build_pdf()
    print("PDF del Plan de Trabajo creado exitosamente.")
