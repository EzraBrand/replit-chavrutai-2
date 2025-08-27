#!/usr/bin/env python3
"""
Extract duplicate tractate data from tractate-contents.tsx and export to Excel.
This script helps identify differences between duplicate entries for manual review.
"""

import pandas as pd
import re
from typing import Dict, List, Any

def extract_tractate_data(file_path: str) -> Dict[str, Any]:
    """Extract chapter data for all tractates from the TypeScript file."""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the CHAPTER_DATA object
    start_pattern = r'export const CHAPTER_DATA.*?= {'
    start_match = re.search(start_pattern, content, re.DOTALL)
    if not start_match:
        raise ValueError("Could not find CHAPTER_DATA object")
    
    start_pos = start_match.end() - 1  # Include the opening brace
    
    # Find the matching closing brace
    brace_count = 0
    end_pos = start_pos
    for i, char in enumerate(content[start_pos:], start_pos):
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                end_pos = i + 1
                break
    
    chapter_data_text = content[start_pos:end_pos]
    
    # Extract individual tractate entries
    tractate_pattern = r'(\w+|"[^"]+"):\s*\[(.*?)\](?=,\s*(?:\w+|"[^"]+"):\s*\[|,?\s*})'
    tractate_matches = re.findall(tractate_pattern, chapter_data_text, re.DOTALL)
    
    tractates = {}
    for tractate_name, chapters_text in tractate_matches:
        # Clean up tractate name
        clean_name = tractate_name.strip('"')
        
        # Extract chapter objects
        chapter_pattern = r'{\s*number:\s*(\d+),\s*englishName:\s*"([^"]*)",\s*hebrewName:\s*"([^"]*)",\s*startFolio:\s*(\d+),\s*startSide:\s*"([ab])",\s*endFolio:\s*(\d+),\s*endSide:\s*"([ab])"\s*}'
        chapter_matches = re.findall(chapter_pattern, chapters_text)
        
        chapters = []
        for match in chapter_matches:
            chapters.append({
                'number': int(match[0]),
                'englishName': match[1],
                'hebrewName': match[2],
                'startFolio': int(match[3]),
                'startSide': match[4],
                'endFolio': int(match[5]),
                'endSide': match[6]
            })
        
        # Store all instances of this tractate
        if clean_name in tractates:
            tractates[clean_name].append(chapters)
        else:
            tractates[clean_name] = [chapters]
    
    return tractates

def create_comparison_dataframes(tractates: Dict[str, List[List[Dict]]]) -> Dict[str, pd.DataFrame]:
    """Create comparison DataFrames for duplicate tractates."""
    
    duplicate_tractates = {name: chapters for name, chapters in tractates.items() if len(chapters) > 1}
    
    comparison_dfs = {}
    
    for tractate_name, instances in duplicate_tractates.items():
        rows = []
        
        # Get maximum number of chapters across all instances
        max_chapters = max(len(instance) for instance in instances)
        
        for chapter_idx in range(max_chapters):
            for instance_idx, instance in enumerate(instances):
                if chapter_idx < len(instance):
                    chapter = instance[chapter_idx]
                    rows.append({
                        'Tractate': tractate_name,
                        'Instance': f'Instance {instance_idx + 1}',
                        'Chapter_Number': chapter['number'],
                        'English_Name': chapter['englishName'],
                        'Hebrew_Name': chapter['hebrewName'],
                        'Start_Folio': chapter['startFolio'],
                        'Start_Side': chapter['startSide'],
                        'End_Folio': chapter['endFolio'],
                        'End_Side': chapter['endSide'],
                        'Folio_Range': f"{chapter['startFolio']}{chapter['startSide']}-{chapter['endFolio']}{chapter['endSide']}"
                    })
                else:
                    # Empty row for missing chapters
                    rows.append({
                        'Tractate': tractate_name,
                        'Instance': f'Instance {instance_idx + 1}',
                        'Chapter_Number': None,
                        'English_Name': '',
                        'Hebrew_Name': '',
                        'Start_Folio': None,
                        'Start_Side': '',
                        'End_Folio': None,
                        'End_Side': '',
                        'Folio_Range': ''
                    })
        
        comparison_dfs[tractate_name] = pd.DataFrame(rows)
    
    return comparison_dfs

