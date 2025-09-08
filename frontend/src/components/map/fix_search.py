#!/usr/bin/env python3

# Read the file
with open('FreeMapEmbed.jsx', 'r') as f:
    lines = f.readlines()

# Find and replace the handleSearch function
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Find the handleSearch function
    if 'const handleSearch = () => {' in line:
        new_lines.append(line)
        i += 1
        
        # Skip the opening brace
        if '{' in lines[i]:
            new_lines.append(lines[i])
            i += 1
        
        # Replace the function body
        new_lines.append('    if (currentLocation) {\n')
        new_lines.append('      setLoading(true);\n')
        new_lines.append('      generateFreeMapUrl(currentLocation, searchQuery || \'medical facilities\');\n')
        new_lines.append('      findNearbyFacilities(currentLocation.lat, currentLocation.lng);\n')
        new_lines.append('    } else {\n')
        new_lines.append('      setError(\'Please get your location first or allow location access to search for facilities.\');\n')
        new_lines.append('    }\n')
        
        # Skip the old function body until we find the closing brace
        while i < len(lines) and '};' not in lines[i]:
            i += 1
        
        # Add the closing brace
        if i < len(lines):
            new_lines.append(lines[i])
            i += 1
    else:
        new_lines.append(line)
        i += 1

# Find and add search filtering
final_lines = []
i = 0
while i < len(new_lines):
    line = new_lines[i]
    
    # Find where to add search filtering
    if 'filtered.sort((a, b) => a.distance - b.distance);' in line:
        # Add search filtering before the sort
        final_lines.append('      // If there is a search query, filter by name or specialties\n')
        final_lines.append('      if (searchQuery.trim()) {\n')
        final_lines.append('        const query = searchQuery.toLowerCase();\n')
        final_lines.append('        filtered = filtered.filter(facility => \n')
        final_lines.append('          facility.name.toLowerCase().includes(query) ||\n')
        final_lines.append('          facility.specialties.some(specialty => specialty.toLowerCase().includes(query)) ||\n')
        final_lines.append('          facility.type.toLowerCase().includes(query)\n')
        final_lines.append('        );\n')
        final_lines.append('      }\n')
        final_lines.append('      \n')
        final_lines.append(line)
    else:
        final_lines.append(line)
    i += 1

# Write the fixed file
with open('FreeMapEmbed.jsx', 'w') as f:
    f.writelines(final_lines)

print('Search functionality fixed successfully!')
