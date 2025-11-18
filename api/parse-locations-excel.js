import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Excel file (you need to place the file in the api directory)
const excelFilePath = path.join(__dirname, 'India_States_UTs_Districts.xlsx');
const outputFilePath = path.join(__dirname, 'src/data/india-locations.json');

console.log('📊 Parsing India States/UTs and Districts from Excel...\n');

try {
  // Read the Excel file
  const workbook = XLSX.readFile(excelFilePath);
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`✅ Found ${data.length} rows in Excel file\n`);
  
  // Process the data
  const statesSet = new Set();
  const districtsMap = {};
  
  data.forEach((row, index) => {
    // The Excel has columns: State/UT, District
    const state = row['State/UT'] || row['State'] || row['STATE'];
    const district = row['District'] || row['DISTRICT'];
    
    if (state && district) {
      statesSet.add(state.trim());
      
      if (!districtsMap[state.trim()]) {
        districtsMap[state.trim()] = [];
      }
      
      if (!districtsMap[state.trim()].includes(district.trim())) {
        districtsMap[state.trim()].push(district.trim());
      }
    }
  });
  
  // Sort states and districts
  const states = Array.from(statesSet).sort();
  
  Object.keys(districtsMap).forEach(state => {
    districtsMap[state].sort();
  });
  
  // Create the output object
  const output = {
    states: states,
    districts: districtsMap,
    metadata: {
      totalStates: states.length,
      totalDistricts: Object.values(districtsMap).reduce((sum, districts) => sum + districts.length, 0),
      generatedAt: new Date().toISOString(),
      source: 'India_States_UTs_Districts.xlsx'
    }
  };
  
  // Ensure the data directory exists
  const dataDir = path.join(__dirname, 'src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Write to JSON file
  fs.writeFileSync(outputFilePath, JSON.stringify(output, null, 2));
  
  console.log('✅ Successfully parsed Excel file!');
  console.log(`📍 Total States/UTs: ${output.metadata.totalStates}`);
  console.log(`📍 Total Districts: ${output.metadata.totalDistricts}`);
  console.log(`💾 Output saved to: ${outputFilePath}\n`);
  
  // Show sample data
  console.log('📋 Sample States:');
  states.slice(0, 5).forEach(state => {
    console.log(`   - ${state} (${districtsMap[state].length} districts)`);
  });
  
  console.log('\n✅ Done!');
  
} catch (error) {
  console.error('❌ Error parsing Excel file:', error.message);
  console.error('\n💡 Make sure to place "India_States_UTs_Districts.xlsx" in the api directory');
  process.exit(1);
}
