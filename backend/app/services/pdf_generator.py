import io
import os
import qrcode
from xml.sax.saxutils import escape as xml_escape
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def safe_xml(val) -> str:
    """Escapes XML/HTML reserved characters (<, >, &) to prevent ReportLab paraparser crashes."""
    return xml_escape(str(val)) if val is not None else ""

def generate_challan_pdf(challan_data: dict) -> bytes:
    """
    Generates a high-fidelity, tamper-evident digital e-Challan receipt
    using ReportLab and embedded QR code verification.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Brutalist-Lite Styling Palette
    c_primary = colors.HexColor("#171E19")
    c_secondary = colors.HexColor("#272727")
    c_accent = colors.HexColor("#FFE17C")
    c_surface = colors.HexColor("#F8F9FA")
    c_border = colors.HexColor("#E5E7EB")
    c_danger = colors.HexColor("#EF4444")
    c_dark_green = colors.HexColor("#15803D")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        textTransform='uppercase'
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=c_secondary
    )

    header_cell_style = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    body_style = ParagraphStyle(
        'BodyCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_secondary
    )

    body_bold = ParagraphStyle(
        'BodyCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=c_primary
    )

    elements = []

    # 1. Top Header Banner
    header_table_data = [
        [
            Paragraph("<b>ROADGUARD</b> &bull; TRAFFIC POLICE DEPARTMENT", title_style),
            Paragraph(f"<b>STATUS:</b> <font color='{c_danger.hexval()}'>UNPAID</font><br/><b>E-CHALLAN NOTICE</b>", subtitle_style)
        ]
    ]
    header_table = Table(header_table_data, colWidths=[380, 160])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=2, color=c_primary, spaceBefore=0, spaceAfter=12))

    # 2. Key Challan Info Grid & QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    verify_url = f"https://roadguard.gov.in/verify?challan={challan_data.get('challan_number', 'NA')}&reg={challan_data.get('registration_number', 'NA')}"
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    qr_flowable = RLImage(qr_buffer, width=1.1*inch, height=1.1*inch)

    challan_no = safe_xml(challan_data.get("challan_number", "CH-2026-UNKNOWN"))
    issued_date = safe_xml(challan_data.get("issued_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    due_date = safe_xml(challan_data.get("due_date", "15 Days from Notice"))
    location = safe_xml(challan_data.get("location", "Central Junction"))
    officer_badge = safe_xml(challan_data.get("officer_badge", "OP-01"))

    info_data = [
        [
            Paragraph(
                f"<b>Challan Number:</b> {challan_no}<br/>"
                f"<b>Issued Date & Time:</b> {issued_date}<br/>"
                f"<b>Payment Due Date:</b> {due_date}<br/>"
                f"<b>Jurisdiction / Location:</b> {location}<br/>"
                f"<b>Issued By Operator:</b> {officer_badge}",
                body_style
            ),
            qr_flowable
        ]
    ]
    info_table = Table(info_data, colWidths=[420, 120])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_surface),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    # 3. Vehicle & Owner Details Section
    elements.append(Paragraph("<b>VEHICLE & OWNER DETAILS</b>", subtitle_style))
    elements.append(Spacer(1, 6))

    reg_no = safe_xml(challan_data.get("registration_number", "N/A"))
    owner_name = safe_xml(challan_data.get("owner_name", "Vehicle Registered Owner"))
    maker_model = safe_xml(challan_data.get("maker_model", "Passenger Motor Vehicle"))
    fuel_type = safe_xml(challan_data.get("fuel_type", "Petrol / Diesel"))
    owner_phone = safe_xml(challan_data.get("owner_phone", "Registered Contact"))

    veh_data = [
        [
            Paragraph("<b>Registration Plate:</b>", body_style),
            Paragraph(f"<font size=11 color='{c_primary.hexval()}'><b>{reg_no}</b></font>", body_bold),
            Paragraph("<b>Registered Owner:</b>", body_style),
            Paragraph(owner_name, body_bold)
        ],
        [
            Paragraph("<b>Make / Model:</b>", body_style),
            Paragraph(maker_model, body_style),
            Paragraph("<b>Fuel Type:</b>", body_style),
            Paragraph(fuel_type, body_style)
        ],
        [
            Paragraph("<b>Contact Phone:</b>", body_style),
            Paragraph(owner_phone, body_style),
            Paragraph("<b>Enforcement Mode:</b>", body_style),
            Paragraph("Automated ANPR AI", body_style)
        ]
    ]
    veh_table = Table(veh_data, colWidths=[120, 150, 120, 150])
    veh_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,0), (-1,-1), colors.white)
    ]))
    elements.append(veh_table)
    elements.append(Spacer(1, 15))

    # 4. Offence & Fine Breakdown
    elements.append(Paragraph("<b>VIOLATION SPECIFICATION & PENALTY</b>", subtitle_style))
    elements.append(Spacer(1, 6))

    fine_amt = challan_data.get("fine_amount", 1000.0)
    rule_section = safe_xml(challan_data.get("rule_section", "Sec 177 / 196 Motor Vehicles Act, 1988"))
    violation_title = safe_xml(challan_data.get("violation_title", "Traffic Offence / Document Expiry"))

    fine_data = [
        [
            Paragraph("<b>OFFENCE DESCRIPTION</b>", header_cell_style),
            Paragraph("<b>ACT & SECTION</b>", header_cell_style),
            Paragraph("<b>PENALTY (INR)</b>", header_cell_style)
        ],
        [
            Paragraph(f"<b>{violation_title}</b><br/><font size=8 color='{c_secondary.hexval()}'>Verified via automated roadside inspection database.</font>", body_style),
            Paragraph(rule_section, body_style),
            Paragraph(f"<b>&#8377; {fine_amt:,.2f}</b>", body_bold)
        ],
        [
            Paragraph("<b>TOTAL PAYABLE AMOUNT:</b>", body_bold),
            Paragraph("", body_style),
            Paragraph(f"<font color='{c_danger.hexval()}'><b>&#8377; {fine_amt:,.2f}</b></font>", body_bold)
        ]
    ]
    fine_table = Table(fine_data, colWidths=[260, 160, 120])
    fine_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('BACKGROUND', (0,-1), (-1,-1), c_surface),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (2,0), (2,-1), 'RIGHT')
    ]))
    elements.append(fine_table)
    elements.append(Spacer(1, 20))

    # 5. Instructions & Settlement Notice
    terms_text = (
        "<b>PAYMENT NOTICE:</b> Under Section 200 of the Motor Vehicles Act, 1988, you are requested to "
        "compound the offence and pay the prescribed penalty within 15 days of this notice. Payments can be "
        "made online at <b>https://echallan.parivahan.gov.in</b> or via the RoadGuard Mobile App. Failure to settle "
        "the penalty within the stipulated window will result in transmission of this case to the concerned "
        "Metropolitan Magistrate Court for statutory proceedings."
    )
    terms_para = Paragraph(terms_text, body_style)
    
    terms_table = Table([[terms_para]], colWidths=[540])
    terms_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_surface),
        ('BOX', (0,0), (-1,-1), 1, c_accent),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(terms_table)
    elements.append(Spacer(1, 25))

    # 6. Signature Block
    sig_data = [
        [
            Paragraph("Generated by <b>ROADGUARD AI Engine v2.4</b><br/>Official Digital Enforcement Record", body_style),
            Paragraph("<b>AUTHORISED SIGNATORY</b><br/>Traffic Enforcement Command Center", ParagraphStyle('Sig', parent=body_style, alignment=2))
        ]
    ]
    sig_table = Table(sig_data, colWidths=[300, 240])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM')
    ]))
    elements.append(sig_table)

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
