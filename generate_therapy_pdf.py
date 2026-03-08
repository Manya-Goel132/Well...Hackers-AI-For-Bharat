import json
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.platypus import KeepTogether
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from datetime import datetime

def create_therapy_pdf(json_file, output_pdf):
    """
    Generate a professional PDF document from therapy modules and chatbot scripts JSON
    """
    # Load JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Create PDF document
    doc = SimpleDocTemplate(
        output_pdf,
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=1*inch,
        bottomMargin=0.75*inch
    )
    
    # Container for PDF elements
    elements = []
    
    # Define custom styles
    styles = getSampleStyleSheet()
    
    # Title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a237e'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Heading styles
    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#283593'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )
    
    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#3949ab'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    h3_style = ParagraphStyle(
        'CustomH3',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#5c6bc0'),
        spaceAfter=8,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    )
    
    # Body text style
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
        leading=14
    )
    
    # Metadata style
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['BodyText'],
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER,
        spaceAfter=6
    )
    
    # Add title
    elements.append(Paragraph("Psychotherapy Modules & Chatbot Scripts", title_style))
    elements.append(Paragraph("Self-Help CBT Modules and Supportive Therapy Guidelines", meta_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Add metadata
    metadata = data.get('metadata', {})
    elements.append(Paragraph(f"<b>Version:</b> {metadata.get('version', 'N/A')}", meta_style))
    elements.append(Paragraph(f"<b>Source:</b> {metadata.get('source', 'N/A')}", meta_style))
    elements.append(Paragraph(f"<b>Language Style:</b> {metadata.get('language_style', 'N/A')}", meta_style))
    elements.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y')}", meta_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Add safety note
    if 'safety_note' in metadata:
        safety_box = Table(
            [[Paragraph(f"<b>⚠️ Safety Note:</b> {metadata['safety_note']}", body_style)]],
            colWidths=[6.5*inch]
        )
        safety_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff3cd')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#856404')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#ffc107')),
        ]))
        elements.append(safety_box)
        elements.append(Spacer(1, 0.3*inch))
    
    # Add page break
    elements.append(PageBreak())
    
    # ==================== THERAPY MODULES SECTION ====================
    elements.append(Paragraph("Part I: Self-Help Therapy Modules", h1_style))
    elements.append(Paragraph(
        "Evidence-based CBT techniques for anxiety disorders and OCD, structured as self-guided modules.",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    
    therapy_modules = data.get('therapy_modules', [])
    
    # Group modules by condition
    conditions_map = {}
    for module in therapy_modules:
        condition = module.get('target_condition', 'Other')
        if condition not in conditions_map:
            conditions_map[condition] = []
        conditions_map[condition].append(module)
    
    # Process each condition
    for condition, modules in sorted(conditions_map.items()):
        elements.append(Paragraph(f"Condition: {condition}", h2_style))
        elements.append(Spacer(1, 0.1*inch))
        
        for idx, module in enumerate(modules, 1):
            module_elements = []
            
            # Module header
            module_elements.append(Paragraph(
                f"<b>Module {idx}: {module.get('module_name', 'N/A')}</b>",
                h3_style
            ))
            
            # Module details table
            details_data = [
                ['Difficulty Level', module.get('difficulty_level', 'N/A')],
                ['Target Condition', module.get('target_condition', 'N/A')]
            ]
            
            details_table = Table(details_data, colWidths=[2*inch, 4.5*inch])
            details_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8eaf6')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            module_elements.append(details_table)
            module_elements.append(Spacer(1, 0.1*inch))
            
            # Clinical rationale
            module_elements.append(Paragraph("<b>Clinical Rationale:</b>", body_style))
            module_elements.append(Paragraph(
                module.get('clinical_rationale', 'N/A'),
                body_style
            ))
            module_elements.append(Spacer(1, 0.1*inch))
            
            # Steps
            module_elements.append(Paragraph("<b>Steps:</b>", body_style))
            steps = module.get('steps', [])
            for step in steps:
                module_elements.append(Paragraph(f"• {step}", body_style))
            module_elements.append(Spacer(1, 0.1*inch))
            
            # Contraindications
            contraindications = module.get('contraindications', 'None')
            contraindications_box = Table(
                [[Paragraph(f"<b>⚠️ Contraindications:</b> {contraindications}", body_style)]],
                colWidths=[6.5*inch]
            )
            contraindications_box.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ffebee')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#c62828')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#ef5350')),
            ]))
            module_elements.append(contraindications_box)
            module_elements.append(Spacer(1, 0.15*inch))
            
            # Keep module together on same page
            elements.append(KeepTogether(module_elements))
        
        elements.append(Spacer(1, 0.2*inch))
    
    # Add page break before chatbot scripts
    elements.append(PageBreak())
    
    # ==================== CHATBOT SCRIPTS SECTION ====================
    elements.append(Paragraph("Part II: Chatbot Response Scripts", h1_style))
    elements.append(Paragraph(
        "Supportive psychotherapy guidelines for AI chatbot responses based on user emotional states and intents.",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    
    chatbot_scripts = data.get('chatbot_scripts', [])
    
    for idx, script in enumerate(chatbot_scripts, 1):
        script_elements = []
        
        # Script header
        script_elements.append(Paragraph(
            f"<b>Script {idx}: {script.get('user_intent', 'N/A')}</b>",
            h3_style
        ))
        
        # Technique used
        script_elements.append(Paragraph(
            f"<b>Technique:</b> {script.get('technique_used', 'N/A')}",
            body_style
        ))
        script_elements.append(Spacer(1, 0.1*inch))
        
        # Response guidelines
        guidelines = script.get('response_guidelines', {})
        
        # DO SAY section
        do_say = guidelines.get('do_say', [])
        if do_say:
            do_say_box = Table(
                [[Paragraph("<b>✓ DO SAY:</b>", body_style)]] +
                [[Paragraph(f"• {item}", body_style)] for item in do_say],
                colWidths=[6.5*inch]
            )
            do_say_box.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#c8e6c9')),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#e8f5e9')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2e7d32')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#66bb6a')),
            ]))
            script_elements.append(do_say_box)
            script_elements.append(Spacer(1, 0.1*inch))
        
        # DON'T SAY section
        dont_say = guidelines.get('dont_say', [])
        if dont_say:
            dont_say_box = Table(
                [[Paragraph("<b>✗ DON'T SAY:</b>", body_style)]] +
                [[Paragraph(f"• {item}", body_style)] for item in dont_say],
                colWidths=[6.5*inch]
            )
            dont_say_box.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ffcdd2')),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#ffebee')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#c62828')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#ef5350')),
            ]))
            script_elements.append(dont_say_box)
            script_elements.append(Spacer(1, 0.1*inch))
        
        # Reasoning
        reasoning = guidelines.get('reasoning', 'N/A')
        reasoning_box = Table(
            [[Paragraph(f"<b>📚 Clinical Reasoning:</b> {reasoning}", body_style)]],
            colWidths=[6.5*inch]
        )
        reasoning_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e3f2fd')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1565c0')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#42a5f5')),
        ]))
        script_elements.append(reasoning_box)
        script_elements.append(Spacer(1, 0.15*inch))
        
        # Keep script together on same page
        elements.append(KeepTogether(script_elements))
    
    # Build PDF
    doc.build(elements)
    print(f"✅ PDF generated successfully: {output_pdf}")

if __name__ == '__main__':
    json_file = 'therapy_modules_chatbot_scripts.json'
    output_pdf = 'Therapy_Modules_Chatbot_Scripts.pdf'
    
    try:
        create_therapy_pdf(json_file, output_pdf)
    except Exception as e:
        print(f"❌ Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
