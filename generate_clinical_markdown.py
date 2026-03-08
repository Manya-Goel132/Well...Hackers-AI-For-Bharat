#!/usr/bin/env python3
"""
Generate a structured Markdown document from the clinical decision support JSON
"""
import json
from datetime import datetime

def create_markdown(json_file, output_md):
    """Create a structured Markdown document from the clinical decision support JSON"""
    
    # Load JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    md_content = []
    
    # Title
    md_content.append("# Clinical Decision Support System")
    md_content.append("## Indian Psychiatric Society Guidelines")
    md_content.append(f"\n**Generated:** {datetime.now().strftime('%B %d, %Y')}")
    md_content.append("\n**Source:** IPS Clinical Practice Guidelines 2017")
    md_content.append("\n---\n")
    
    # Table of Contents
    md_content.append("## Table of Contents\n")
    for idx, condition in enumerate(data, 1):
        md_content.append(f"{idx}. [{condition['condition_name']}](#{condition['condition_name'].lower().replace(' ', '-').replace('(', '').replace(')', '')})")
    md_content.append("\n---\n")
    
    # Process each condition
    for idx, condition in enumerate(data, 1):
        # Condition title
        md_content.append(f"## {idx}. {condition['condition_name']}\n")
        
        # ICD Codes
        md_content.append(f"**ICD-10 Codes:** {', '.join(condition['icd_codes'])}\n")
        
        # Severity Scale
        md_content.append("### 📊 Severity Assessment Scale\n")
        md_content.append(f"- **Scale Name:** {condition['severity_scale']['name']}")
        md_content.append(f"- **Scoring Logic:** {condition['severity_scale']['scoring_logic']}\n")
        
        # Symptom Keywords
        md_content.append("### 🔍 Patient-Facing Symptom Keywords\n")
        symptoms = ", ".join([f"*{s}*" for s in condition['symptom_keywords']])
        md_content.append(f"{symptoms}\n")
        
        # Panic Override Logic (if exists)
        if 'panic_override_logic' in condition:
            md_content.append("### ⚠️ Panic Disorder Override Logic\n")
            panic = condition['panic_override_logic']
            md_content.append(f"- **Trigger:** {panic['trigger']}")
            md_content.append(f"- **Action:** {panic['action']}")
            md_content.append(f"- **Description:** {panic['description']}\n")
        
        # Triage Logic
        md_content.append("### 🏥 Clinical Triage Logic & Treatment Protocols\n")
        
        for triage in condition['triage_logic']:
            # Severity level
            md_content.append(f"#### {triage['severity_level']}\n")
            
            # Clinical status
            if 'clinical_status' in triage:
                md_content.append(f"**Clinical Status:** {triage['clinical_status']}\n")
            
            # Action recommendation
            if 'action_recommendation' in triage:
                md_content.append(f"**Action Recommendation:** {triage['action_recommendation']}\n")
            
            # Referral tier
            if 'referral_tier' in triage:
                md_content.append(f"**Referral Tier:** {triage['referral_tier']}\n")
            
            # First-line drugs
            if 'first_line_drugs_india' in triage and triage['first_line_drugs_india']:
                md_content.append("**First-Line Medications (India):**\n")
                md_content.append("\n| Drug Name | Starting Dose | Maximum Dose | Notes |")
                md_content.append("\n|-----------|---------------|--------------|-------|")
                
                for drug in triage['first_line_drugs_india']:
                    if isinstance(drug, dict):
                        notes = drug.get('therapeutic_level', '')
                        md_content.append(f"\n| {drug['name']} | {drug['start_dose']} | {drug['max_dose']} | {notes} |")
                    else:
                        md_content.append(f"\n| {drug} | - | - | - |")
                md_content.append("\n")
            
            # Mandatory Labs
            if 'mandatory_labs' in triage and triage['mandatory_labs']:
                md_content.append("\n**🔬 Mandatory Laboratory Monitoring:**\n")
                labs = triage['mandatory_labs']
                for key, value in labs.items():
                    key_title = key.replace('_', ' ').title()
                    if isinstance(value, list):
                        md_content.append(f"- **{key_title}:** {', '.join(value)}")
                    else:
                        md_content.append(f"- **{key_title}:** {value}")
                md_content.append("\n")
            
            # Treatment duration
            if 'treatment_duration' in triage:
                md_content.append(f"**Treatment Duration:** {triage['treatment_duration']}\n")
            
            # Triggers (for emergency)
            if 'triggers' in triage:
                md_content.append("**Emergency Triggers:**")
                for trigger in triage['triggers']:
                    md_content.append(f"- {trigger}")
                md_content.append("\n")
            
            # Notes
            if 'notes' in triage:
                md_content.append(f"> **Clinical Notes:** {triage['notes']}\n")
            
            md_content.append("---\n")
        
        # Special Populations
        if 'special_populations' in condition:
            md_content.append("### 👥 Special Population Considerations\n")
            for pop, guidance in condition['special_populations'].items():
                pop_title = pop.replace('_', ' ').title()
                md_content.append(f"**{pop_title}:** {guidance}\n")
            md_content.append("\n")
        
        # Maintenance Treatment
        if 'maintenance_treatment' in condition:
            md_content.append("### 🔄 Maintenance Treatment Protocol\n")
            maint = condition['maintenance_treatment']
            for key, value in maint.items():
                key_title = key.replace('_', ' ').title()
                md_content.append(f"- **{key_title}:** {value}")
            md_content.append("\n")
        
        # General Notes
        if 'notes' in condition:
            md_content.append("### 📝 General Clinical Notes\n")
            md_content.append(f"> {condition['notes']}\n")
        
        # Page separator
        if idx < len(data):
            md_content.append("\n---\n\n")
    
    # Write to file
    with open(output_md, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md_content))
    
    print(f"✅ Markdown generated successfully: {output_md}")

if __name__ == '__main__':
    json_file = 'clinical_decision_support.json'
    output_md = 'Clinical_Decision_Support_System.md'
    
    try:
        create_markdown(json_file, output_md)
    except Exception as e:
        print(f"❌ Error generating Markdown: {e}")
        import traceback
        traceback.print_exc()
