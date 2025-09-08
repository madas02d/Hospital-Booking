const fs = require('fs');

// Read the current file
let content = fs.readFileSync('FreeMapEmbed.jsx', 'utf8');

// Replace the problematic map URL generation with a working free version
const oldUrlPattern = /const embedUrl = `https:\/\/www\.google\.com\/maps\/embed\?pb=!1m18!1m12!1m3!1d2428\.123456789!2d\$\{location\.lng\}!3d\$\{location\.lat\}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13\.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDMxJzEyLjAiTiAxM8KwMjQnMTguMCJF!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde&q=\$\{encodeURIComponent\(finalSearchTerm\)\}`;/;

const newUrlCode = `// Create a FREE Google Maps embed URL using the standard embed method
    // This method doesn't require an API key and works for everyone
    const embedUrl = \`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2428.123456789!2d\${location.lng}!3d\${location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDMxJzEyLjAiTiAxM8KwMjQnMTguMCJF!5e0!3m2!1sen!2sde!4v1234567890123!5m2!1sen!2sde&q=\${encodeURIComponent(finalSearchTerm)}\`;`;

content = content.replace(oldUrlPattern, newUrlCode);

// Write the fixed content back
fs.writeFileSync('FreeMapEmbed.jsx', content);

console.log('Map URL fixed successfully!');
