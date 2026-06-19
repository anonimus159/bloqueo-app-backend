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
        self.drawString(54, 750, "PROPUESTA DE ARQUITECTURA: CONTROL DE DISPOSITIVOS FINANCIADOS")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1")) # Slate 300
        self.setLineWidth(0.5)
        self.line(54, 742, letter[0] - 54, 742)

        # Footer
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b")) # Slate 500
        page_text = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(letter[0] - 54, 40, page_text)
        self.drawString(54, 40, "Confidencial - Propiedad de la Empresa")
        self.line(54, 52, letter[0] - 54, 52)
        
        self.restoreState()

def draw_cover_background(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#0f172a")) # Slate 900
    canvas.rect(0, 0, letter[0], letter[1], fill=True, stroke=False)
    canvas.restoreState()

def build_pdf(filename="Propuesta_Arquitectura_Seguridad_Dispositivos.pdf"):
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
    
    story.append(Paragraph("SISTEMA DE CONTROL DE DISPOSITIVOS MÓVILES FINANCIADOS", styles['CoverTitle']))
    story.append(Paragraph("Diseño de Arquitectura Tecnológica y Seguridad de Extremo a Extremo para Venta de Terminales a Crédito", styles['CoverSubtitle']))
    
    story.append(Spacer(1, 100))
    story.append(Paragraph("<b>Preparado por:</b> CodeCraft Programming Forge", styles['CoverMeta']))
    story.append(Paragraph("<b>Rol:</b> Arquitecto de Software Senior & Experto en Seguridad Móvil", styles['CoverMeta']))
    story.append(Paragraph("<b>Fecha:</b> Junio 2026", styles['CoverMeta']))
    story.append(Paragraph("<b>Versión:</b> 1.0.0 (Propuesta Técnica)", styles['CoverMeta']))
    story.append(PageBreak())

    # --- SECTION 1 ---
    story.append(Paragraph("1. Introducción y Metodología de Trabajo", styles['SectionHeading']))
    story.append(Paragraph(
        "Este documento técnico describe detalladamente la arquitectura propuesta para mitigar el riesgo de impago en la comercialización de teléfonos móviles financiados. "
        "El enfoque principal reside en el uso de herramientas empresariales y APIs nativas oficiales proporcionadas por Google, Apple y fabricantes de hardware como Samsung. "
        "Esto garantiza que las restricciones de bloqueo no puedan ser evadidas mediante técnicas ordinarias y que la aplicación cumpla plenamente con los términos de servicio y políticas de seguridad vigentes.",
        styles['PremiumBody']
    ))
    story.append(Paragraph(
        "El desarrollo del proyecto se ejecutará en cuatro fases clave bajo una metodología ágil (Scrum):",
        styles['PremiumBody']
    ))
    story.append(Paragraph("• <b>Fase 1: Diseño e Infraestructura Base:</b> Configuración del entorno de base de datos, APIs de comunicación segura, registro en Apple Business Manager y consolas de Android Enterprise.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Fase 2: Desarrollo del Agente de Control Móvil:</b> Implementación de los módulos de restricciones en los dispositivos usando las APIs oficiales de MDM y Android Enterprise.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Fase 3: Panel de Control y Automatizaciones:</b> Desarrollo de la interfaz administrativa web e integración automatizada con pasarelas de pago para procesamiento inmediato de comandos de desbloqueo.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Fase 4: Auditoría de Seguridad y Despliegue:</b> Pruebas de penetración, pruebas de bypass de Root/Jailbreak, endurecimiento de código (ofuscación) y lanzamiento a producción.", styles['PremiumBullet']))
    story.append(Spacer(1, 10))

    # --- SECTION 2 ---
    story.append(Paragraph("2. Arquitectura del Cliente Móvil", styles['SectionHeading']))
    story.append(Paragraph(
        "Debido al aislamiento de aplicaciones (sandboxing) en sistemas operativos modernos, las aplicaciones estándar descargadas de las tiendas no tienen permisos para realizar bloqueos de pantalla o prevenir la desinstalación. "
        "Por ende, se estructuran dos soluciones específicas para cada plataforma:",
        styles['PremiumBody']
    ))
    
    story.append(Paragraph("Plataforma Android", styles['SubsectionHeading']))
    story.append(Paragraph(
        "Para dispositivos Android, se implementa el modo <b>Device Owner</b> (Propietario del Dispositivo) a través de la infraestructura de Android Enterprise. "
        "Durante el primer encendido del dispositivo, se realiza el aprovisionamiento mediante escaneo de código QR o enrolamiento automático (Zero-Touch Enrollment). Esto le otorga a la app privilegios a nivel de sistema para:",
        styles['PremiumBody']
    ))
    story.append(Paragraph("• Impedir la desinstalación de la aplicación de control.", styles['PremiumBullet']))
    story.append(Paragraph("• Deshabilitar el restablecimiento de valores de fábrica (Factory Reset).", styles['PremiumBullet']))
    story.append(Paragraph("• Restringir la instalación de aplicaciones no autorizadas o el acceso a la depuración USB (ADB).", styles['PremiumBullet']))
    story.append(Paragraph("• Para dispositivos Samsung, se integrará adicionalmente el SDK de <b>Knox Guard</b>, el cual añade protección persistente vinculada al hardware y al número de serie del dispositivo, reactivando los bloqueos inmediatamente si el usuario realiza un formateo de bajo nivel.", styles['PremiumBullet']))
    
    story.append(Paragraph("Plataforma iOS (Apple)", styles['SubsectionHeading']))
    story.append(Paragraph(
        "En iOS no se despliega un agente autónomo de bloqueo. En su lugar, el dispositivo debe ser enrolado en modo <b>Supervisado</b> vinculándolo a una cuenta corporativa de <b>Apple Business Manager (ABM)</b>. "
        "Un servidor MDM (Mobile Device Management) propio se encarga de enviar políticas restrictivas directamente al kernel del sistema operativo mediante perfiles de configuración no removibles. "
        "Cuando ocurre un impago, el backend envía un comando MDM para colocar el terminal en modo de aplicación única (Kiosk Mode), impidiendo su uso general.",
        styles['PremiumBody']
    ))
    story.append(Spacer(1, 10))
    story.append(PageBreak())

    # --- SECTION 3 ---
    story.append(Paragraph("3. Seguridad de Red y API de Comunicaciones", styles['SectionHeading']))
    story.append(Paragraph(
        "La integridad de los comandos de bloqueo y desbloqueo es crítica. Para evitar que usuarios avanzados intercepten las comunicaciones o emulen servidores de validación falsos, se configuran las siguientes medidas:",
        styles['PremiumBody']
    ))
    story.append(Paragraph("• <b>Cifrado de Tránsito (TLS 1.3):</b> Toda la comunicación viaja exclusivamente por HTTPS utilizando TLS 1.3 con suites de cifrado seguras.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Certificate Pinning:</b> Se embeben los hashes de la clave pública del certificado SSL en el binario de la aplicación móvil. Si el usuario intenta usar un proxy para analizar o modificar las peticiones, la app rechazará la conexión de inmediato.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Firma Asimétrica de Comandos:</b> Los comandos críticos de bloqueo y desbloqueo son firmados en el backend usando una clave privada mediante el algoritmo criptográfico <b>ECDSA (curva P-256)</b>. La aplicación cliente valida localmente que la firma del comando corresponda a la clave pública autorizada antes de ejecutar la acción.", styles['PremiumBullet']))
    story.append(Paragraph("• <b>Arquitectura de Comunicación Híbrida:</b> Se envían alertas prioritarias (push silenciosos) a través de Firebase Cloud Messaging (FCM) y Apple Push Notification service (APNs). El dispositivo recibe la notificación y realiza una consulta síncrona a la API central para descargar y procesar las órdenes firmadas.", styles['PremiumBullet']))
    story.append(Spacer(1, 10))

    # --- SECTION 4 ---
    story.append(Paragraph("4. Resumen de Controles de Seguridad", styles['SectionHeading']))
    story.append(Paragraph(
        "La siguiente tabla resume los riesgos operativos identificados y las salvaguardas tecnológicas planteadas en el diseño:",
        styles['PremiumBody']
    ))
    story.append(Spacer(1, 5))

    # Table of controls
    table_data = [
        [Paragraph("<b>Riesgo / Amenaza</b>", styles['PremiumBody']), Paragraph("<b>Salvaguarda Tecnológica</b>", styles['PremiumBody']), Paragraph("<b>Mecanismo de Control</b>", styles['PremiumBody'])],
        [
            Paragraph("Desinstalación de la App", styles['PremiumBody']),
            Paragraph("Device Owner / MDM Profile", styles['PremiumBody']),
            Paragraph("Restricciones nativas del SO impiden la remoción sin credenciales de administrador.", styles['PremiumBody'])
        ],
        [
            Paragraph("Formateo Físico (Factory Reset)", styles['PremiumBody']),
            Paragraph("Knox Guard / ABM Enrollment / Políticas de Seguridad", styles['PremiumBody']),
            Paragraph("Deshabilitación de la opción en menú. Reactivación automática del bloqueo al reconectar a internet en el arranque.", styles['PremiumBody'])
        ],
        [
            Paragraph("Interceptación de Tráfico (MITM)", styles['PremiumBody']),
            Paragraph("TLS 1.3 + Certificate Pinning", styles['PremiumBody']),
            Paragraph("Validación estricta de certificados TLS. La app no confía en certificados locales de usuario.", styles['PremiumBody'])
        ],
        [
            Paragraph("Suplantación de Comandos", styles['PremiumBody']),
            Paragraph("Firma Criptográfica Asimétrica (ECDSA)", styles['PremiumBody']),
            Paragraph("Cada orden debe estar firmada por el servidor. La app rechaza payloads sin firma válida.", styles['PremiumBody'])
        ],
        [
            Paragraph("Ingeniería Inversa del Código", styles['PremiumBody']),
            Paragraph("Ofuscación (R8/DexGuard/SwiftShield)", styles['PremiumBody']),
            Paragraph("Dificulta el análisis estático del binario, el descifrado de cadenas y el flujo de llamadas.", styles['PremiumBody'])
        ],
        [
            Paragraph("Ejecución en Emuladores / Dispositivos Modificados", styles['PremiumBody']),
            Paragraph("Play Integrity / App Attest / Detección de Root", styles['PremiumBody']),
            Paragraph("Evaluación en tiempo de ejecución del estado del hardware. Denegación de servicio en terminales rooteados.", styles['PremiumBody'])
        ]
    ]

    t = Table(table_data, colWidths=[1.5*inch, 2.0*inch, 3.0*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    
    story.append(t)
    story.append(PageBreak())

    # --- SECTION 5 ---
    story.append(Paragraph("5. Propuesta Económica e Implementación", styles['SectionHeading']))
    story.append(Paragraph(
        "Para el desarrollo y puesta en marcha del sistema integral, se plantea un presupuesto optimizado basado en el uso de herramientas de código abierto (como MicroMDM para iOS) y configuraciones nativas de bajo costo, garantizando un precio altamente competitivo en el mercado colombiano sin comprometer la seguridad del aplicativo.",
        styles['PremiumBody']
    ))
    story.append(Paragraph(
        "<b>Comparativa de Valor y Referencia del Mercado:</b> Un desarrollo a la medida tradicional de esta complejidad técnica (MDM corporativo, seguridad criptográfica, integraciones de pago y apps nativas) suele cotizarse en la industria de software por un valor de <b>$ 28,000,000 COP</b>. No obstante, gracias al uso de infraestructura optimizada autohospedada, podemos presentar una oferta comercial muy agresiva y económica.",
        styles['PremiumBody']
    ))

    # Market reference table
    comp_data = [
        [Paragraph("<b>Modelo de Solución</b>", styles['PremiumBody']), Paragraph("<b>Valor de Referencia de Mercado</b>", styles['PremiumBody']), Paragraph("<b>Nuestra Propuesta Optimizada</b>", styles['PremiumBody'])],
        [
            Paragraph("Desarrollo a la Medida Corporativo (Estándar)", styles['PremiumBody']),
            Paragraph("$ 28,000,000 COP", styles['PremiumBody']),
            Paragraph("<b>$ 3,800,000 COP</b>", styles['PremiumBody'])
        ]
    ]
    t_comp = Table(comp_data, colWidths=[2.5*inch, 2.0*inch, 2.0*inch])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Presupuesto de Desarrollo (Pago Único)", styles['SubsectionHeading']))
    story.append(Paragraph(
        "El desarrollo del software se dividirá en entregables por fases asociados a los siguientes hitos de pago sobre nuestra tarifa optimizada de <b>$ 3,800,000 COP</b> (pago único, propiedad absoluta del código sin mensualidades por desarrollo):",
        styles['PremiumBody']
    ))

    # Table of costs
    cost_data = [
        [Paragraph("<b>Fase de Desarrollo</b>", styles['PremiumBody']), Paragraph("<b>Entregables Clave</b>", styles['PremiumBody']), Paragraph("<b>Valor (COP)</b>", styles['PremiumBody'])],
        [
            Paragraph("Fase 1: Infraestructura y Enrolamiento", styles['PremiumBody']),
            Paragraph("Registro ABM/Google Enterprise, diseño de BD, API Gateway y certificados SSL/APNs.", styles['PremiumBody']),
            Paragraph("$ 600,000", styles['PremiumBody'])
        ],
        [
            Paragraph("Fase 2: Agente Móvil y Políticas", styles['PremiumBody']),
            Paragraph("App Android Device Owner, integración Knox Guard y perfiles de restricción iOS.", styles['PremiumBody']),
            Paragraph("$ 1,500,000", styles['PremiumBody'])
        ],
        [
            Paragraph("Fase 3: Backend, Admin Web y Pagos", styles['PremiumBody']),
            Paragraph("Panel Web administrativo, API de comunicación cifrada e integración de pasarelas de pago.", styles['PremiumBody']),
            Paragraph("$ 1,200,000", styles['PremiumBody'])
        ],
        [
            Paragraph("Fase 4: Auditoría y Despliegue", styles['PremiumBody']),
            Paragraph("Pruebas de bypass de root/formateo, endurecimiento, ofuscación y paso a producción.", styles['PremiumBody']),
            Paragraph("$ 500,000", styles['PremiumBody'])
        ],
        [
            Paragraph("<b>VALOR TOTAL DE DESARROLLO</b>", styles['PremiumBody']),
            Paragraph("<b>Software llave en mano, propiedad del código fuente y 6 meses de garantía.</b>", styles['PremiumBody']),
            Paragraph("<b>$ 3,800,000 COP</b>", styles['PremiumBody'])
        ]
    ]

    t_costs = Table(cost_data, colWidths=[2.0*inch, 3.0*inch, 1.5*inch])
    t_costs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_costs)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Costos de Operación y Licencias de Terceros (No incluidos)", styles['SubsectionHeading']))
    story.append(Paragraph(
        "Para el funcionamiento continuo del sistema, el cliente final debe considerar los siguientes costos recurrentes que se pagan directamente a los proveedores de servicios (optimizados para iniciar con la infraestructura mínima y más económica):",
        styles['PremiumBody']
    ))

    recurrent_data = [
        [Paragraph("<b>Concepto</b>", styles['PremiumBody']), Paragraph("<b>Proveedor / Frecuencia</b>", styles['PremiumBody']), Paragraph("<b>Costo Estimado (COP)</b>", styles['PremiumBody'])],
        [
            Paragraph("Cuenta Apple Developer Program", styles['PremiumBody']),
            Paragraph("Apple / Pago Anual (Obligatorio para iOS)", styles['PremiumBody']),
            Paragraph("~ $ 400,000 / año (USD 99)", styles['PremiumBody'])
        ],
        [
            Paragraph("Cuenta Google Play Console", styles['PremiumBody']),
            Paragraph("Google / Pago Único (Obligatorio para Android)", styles['PremiumBody']),
            Paragraph("~ $ 100,000 (una sola vez) (USD 25)", styles['PremiumBody'])
        ],
        [
            Paragraph("Servidor Web, Base de Datos y MDM (Fase Inicial)", styles['PremiumBody']),
            Paragraph("DigitalOcean / Hetzner / Mensual (Servidor básico)", styles['PremiumBody']),
            Paragraph("<b>$ 30,000 a $ 80,000 / mes</b> (USD 8-20)", styles['PremiumBody'])
        ],
        [
            Paragraph("Licencias Samsung Knox Guard", styles['PremiumBody']),
            Paragraph("Samsung / Pago Anual por Celular (Opcional)", styles['PremiumBody']),
            Paragraph("~ $ 4,000 a $ 8,000 / año por dispositivo (USD 1-2)", styles['PremiumBody'])
        ],
        [
            Paragraph("Servidor MDM (MicroMDM)", styles['PremiumBody']),
            Paragraph("Open-Source / Mensual (Sin costo de licencias)", styles['PremiumBody']),
            Paragraph("$ 0 COP (Alojado en el mismo servidor web)", styles['PremiumBody'])
        ]
    ]

    t_recurrent = Table(recurrent_data, colWidths=[2.3*inch, 2.3*inch, 1.9*inch])
    t_recurrent.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_recurrent)
    
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "<b>Nota de Ahorro en Hosting:</b> Durante las fases de desarrollo, pruebas y hasta los primeros 500 dispositivos registrados, utilizaremos una configuración simplificada en un único servidor VPS económico (como Hetzner o DigitalOcean) con costos iniciales de apenas <b>$30.000 COP al mes</b>. La infraestructura es elástica y solo requerirá aumentar de tamaño si el volumen de dispositivos supera los límites de procesamiento, garantizando la máxima economía para el inicio del proyecto.",
        styles['PremiumBody']
    ))

    # Build document with cover background callback
    doc.build(story, onFirstPage=draw_cover_background, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    build_pdf()
    print("PDF creado exitosamente.")
