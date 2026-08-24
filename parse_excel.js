import XLSX from 'xlsx';

try {
  const workbook = XLSX.readFile('/Applications/Mind/RABP/updatedata/updatedata2/Data Rakhan.xlsx');
  
  console.log("Sheet names:");
  console.log(workbook.SheetNames);
  
  const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('sub'));
  if (sheetName) {
    console.log(`\nReading sheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(data.slice(0, 50)); 
  } else {
    console.log("No sheet found matching 'sub'");
    console.log(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]).slice(0, 5));
  }
} catch (e) {
  console.error("Error reading excel:", e);
}
