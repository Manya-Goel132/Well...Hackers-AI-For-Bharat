#!/usr/bin/env python3
"""
Generate a professional PDF from the clinical decision support JSON
"""
import json
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.platypus import KeepTogether
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from datetime import datetime

def create_pdf(json_file, output_pdf):
    """Create a structured PDF from the clinical decision support JSON"""
    
    # Load JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Create PDF
    doc = SimpleDocTemplate(
        output_pdf,
        pagesize=A4,
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.75*inch,
        bottomMargin=0.5*inch
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1a237e'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=10,
        textColor=colors.HexColor('#666666'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    condition_style = ParagraphStyle(
        'ConditionTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#c62828'),
        spaceAfter=10,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )
    
    section_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#1565c0'),
        spaceAfter=8,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    subsection_style = ParagraphStyle(
        'SubsectionTitle',
        parent=styles['Heading3'],
        fontSize=10,
        textColor=colors.HexColor('#2e7d32'),
        spaceAfter=6,
        spaceBefore=8,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=9,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        fontName='Helvetica'
    )
    
    # Title page
    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("Clinical Decision Support System", title_style))
    elements.append(Paragraph("Indian Psychiatric Society Guidelines", subtitle_style))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", subtitle_style))
    elements.append(Paragraph("Based on IPS Clinical Practice Guidelines 2017", subtitle_style))
    elements.append(PageBreak())
    
    # Process each condition
    for idx, condition in enumerate(data):
        # Condition title
        elements.append(Paragraph(f"{idx + 1}. {condition['condition_name']}", condition_style))
        
        # ICD Codes
        icd_text = f"<b>ICD-10 Codes:</b> {', '.join(condition['icd_codes'])}"
        elements.append(Paragraph(icd_text, body_style))
        elements.append(Spacer(1, 0.1*inch))
        
        # Severity Scale
        elements.append(Paragraph("Severity Assessment Scale", section_style))
        scale_data = [
            ['Scale Name', condition['severity_scale']['name']],
            ['Scoring Logic', condition['severity_scale']['scoring_logic']]
        ]
        scale_table = Table(scale_data, colWidths=[1.5*inch, 5*inch])
        scale_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e3f2fd')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(scale_table)
        elements.append(Spacer(1, 0.15*inch))
        
        # Symptom Keywords
        elements.append(Paragraph("Patient-Facing Symptom Keywords", section_style))
        symptoms_text = ", ".join([f"'{s}'" for s in condition['symptom_keywords']])
        elements.append(Paragraph(symptoms_text, body_style))
        elements.append(Spacer(1, 0.15*inch))
        
        # Panic Override Logic (if exists)
        if 'panic_override_logic' in condition:
            elements.append(Paragraph("⚠️ Panic Disorder Override Logic", section_style))
            panic = condition['panic_override_logic']
            panic_data = [
                ['Trigger', panic['trigger']],
                ['Action', panic['action']],
                ['Description', panic['description']]
            ]
            panic_table = Table(panic_data, colWidths=[1.2*inch, 5.3*inch])
            panic_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fff3e0')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elements.append(panic_table)
            elements.append(Spacer(1, 0.15*inch))
        
        # Triage Logic
        elements.append(Paragraph("Clinical Triage Logic & Treatment Protocols", section_style))
        
        for triage in condition['triage_logic']:
            # Severity level header
            severity_color = {
                'Mild': '#4caf50',
                'Moderate': '#ff9800',
                'Severe': '#f44336',
                'Emergency/Red Flag': '#b71c1c',
                'First Episode Psychosis': '#9c27b0',
                'Acute Exacerbation': '#d32f2f',
                'Stable/Maintenance': '#1976d2',
                'Bipolar Depression (Mild-Moderate)': '#7b1fa2',
                'Hypomania/Mild Mania': '#ffa726',
                'Acute Mania (Severe)': '#e53935',
                'Mixed Episode': '#c62828',
                'Mild/Subthreshold Insomnia': '#66bb6a'
            }.get(triage['severity_level'], '#757575')
            
            severity_para = Paragraph(
                f"<b>Severity Level: {triage['severity_level']}</b>",
                ParagraphStyle(
                    'SeverityLevel',
                    parent=subsection_style,
                    textColor=colors.HexColor(severity_color),
                    fontSize=11
                )
            )
            elements.append(severity_para)
            
            # Clinical status
            if 'clinical_status' in triage:
                elements.append(Paragraph(f"<b>Clinical Status:</b> {triage['clinical_status']}", body_style))
            
            # Action recommendation
            if 'action_recommendation' in triage:
                elements.append(Paragraph(f"<b>Action Recommendation:</b> {triage['action_recommendation']}", body_style))
            
            # Referral tier
            if 'referral_tier' in triage:
                elements.append(Paragraph(f"<b>Referral Tier:</b> {triage['referral_tier']}", body_style))
            
            # First-line drugs (if exists)
            if 'first_line_drugs_india' in triage and triage['first_line_drugs_india']:
                elements.append(Paragraph("<b>First-Line Medications (India):</b>", body_style))
                
                # Create drug table
                drug_data = [['Drug Name', 'Starting Dose', 'Maximum Dose', 'Notes']]
                
                for drug in triage['first_line_drugs_india']:
                    if isinstance(drug, dict):
                        notes = drug.get('therapeutic_level', '')
                        drug_data.append([
                            drug['name'],
                            drug['start_dose'],
                            drug['max_dose'],
                            notes
                        ])
                    else:
                        # Handle old string format
                        drug_data.append([str(drug), '-', '-', ''])
                
                drug_table = Table(drug_data, colWidths=[2*inch, 1.3*inch, 1.3*inch, 1.9*inch])
                drug_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')])
                ]))
                elements.append(drug_table)
                elements.append(Spacer(1, 0.1*inch))
            
            # Mandatory Labs (if exists)
            if 'mandatory_labs' in triage and triage['mandatory_labs']:
                elements.append(Paragraph("<b>🔬 Mandatory Laboratory Monitoring:</b>", body_style))
                
                labs = triage['mandatory_labs']
                for key, value in labs.items():
                    if isinstance(value, list):
                        lab_text = f"<b>{key.replace('_', ' ').title()}:</b> {', '.join(value)}"
                    else:
                        lab_text = f"<b>{key.replace('_', ' ').title()}:</b> {value}"
                    elements.append(Paragraph(lab_text, ParagraphStyle(
                        'LabText',
                        parent=body_style,
                        fontSize=8,
                        leftIndent=10
                    )))
                elements.append(Spacer(1, 0.1*inch))
            
            # Treatment duration (if exists)
            if 'treatment_duration' in triage:
                elements.append(Paragraph(f"<b>Treatment Duration:</b> {triage['treatment_duration']}", body_style))
            
            # Triggers (for emergency)
            if 'triggers' in triage:
                triggers_text = "; ".join(triage['triggers'])
                elements.append(Paragraph(f"<b>Emergency Triggers:</b> {triggers_text}", body_style))
            
            # Notes
            if 'notes' in triage:
                elements.append(Paragraph(f"<b>Clinical Notes:</b> {triage['notes']}", 
                    ParagraphStyle(
                        'NotesStyle',
                        parent=body_style,
                        textColor=colors.HexColor('#d84315'),
                        fontSize=8,
                        leftIndent=10
                    )
                ))
            
            elements.append(Spacer(1, 0.15*inch))
        
        # Special Populations (if exists)
        if 'special_populations' in condition:
            elements.append(Paragraph("Special Population Considerations", section_style))
            for pop, guidance in condition['special_populations'].items():
                pop_title = pop.replace('_', ' ').title()
                elements.append(Paragraph(f"<b>{pop_title}:</b> {guidance}", body_style))
            elements.append(Spacer(1, 0.15*inch))
        
        # Maintenance Treatment (if exists)
        if 'maintenance_treatment' in condition:
            elements.append(Paragraph("Maintenance Treatment Protocol", section_style))
            maint = condition['maintenance_treatment']
            for key, value in maint.items():
                key_title = key.replace('_', ' ').title()
                elements.append(Paragraph(f"<b>{key_title}:</b> {value}", body_style))
            elements.append(Spacer(1, 0.15*inch))
        
        # General Notes
        if 'notes' in condition:
            elements.append(Paragraph("General Clinical Notes", section_style))
            elements.append(Paragraph(condition['notes'], 
                ParagraphStyle(
                    'GeneralNotes',
                    parent=body_style,
                    textColor=colors.HexColor('#1565c0'),
                    fontSize=9
                )
            ))
        
        # Add page break between conditions (except last one)
        if idx < len(data) - 1:
            elements.append(PageBreak())
    
    # Build PDF
    doc.build(elements)
    print(f"✅ PDF generated successfully: {output_pdf}")

if __name__ == '__main__':
    json_file = 'clinical_decision_support.json'
    output_pdf = 'Clinical_Decision_Support_System.pdf'
    
    try:
        create_pdf(json_file, output_pdf)
    except Exception as e:
        print(f"❌ Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
