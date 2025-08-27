#!/usr/bin/env python3
"""
Simple extraction of duplicate tractate data for manual review.
"""

import csv
import re

def extract_duplicate_tractates():
    """Extract and save duplicate tractate data to CSV files."""
    
    # Read the TypeScript file
    with open('client/src/pages/tractate-contents.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Known duplicate tractate names and their line ranges (approximate)
    duplicates = {
        'beitza': [(442, 488), (1375, 1421)],
        'bava_kamma': [(258, 349), (2050, 2141)], 
        'bava_metzia': [(350, 441), (2142, 2233)],
        'bava_batra': [(166, 257), (2234, 2325)],
        'avodah_zarah': [(119, 165), (2427, 2473)],
        'bekhorot': [(489, 571), (3153, 3235)],
        'arakhin': [(36, 118), (3236, 3318)]
    }
    
    lines = content.split('\n')
    
    # Prepare CSV data
    csv_data = []
    csv_data.append(['Tractate', 'Instance', 'Line_Start', 'Line_End', 'Raw_Data'])
    
    for tractate_name, ranges in duplicates.items():
        for i, (start_line, end_line) in enumerate(ranges):
            # Extract the raw text
            raw_data = '\n'.join(lines[start_line-1:end_line]).strip()
            
            csv_data.append([
                tractate_name,
                f'Instance_{i+1}', 
                start_line,
                end_line,
                raw_data[:500] + '...' if len(raw_data) > 500 else raw_data  # Truncate for CSV
            ])
    
    # Write to CSV
    with open('duplicate_tractates_raw.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(csv_data)
    
    print("Raw data exported to: duplicate_tractates_raw.csv")
    
    # Also create individual files for each tractate for easier review
    for tractate_name, ranges in duplicates.items():
        filename = f'duplicate_{tractate_name}.txt'
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"DUPLICATE ANALYSIS FOR: {tractate_name.upper()}\n")
            f.write("=" * 60 + "\n\n")
            
            for i, (start_line, end_line) in enumerate(ranges):
                f.write(f"INSTANCE {i+1} (Lines {start_line}-{end_line}):\n")
                f.write("-" * 40 + "\n")
                raw_data = '\n'.join(lines[start_line-1:end_line]).strip()
                f.write(raw_data)
                f.write("\n\n")
        
        print(f"Individual file created: {filename}")
    
    # Create summary
    summary_data = []
    summary_data.append(['Tractate', 'Instance_1_Lines', 'Instance_2_Lines', 'Line_Difference', 'Issue_Description'])
    
    for tractate_name, ranges in duplicates.items():
        if len(ranges) >= 2:
            range1_size = ranges[0][1] - ranges[0][0] + 1
            range2_size = ranges[1][1] - ranges[1][0] + 1
            difference = abs(range1_size - range2_size)
            
            # Extract key info for comparison
            range1_text = '\n'.join(lines[ranges[0][0]-1:ranges[0][1]]).strip()
            range2_text = '\n'.join(lines[ranges[1][0]-1:ranges[1][1]]).strip()
            
            issue_desc = "Different content lengths" if difference > 10 else "Similar lengths - likely exact duplicate"
            if "Chapter 1" in range1_text and "Chapter 1" in range2_text:
                issue_desc += " | Both contain chapter data"
            
            summary_data.append([
                tractate_name,
                f"{ranges[0][0]}-{ranges[0][1]} ({range1_size} lines)",
                f"{ranges[1][0]}-{ranges[1][1]} ({range2_size} lines)",
                difference,
                issue_desc
            ])
    
    with open('duplicate_summary.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(summary_data)
    
    print("Summary exported to: duplicate_summary.csv")

if __name__ == "__main__":
    extract_duplicate_tractates()