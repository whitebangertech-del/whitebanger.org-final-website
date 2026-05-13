const fs = require('fs');
const path = require('path');

// List of files to modify (28 files, excluding about.html which is already done)
const filesToModify = [
  'ai-automation.html',
  'approvals-accreditations.html',
  'banking-finance.html',
  'blast-from-the-past.html',
  'cloud-management.html',
  'contact.html',
  'course-detail.html',
  'course.html',
  'graphic-design.html',
  'industry-experts.html',
  'international-placements.html',
  'internship-form.html',
  'internship.html',
  'iqs-certified.html',
  'iso-certified.html',
  'mca-accreditation.html',
  'mous-collaboration.html',
  'msme-accreditation.html',
  'nasscom-accreditation.html',
  'national-placements.html',
  'naveen-avsar-yojana.html',
  'nielit-accreditation.html',
  'software-development.html',
  'startup-india-accreditation.html',
  'tally-accreditation.html',
  'testimonials.html',
  'thank-you.html',
  'ui-ux.html',
  'web-development.html'
];

let successCount = 0;
let failureCount = 0;
const processedFiles = [];

filesToModify.forEach(filename => {
  const filePath = path.join(__dirname, filename);

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Pattern to find: from MOUs to end of dropdown-sub div, then close About dropdown
    // and open Courses dropdown
    // This uses a more flexible approach to handle varying indentation
    const regex = /(<a href="mous-collaboration\.html">MOUs and Collaborations<\/a>)\r?\n\s*<div class="wb-dropdown-sub">\r?\n\s*<span class="wb-dropdown-sub-toggle">Approvals &amp; Accreditations[^<]*<\/span>\r?\n\s*<div class="wb-dropdown-sub-menu">\r?\n([\s\S]*?)\s*<\/div>\r?\n\s*<\/div>/;

    const match = content.match(regex);

    if (!match) {
      console.log(`[SKIP] ${filename} - pattern not found`);
      failureCount++;
      return;
    }

    // Extract the sub-menu items
    const subMenuContent = match[2];

    // Determine indentation by looking at the closest context
    // Get lines around MOUs
    const mouIndex = content.indexOf('MOUs and Collaborations');
    const beforeMous = content.lastIndexOf('\n', mouIndex);
    const mouLineStart = content.substring(beforeMous + 1, mouIndex);
    const mouIndent = mouLineStart.match(/^(\s*)/)[1];

    // For new Approvals dropdown at top level (one level up from MOUs)
    const topLevelIndent = mouIndent.slice(0, -2);

    // Check for line ending style
    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';

    // Build the replacement
    // Keep MOUs, close About dropdown, add new Approvals dropdown
    const replacement = `<a href="mous-collaboration.html">MOUs and Collaborations</a>${lineEnding}${mouIndent.slice(0, -2)}</div>${lineEnding}${mouIndent.slice(0, -4)}</div>${lineEnding}${mouIndent.slice(0, -4)}<div class="wb-nav-dropdown">${lineEnding}${topLevelIndent}<a href="#" class="wb-nav-link"><span>Approvals &amp; Accreditations</span> <span class="wb-dropdown-arrow">▼</span></a>${lineEnding}${topLevelIndent}<div class="wb-dropdown-menu">${lineEnding}${subMenuContent}${lineEnding}${topLevelIndent}</div>${lineEnding}${mouIndent.slice(0, -4)}</div>`;

    // Replace
    const updatedContent = content.replace(regex, replacement);

    // Write back to file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`[SUCCESS] ${filename}`);
    processedFiles.push(filename);
    successCount++;
  } catch (error) {
    console.log(`[ERROR] ${filename} - ${error.message}`);
    failureCount++;
  }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Successfully modified: ${successCount} files`);
console.log(`Failed or skipped: ${failureCount} files`);
if (processedFiles.length > 0) {
  console.log(`\nProcessed files:`);
  processedFiles.forEach(f => console.log(`  - ${f}`));
}
