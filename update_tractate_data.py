#!/usr/bin/env python3
"""
Script to update tractate-contents.tsx with correct data from Excel file
"""

import pandas as pd
import re
import json

def parse_page_ref(page_ref):
    """Parse page reference like '2a', '17b' into folio number and side"""
    match = re.match(r'(\d+)([ab])', str(page_ref))
    if match:
        return int(match.group(1)), match.group(2)
    return None, None

def normalize_tractate_name(hebrew_name):
    """Normalize Hebrew tractate name to English key"""
    name_mapping = {
        'בבא בתרא': 'bava batra',
        'בבא מציעא': 'bava metzia', 
        'בבא קמא': 'bava kamma',
        'ביצה': 'beitza',
        'בכורות': 'bekhorot',
        'ברכות': 'berakhot',
        'גיטין': 'gittin',
        'חגיגה': 'chagigah',
        'חולין': 'chullin',
        'יבמות': 'yevamot',
        'יומא': 'yoma',
        'כריתות': 'keritot',
        'כתובות': 'ketubot',
        'מגילה': 'megillah',
        'מועד קטן': 'moed katan',
        'מכות': 'makkot',
        'מנחות': 'menachot',
        'נדרים': 'nedarim',
        'נזיר': 'nazir',
        'נידה': 'niddah',
        'פסחים': 'pesachim',
        'קידושין': 'kiddushin',
        'ראש השנה': 'rosh hashanah',
        'סנהדרין': 'sanhedrin',
        'סוכה': 'sukkah',
        'סוטה': 'sotah',
        'שבועות': 'shevuot',
        'שבת': 'shabbat',
        'תמורה': 'temurah',
        'תמיד': 'tamid',
        'תענית': 'taanit',
        'זבחים': 'zevachim',
        'ערובין': 'eruvin',
        'עירובין': 'eruvin',
        'הוריות': 'horayot',
        'מעילה': 'meilah',
        'עבודה זרה': 'avodah zarah',
        'ערכין': 'arakhin'
    }
    return name_mapping.get(hebrew_name, hebrew_name.lower().replace(' ', '_'))

def extract_english_chapter_name(hebrew_text):
    """Extract proper English chapter names where possible"""
    # Enhanced mapping based on the original file's patterns
    chapter_mappings = {
        # Berakhot
        'פרק א': {'berakhot': 'Me\'eimatay'},
        'פרק ב': {'berakhot': 'Hayah Korei', 'shabbat': 'BaMeh Madlikin'},
        'פרק ג': {'berakhot': 'Mi She\'meto', 'shabbat': 'Kirah'},
        'פרק ד': {'berakhot': 'Tefilat HaShachar', 'shabbat': 'BaMeh Tomnin'},
        'פרק ה': {'berakhot': 'Ein Omdin', 'shabbat': 'BaMeh Beheimah'},
        'פרק ו': {'berakhot': 'Keytzad Mevarkhim', 'shabbat': 'BaMeh Ishah'},
        'פרק ז': {'berakhot': 'Sheloshah She\'achlu', 'shabbat': 'Kelal Gadol'},
        'פרק ח': {'berakhot': 'Eilu Devarim', 'shabbat': 'HaMotzi Yayin'},
        'פרק ט': {'berakhot': 'HaRo\'eh', 'shabbat': 'Amar Rabbi Akiva'},
        
        # Special names from Bava Kamma
        'פרק א - ארבעה אבות': {'bava kamma': 'Arba\'ah Avot'},
        'פרק ב - כיצד הרגל': {'bava kamma': 'Keytzad HaRegel'},
        'פרק ג - המניח את הכד': {'bava kamma': 'HaMani\'ach Et HaKad'},
        'פרק ד - שור שנגח ד\' וה\'': {'bava kamma': 'Shor She\'nagach'},
        'פרק ה - שור שנגח את הפרה': {'bava kamma': 'Shor She\'nagach Et HaParah'},
        'פרק ו - הכונס': {'bava kamma': 'HaKoneis'},
        'פרק ז - מרובה': {'bava kamma': 'Merubah'},
        'פרק ח - החובל': {'bava kamma': 'HaChovel'},
        'פרק ט - הגוזל עצים': {'bava kamma': 'HaGozel Etzim'},
        'פרק י - הגוזל ומאכיל': {'bava kamma': 'HaGozel UMa\'akhil'},
    }
    
    return chapter_mappings.get(hebrew_text, {})

def process_excel_data():
    """Process the Excel data and return structured dictionary"""
    df = pd.read_excel('./attached_assets/talmud_chapters_1754760890599.xlsx')
    
    result = {}
    for tractate_hebrew, group in df.groupby('Tractate name'):
        tractate_english = normalize_tractate_name(tractate_hebrew)
        chapters = []
        
        for idx, row in group.iterrows():
            start_folio, start_side = parse_page_ref(row['Chapter page start'])
            end_folio, end_side = parse_page_ref(row['Chapter page end'])
            
            if start_folio and end_folio:
                chapter_num = len(chapters) + 1
                chapter_text = str(row['Chapter'])
                
                # Get English name if available from mappings
                english_mappings = extract_english_chapter_name(chapter_text)
                english_name = english_mappings.get(tractate_english, f'Chapter {chapter_num}')
                
                chapters.append({
                    'number': chapter_num,
                    'englishName': english_name,
                    'hebrewName': chapter_text,
                    'startFolio': start_folio,
                    'startSide': start_side,
                    'endFolio': end_folio,
                    'endSide': end_side
                })
        
        if chapters:
            result[tractate_english] = chapters
    
    return result

def generate_typescript_code(data):
    """Generate TypeScript code for the CHAPTER_DATA dictionary"""
    lines = ['export const CHAPTER_DATA: Record<string, Array<{']
    lines.append('  number: number;')
    lines.append('  englishName: string;')
    lines.append('  hebrewName: string;')
    lines.append('  startFolio: number;')
    lines.append('  startSide: \'a\' | \'b\';')
    lines.append('  endFolio: number;')
    lines.append('  endSide: \'a\' | \'b\';')
    lines.append('}>> = {')
    
    for tractate_key in sorted(data.keys()):
        chapters = data[tractate_key]
        lines.append(f'  "{tractate_key}": [')
        
        for chapter in chapters:
            line = f'    {{ number: {chapter["number"]}, ' + \
                  f'englishName: "{chapter["englishName"]}", ' + \
                  f'hebrewName: "{chapter["hebrewName"]}", ' + \
                  f'startFolio: {chapter["startFolio"]}, ' + \
                  f'startSide: \'{chapter["startSide"]}\', ' + \
                  f'endFolio: {chapter["endFolio"]}, ' + \
                  f'endSide: \'{chapter["endSide"]}\' }},'
            lines.append(line)
        
        lines.append('  ],')
    
    lines.append('};')
    return '\n'.join(lines)

if __name__ == '__main__':
    print("Processing Excel data...")
    data = process_excel_data()
    
    print(f"Found {len(data)} tractates with data:")
    for tractate, chapters in sorted(data.items()):
        print(f"  {tractate}: {len(chapters)} chapters")
    
    print("\nGenerating TypeScript code...")
    ts_code = generate_typescript_code(data)
    
    print("\nSample of generated code (first few lines):")
    print('\n'.join(ts_code.split('\n')[:20]))
    
    # Save to file
    with open('new_chapter_data.ts', 'w', encoding='utf-8') as f:
        f.write(ts_code)
    
    print(f"\nComplete TypeScript code saved to 'new_chapter_data.ts'")