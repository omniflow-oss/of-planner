import { usePlannerStore } from '@/stores/usePlannerStore'
import type { ExternalPlannerData } from '@/types/planner'

/**
 * Composable for loading planner data from external JSON files and managing state
 */
export function useDataLoader() {
  const store = usePlannerStore()

  /**
   * Load data from a JSON file in the public folder
   * @param filename - The JSON filename (defaults to 'planner-data.json')
   * @returns Promise that resolves to the loaded data
   */
  const loadFromJSON = async (filename = 'planner-data.json') => {
    return await store.loadDataFromJSON(filename)
  }

  /**
   * Clear all data to empty state
   */
  const clearState = () => {
    store.clearState()
  }

  /**
   * Load data from a local file object
   * @param data - The parsed JSON data object
   */
  const loadFromObject = (data: ExternalPlannerData) => {
    store.loadDataFromObject(data)
  }

  /**
   * Load predefined datasets
   */
  const loadMainDataset = () => loadFromJSON('planner-data.json')
  const loadTeamDataset = () => loadFromJSON('team-data.json')

  /**
   * Check if a JSON file exists in the public folder
   * @param filename - The JSON filename to check
   * @returns Promise that resolves to boolean
   */
  const checkFileExists = async (filename: string) => {
    try {
      const response = await fetch(`/${filename}`, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Download current planner data as JSON file
   * @param filename - The filename for the downloaded file (optional)
   */
  const downloadPlannerData = (filename?: string) => {
    store.downloadPlannerData(filename)
  }

  /**
   * Get list of available JSON files (requires manual enumeration)
   * @returns Array of available dataset filenames
   */
  const getAvailableDatasets = () => {
    return [
      'planner-data.json',
      'team-data.json'
    ]
  }

  return {
    loadFromJSON,
    loadFromObject,
    clearState,
    loadMainDataset,
    loadTeamDataset,
    checkFileExists,
    getAvailableDatasets,
    downloadPlannerData
  }
}
