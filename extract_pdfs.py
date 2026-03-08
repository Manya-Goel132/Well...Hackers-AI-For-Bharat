#!/usr/bin/env python3
"""
Extract text from Indian Psychiatric Society Clinical Practice Guidelines PDFs
"""
import os
import sys

# Try different PDF libraries
try:
    import PyPDF2
    USE_PYPDF2 = True
except ImportError:
    USE_PYPDF2 = False

try:
    import pdfplumber
    USE_PDFPLUMBER = True
except ImportError:
    USE_PDFPLUMBER = False

def extract_with_pypdf2(pdf_path):
    """Extract text using PyPDF2"""
    text = []
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text.append(f"\n--- Page {page_num + 1} ---\n")
                    text.append(page_text)
    except Exception as e:
        print(f"PyPDF2 error for {pdf_path}: {e}", file=sys.stderr)
    return ''.join(text)

def extract_with_pdfplumber(pdf_path):
    """Extract text using pdfplumber"""
    text = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text.append(f"\n--- Page {page_num + 1} ---\n")
                    text.append(page_text)
    except Exception as e:
        print(f"pdfplumber error for {pdf_path}: {e}", file=sys.stderr)
    return ''.join(text)

def main():
    pdfs = {
        'depression': 'indianpsychiatricsociety_org_url=https%3A%2F%2Findianpsychiatricsociety_org%2Fwp-content%2Fuploads%2F2017%2F01%2FGautam_2017_Clinical_Practice_Guidelines_for_the_pdf&pdfID=2&index=2.pdf',
        'gad_panic': 'indianpsychiatricsociety_org_url=https%3A%2F%2Findianpsychiatricsociety_org%2Fwp-content%2Fuploads%2F2017%2F01%2FGautam_2017_Clinical_Practice_Guidelines_for_the2_pdf&pdfID=2&index=2.pdf',
        'schizophrenia': 'indianpsychiatricsociety_org_url=https%3A%2F%2Findianpsychiatricsociety_org%2Fwp-content%2Fuploads%2F2022%2F05%2FGrover_2017_Clinical_Practice_Guidelines_for_pdf&pdfID=2&index=2.pdf',
        'sleep_disorders': 'indianpsychiatricsociety_org_url=https%3A%2F%2Findianpsychiatricsociety_org%2Fwp-content%2Fuploads%2F2022%2F05%2FGupta_2017_Clinical_Practice_Guidelines_for_Sleep_pdf&pdfID=2&index=2.pdf',
        'bipolar': 'indianpsychiatricsociety_org_url=https%3A%2F%2Findianpsychiatricsociety_org%2Fwp-content%2Fuploads%2F2022%2F05%2FShah_2017_Clinical_Practice_Guidelines_for_pdf&pdfID=2&index=2.pdf'
    }
    
    if not USE_PYPDF2 and not USE_PDFPLUMBER:
        print("ERROR: Neither PyPDF2 nor pdfplumber is installed.")
        print("Please install one: pip install PyPDF2 or pip install pdfplumber")
        sys.exit(1)
    
    print(f"Using: {'pdfplumber' if USE_PDFPLUMBER else 'PyPDF2'}")
    
    for name, pdf_file in pdfs.items():
        print(f"\nExtracting {name}...")
        
        if USE_PDFPLUMBER:
            text = extract_with_pdfplumber(pdf_file)
        else:
            text = extract_with_pypdf2(pdf_file)
        
        output_file = f"{name}_extracted.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(text)
        
        print(f"  Saved to {output_file} ({len(text)} characters)")

if __name__ == '__main__':
    main()
