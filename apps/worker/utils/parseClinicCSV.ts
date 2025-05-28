import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { RawClinic } from '../types/clinic';

export async function parseClinicCSV(input: string): Promise<RawClinic[]> {
  let csvContent: string;
  
  // Check if input is a file path or raw CSV string
  if (input.includes('\n') || input.includes(',')) {
    csvContent = input;
  } else {
    // Assume it's a file path
    try {
      csvContent = fs.readFileSync(input, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read CSV file: ${input}. Error: ${error}`);
    }
  }

  try {
    const records = parse(csvContent, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true,
      quote: '"',
      escape: '"',
      auto_parse: false, // Keep everything as strings
      relax_column_count: true, // Allow inconsistent column counts
    });

    // Normalize headers and handle empty cells
    const normalizedRecords: RawClinic[] = records.map((record: any) => {
      const normalized: RawClinic = {};
      
      Object.keys(record).forEach(key => {
        const normalizedKey = normalizeHeader(key);
        const value = record[key];
        
        // Handle empty cells
        normalized[normalizedKey] = value && value.trim() !== '' ? value.trim() : undefined;
      });

      return normalized;
    });

    console.log(`✅ Parsed ${normalizedRecords.length} records from CSV`);
    return normalizedRecords;
    
  } catch (error) {
    throw new Error(`Failed to parse CSV content: ${error}`);
  }
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .replace(/address1?/i, 'address')
    .replace(/phonenumber/i, 'phone')
    .replace(/zipcode/i, 'zip')
    .replace(/clinicname/i, 'name')
    .replace(/websiteurl/i, 'website');
}