def export_to_excel(comparison_dfs: Dict[str, pd.DataFrame], output_file: str):
    """Export comparison data to Excel with multiple sheets."""
    
    # Create summary data first
    summary_data = []
    for tractate_name, df in comparison_dfs.items():
        instances = df['Instance'].unique()
        total_chapters_per_instance = [
            len(df[df['Instance'] == instance].dropna(subset=['Chapter_Number'])) 
            for instance in instances
        ]
        
        summary_data.append({
            'Tractate': tractate_name,
            'Num_Instances': len(instances),
            'Chapters_Instance_1': total_chapters_per_instance[0] if len(total_chapters_per_instance) > 0 else 0,
            'Chapters_Instance_2': total_chapters_per_instance[1] if len(total_chapters_per_instance) > 1 else 0,
            'Difference': abs(total_chapters_per_instance[0] - total_chapters_per_instance[1]) if len(total_chapters_per_instance) > 1 else 0,
            'Issue_Type': 'Chapter count mismatch' if len(total_chapters_per_instance) > 1 and total_chapters_per_instance[0] != total_chapters_per_instance[1] else 'Duplicate entry'
        })
    
    summary_df = pd.DataFrame(summary_data)
    
    # Create detailed comparison data
    all_rows = []
    for tractate_name, df in comparison_dfs.items():
        for chapter_num in df['Chapter_Number'].dropna().unique():
            instances = df[df['Chapter_Number'] == chapter_num]
            if len(instances) > 1:
                instance_1 = instances.iloc[0]
                instance_2 = instances.iloc[1] if len(instances) > 1 else None
                
                # Check for differences
                differences = []
                if instance_2 is not None:
                    if instance_1['English_Name'] != instance_2['English_Name']:
                        differences.append('English_Name')
                    if instance_1['Hebrew_Name'] != instance_2['Hebrew_Name']:
                        differences.append('Hebrew_Name')
                    if instance_1['Folio_Range'] != instance_2['Folio_Range']:
                        differences.append('Folio_Range')
                
                all_rows.append({
                    'Tractate': tractate_name,
                    'Chapter': chapter_num,
                    'Instance_1_English': instance_1['English_Name'],
                    'Instance_2_English': instance_2['English_Name'] if instance_2 is not None else '',
                    'Instance_1_Hebrew': instance_1['Hebrew_Name'],
                    'Instance_2_Hebrew': instance_2['Hebrew_Name'] if instance_2 is not None else '',
                    'Instance_1_Range': instance_1['Folio_Range'],
                    'Instance_2_Range': instance_2['Folio_Range'] if instance_2 is not None else '',
                    'Differences': ', '.join(differences) if differences else 'No differences',
                    'Has_Differences': 'Yes' if differences else 'No'
                })
    
    comparison_detail_df = pd.DataFrame(all_rows)
    
    # Export to Excel with proper error handling
    try:
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            # Write summary sheet first
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Write detailed comparison
            comparison_detail_df.to_excel(writer, sheet_name='Detailed_Comparison', index=False)
            
            # Write individual tractate sheets
            for tractate_name, df in comparison_dfs.items():
                # Clean sheet name (Excel has limitations)
                sheet_name = tractate_name.replace(' ', '_').replace('"', '').replace('/', '_')[:31]
                df.to_excel(writer, sheet_name=sheet_name, index=False)
    except Exception as e:
        print(f"Excel export failed, falling back to CSV: {e}")
        # Fallback to CSV export
        summary_df.to_csv('duplicate_tractates_summary.csv', index=False)
        comparison_detail_df.to_csv('duplicate_tractates_details.csv', index=False)
        for tractate_name, df in comparison_dfs.items():
            safe_name = tractate_name.replace(' ', '_').replace('"', '').replace('/', '_')
            df.to_csv(f'duplicate_tractate_{safe_name}.csv', index=False)

def main():
    """Main execution function."""
    
    print("Extracting duplicate tractate data from tractate-contents.tsx...")
    
    try:
        # Extract data
        tractates = extract_tractate_data('client/src/pages/tractate-contents.tsx')
        
        # Find duplicates
        duplicates = {name: chapters for name, chapters in tractates.items() if len(chapters) > 1}
        
        print(f"Found {len(duplicates)} tractates with duplicate entries:")
        for name in duplicates.keys():
            print(f"  - {name}")
        
        # Create comparison DataFrames
        comparison_dfs = create_comparison_dataframes(tractates)
        
        # Export to Excel
        output_file = 'duplicate_tractates_analysis.xlsx'
        export_to_excel(comparison_dfs, output_file)
        
        print(f"\nExcel file exported: {output_file}")
        print("\nSheets created:")
        print("  - Summary: Overview of all duplicates")
        print("  - Detailed_Comparison: Side-by-side comparison of differences")
        print("  - Individual sheets for each duplicate tractate")
        
        # Print summary statistics
        print(f"\nSummary Statistics:")
        total_instances = sum(len(instances) for instances in duplicates.values())
        print(f"  - Total duplicate instances: {total_instances}")
        print(f"  - Unique tractates with duplicates: {len(duplicates)}")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())