// Selectors for modal focus functionality
const MODAL_CONTAINER_SELECTOR = '.popin'
const FOCUSABLE_INPUT_SELECTOR = 'input[type="text"], input:not([type]), input[type="number"], select, textarea'

/**
 * Composable for handling modal focus functionality
 */
export const useModalFocus = () => {
  /**
   * Focus the first input element in a modal
   * @param delay - Delay in milliseconds before focusing (default: 100ms)
   */
  const focusFirstInput = (delay = 100) => {
    setTimeout(() => {
      const modal = document.querySelector(MODAL_CONTAINER_SELECTOR)
      const inputEl = modal?.querySelector(FOCUSABLE_INPUT_SELECTOR) as HTMLElement
      inputEl?.focus()
    }, delay)
  }

  return {
    focusFirstInput
  }
}