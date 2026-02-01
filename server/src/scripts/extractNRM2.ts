import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * NRM 2 Data Extraction Script
 *
 * This script extracts NRM 2 (New Rules of Measurement) data from a PDF
 * and converts it to structured JSON format.
 *
 * Currently uses a manual/semi-manual approach.
 * For production use with a real NRM 2 PDF:
 * 1. Install pdf-parse: npm install pdf-parse pdfjs-dist
 * 2. Update this script to parse PDF and extract text
 * 3. Apply regex patterns to identify hierarchical structure
 * 4. Validate and clean extracted data
 *
 * Usage:
 *   npx ts-node src/scripts/extractNRM2.ts <path-to-pdf>
 */

interface WorkSection {
  code: string;
  title: string;
  description: string;
  measurement_rules: string;
  unit?: string;
  inclusions?: string;
  exclusions?: string;
}

interface SubElement {
  code: string;
  title: string;
  description: string;
  measurement_rules?: string;
  unit?: string;
  work_sections: WorkSection[];
}

interface Element {
  code: string;
  title: string;
  description: string;
  measurement_rules?: string;
  sub_elements: SubElement[];
}

interface Group {
  code: string;
  title: string;
  description: string;
  elements: Element[];
}

interface NRM2Data {
  groups: Group[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extract NRM 2 data from PDF
 *
 * NOTE: This is a placeholder implementation.
 * Replace with actual PDF parsing logic when using a real NRM 2 PDF.
 */
async function extractFromPDF(pdfPath: string): Promise<NRM2Data> {
  console.log(`Attempting to extract NRM 2 from PDF: ${pdfPath}`);

  // For now, return structure that would come from PDF parsing
  // In production, you would:
  // 1. Use pdf-parse to extract text: const pdf = await pdfParse(fs.readFileSync(pdfPath));
  // 2. Parse text using regex patterns to identify groups, elements, etc.
  // 3. Apply cleaning and validation

  return {
    groups: []
  };
}

/**
 * Load NRM 2 data from JSON seed file
 */
function loadFromSeedFile(): NRM2Data {
  const seedPath = path.join(__dirname, '../database/seeds/nrm2_data.json');
  const fileContent = fs.readFileSync(seedPath, 'utf-8');
  return JSON.parse(fileContent) as NRM2Data;
}

/**
 * Validate NRM 2 data structure
 */
function validateData(data: NRM2Data): string[] {
  const errors: string[] = [];

  if (!data.groups || !Array.isArray(data.groups)) {
    errors.push('Invalid root structure: missing or invalid groups array');
    return errors;
  }

  data.groups.forEach((group, groupIndex) => {
    if (!group.code || !group.title) {
      errors.push(`Group ${groupIndex}: missing code or title`);
    }

    if (!group.elements || !Array.isArray(group.elements)) {
      errors.push(`Group ${group.code}: invalid elements array`);
      return;
    }

    group.elements.forEach((element, elementIndex) => {
      if (!element.code || !element.title) {
        errors.push(`Group ${group.code}, Element ${elementIndex}: missing code or title`);
      }

      if (!element.sub_elements || !Array.isArray(element.sub_elements)) {
        errors.push(`Element ${element.code}: invalid sub_elements array`);
        return;
      }

      element.sub_elements.forEach((subElement, subIndex) => {
        if (!subElement.code || !subElement.title) {
          errors.push(`Sub-element ${subIndex} under ${element.code}: missing code or title`);
        }

        if (!subElement.work_sections || !Array.isArray(subElement.work_sections)) {
          errors.push(`Sub-element ${subElement.code}: invalid work_sections array`);
          return;
        }

        subElement.work_sections.forEach((section, sectionIndex) => {
          if (!section.code || !section.title) {
            errors.push(`Work section ${sectionIndex} under ${subElement.code}: missing code or title`);
          }
        });
      });
    });
  });

  return errors;
}

/**
 * Generate summary statistics
 */
function generateStats(data: NRM2Data): void {
  let groupCount = data.groups.length;
  let elementCount = 0;
  let subElementCount = 0;
  let workSectionCount = 0;

  data.groups.forEach(group => {
    elementCount += group.elements.length;
    group.elements.forEach(element => {
      subElementCount += element.sub_elements.length;
      element.sub_elements.forEach(subElement => {
        workSectionCount += subElement.work_sections.length;
      });
    });
  });

  console.log('\n✓ NRM 2 Data Statistics:');
  console.log(`  - Groups (Level 1): ${groupCount}`);
  console.log(`  - Elements (Level 2): ${elementCount}`);
  console.log(`  - Sub-elements (Level 3): ${subElementCount}`);
  console.log(`  - Work sections (Level 4): ${workSectionCount}`);
}

/**
 * Main extraction function
 */
async function main() {
  try {
    console.log('NRM 2 Data Extraction Tool\n');

    let data: NRM2Data;
    const pdfArg = process.argv[2];

    if (pdfArg && pdfArg.endsWith('.pdf')) {
      // Extract from PDF if provided
      if (!fs.existsSync(pdfArg)) {
        throw new Error(`PDF file not found: ${pdfArg}`);
      }
      console.log(`Loading from PDF: ${pdfArg}`);
      data = await extractFromPDF(pdfArg);
    } else {
      // Load from seed file
      console.log('Loading from seed file...');
      data = loadFromSeedFile();
    }

    // Validate data
    console.log('\nValidating data structure...');
    const errors = validateData(data);

    if (errors.length > 0) {
      console.log(`\n✗ Validation errors found (${errors.length}):`);
      errors.forEach(error => console.log(`  - ${error}`));
      process.exit(1);
    }
    console.log('✓ Validation passed');

    // Generate statistics
    generateStats(data);

    console.log('\n✓ NRM 2 data extraction completed successfully');
    console.log(`  Ready for database seeding`);

  } catch (error) {
    console.error(`✗ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
