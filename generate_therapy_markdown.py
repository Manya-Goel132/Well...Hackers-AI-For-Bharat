import json
from datetime import datetime

def create_therapy_markdown(json_file, output_md):
    """
    Generate a well-structured Markdown document from therapy modules and chatbot scripts JSON
    """
    # Load JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Start building markdown content
    md_content = []
    
    # Add title and metadata
    md_content.append("# Psychotherapy Modules & Chatbot Scripts")
    md_content.append("\n## Self-Help CBT Modules and Supportive Therapy Guidelines\n")
    
    # Add metadata
    metadata = data.get('metadata', {})
    md_content.append("### Document Information\n")
    md_content.append(f"- **Version:** {metadata.get('version', 'N/A')}")
    md_content.append(f"- **Source:** {metadata.get('source', 'N/A')}")
    md_content.append(f"- **Language Style:** {metadata.get('language_style', 'N/A')}")
    md_content.append(f"- **Generated:** {datetime.now().strftime('%B %d, %Y')}\n")
    
    # Add safety note
    
    if 'safety_note' in metadata:
        md_content.append("> ⚠️ **Safety Note:** " + metadata['safety_note'] + "\n")
    
    md_content.append("---\n")
    
    # Table of Contents
    md_content.append("## Table of Contents\n")
    md_content.append("### Part I: Self-Help Therapy Modules")
    
    therapy_modules = data.get('therapy_modules', [])
    
    # Group modules by condition for TOC
    conditions_map = {}
    for module in therapy_modules:
        condition = module.get('target_condition', 'Other')
        if condition not in conditions_map:
            conditions_map[condition] = []
        conditions_map[condition].append(module)
    
    for condition in sorted(conditions_map.keys()):
        md_content.append(f"- [{condition}](#{condition.lower().replace(' ', '-').replace(',', '')})")
    
    md_content.append("\n### Part II: Chatbot Response Scripts")
    chatbot_scripts = data.get('chatbot_scripts', [])
    for idx, script in enumerate(chatbot_scripts, 1):
        intent = script.get('user_intent', 'N/A')
        anchor = intent.lower().replace(' ', '-').replace('/', '-')
        md_content.append(f"{idx}. [{intent}](#{anchor})")
    
    md_content.append("\n---\n")
    
    # ==================== THERAPY MODULES SECTION ====================
    md_content.append("# Part I: Self-Help Therapy Modules\n")
    md_content.append("Evidence-based CBT techniques for anxiety disorders and OCD, structured as self-guided modules.\n")
    
    # Process each condition
    for condition, modules in sorted(conditions_map.items()):
        md_content.append(f"## {condition}\n")
        
        for idx, module in enumerate(modules, 1):
            md_content.append(f"### Module {idx}: {module.get('module_name', 'N/A')}\n")
            
            # Module details
            md_content.append("| Property | Details |")
            md_content.append("|----------|---------|")
            md_content.append(f"| **Difficulty Level** | {module.get('difficulty_level', 'N/A')} |")
            md_content.append(f"| **Target Condition** | {module.get('target_condition', 'N/A')} |\n")
            
            # Clinical rationale
            md_content.append("**Clinical Rationale:**")
            md_content.append(f"{module.get('clinical_rationale', 'N/A')}\n")
            
            # Steps
            md_content.append("**Steps:**\n")
            steps = module.get('steps', [])
            for step in steps:
                md_content.append(f"- {step}")
            md_content.append("")
            
            # Contraindications
            contraindications = module.get('contraindications', 'None')
            md_content.append(f"> ⚠️ **Contraindications:** {contraindications}\n")
            md_content.append("---\n")
    
    # ==================== CHATBOT SCRIPTS SECTION ====================
    md_content.append("# Part II: Chatbot Response Scripts\n")
    md_content.append("Supportive psychotherapy guidelines for AI chatbot responses based on user emotional states and intents.\n")
    
    for idx, script in enumerate(chatbot_scripts, 1):
        md_content.append(f"## {idx}. {script.get('user_intent', 'N/A')}\n")
        
        # Technique used
        md_content.append(f"**Technique:** {script.get('technique_used', 'N/A')}\n")
        
        # Response guidelines
        guidelines = script.get('response_guidelines', {})
        
        # DO SAY section
        do_say = guidelines.get('do_say', [])
        if do_say:
            md_content.append("### ✓ DO SAY:\n")
            for item in do_say:
                md_content.append(f"- {item}")
            md_content.append("")
        
        # DON'T SAY section
        dont_say = guidelines.get('dont_say', [])
        if dont_say:
            md_content.append("### ✗ DON'T SAY:\n")
            for item in dont_say:
                md_content.append(f"- {item}")
            md_content.append("")
        
        # Reasoning
        reasoning = guidelines.get('reasoning', 'N/A')
        md_content.append(f"### 📚 Clinical Reasoning:\n")
        md_content.append(f"> {reasoning}\n")
        md_content.append("---\n")
    
    # Write to file
    with open(output_md, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md_content))
    
    print(f"✅ Markdown generated successfully: {output_md}")

if __name__ == '__main__':
    json_file = 'therapy_modules_chatbot_scripts.json'
    output_md = 'Therapy_Modules_Chatbot_Scripts.md'
    
    try:
        create_therapy_markdown(json_file, output_md)
    except Exception as e:
        print(f"❌ Error generating Markdown: {e}")
        import traceback
        traceback.print_exc()
