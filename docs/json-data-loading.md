# External JSON Data Loading & State Management

## Overview

The Capacity Planner now supports loading data from external JSON files and emptying the PlannerState. This allows for flexible data management and testing different scenarios.

## Features

### 1. Load Data from JSON Files
- Load planner data from JSON files in the `/public` folder
- Support for multiple datasets
- Automatic data validation and error handling

### 2. Empty PlannerState
- Clear all data (people, projects, assignments) to empty state
- Useful for starting fresh or testing

## JSON File Format

Place JSON files in the `/public` folder with this structure:

```json
{
  "people": [
    { "id": "p1", "name": "Alice" }
  ],
  "projects": [
    { "id": "j1", "name": "Project Name", "color": "#6bc6ff", "emoji": "🟦" }
  ],
  "assignments": [
    { 
      "id": "a1", 
      "person_id": "p1", 
      "project_id": "j1", 
      "start": "2025-10-30", 
      "end": "2025-11-03", 
      "allocation": 1 
    }
  ]
}
```

## Available Files

- `planner-data.json` - Main dataset (5 people, 5 projects, 6 assignments)
- `team-data.json` - Team dataset (3 people, 3 projects, 3 assignments)

## Usage

### Using the UI
1. Use the **Data Manager** file input in the app header
2. Click "Choose File" and select a local JSON file
3. Data will automatically load and refresh the planner
4. Previous data is cleared when new data is loaded

### Download Modified Data
1. When data is modified (create/edit/delete assignments), an orange dot (●) appears
2. A **Download** button becomes available in the Data Manager
3. Click **Download** to save current data as timestamped JSON file
4. Download automatically marks data as "not modified"

### Using the Store Actions
```typescript
import { usePlannerStore } from '@/stores/usePlannerStore'

const store = usePlannerStore()

// Load from remote JSON file (public folder)
await store.loadDataFromJSON('planner-data.json')

// Load from local data object
store.loadDataFromObject(jsonData)

// Download current data
store.downloadPlannerData('my-planner-data.json')

// Check if data is modified
const isModified = store.isDataModified
const shouldShowDownload = store.shouldShowDownload

// Empty all data
store.clearState()
```

### Using the Composable
```typescript
import { useDataLoader } from '@/composables/useDataLoader'

const { 
  loadFromJSON, 
  loadFromObject, 
  clearState, 
  loadMainDataset, 
  loadTeamDataset,
  downloadPlannerData 
} = useDataLoader()

// Load from remote file (public folder)
await loadFromJSON('my-data.json')

// Load from local data object
loadFromObject(parsedJsonData)

// Download current data
downloadPlannerData('backup-2025-10-30.json')

// Load predefined datasets
await loadMainDataset()
await loadTeamDataset()

// Clear all data
clearState()

// Check if file exists
const exists = await checkFileExists('my-data.json')
```

## Error Handling

- Network errors are logged to console
- Invalid JSON files throw parsing errors
- Missing files return 404 errors
- App continues with existing data if loading fails

## Data Validation

- All person_id and project_id references must exist
- Dates must be in ISO format (YYYY-MM-DD)
- Allocation values must be 1, 0.75, 0.5, or 0.25
- Required fields: id, person_id, project_id, start, end, allocation

## Tips

1. **File Naming**: Use descriptive names like `q4-2025-team.json`
2. **Testing**: Use Empty State to test with clean data
3. **Backup**: Export current state before loading new data
4. **Console**: Monitor browser console for loading status messages