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
      const modal = document.querySelector('.popin')
      const inputEl = modal?.querySelector('input[type="text"], input:not([type]), input[type="number"], select, textarea') as HTMLElement
      inputEl?.focus()
    }, delay)
  }

  return {
    focusFirstInput
  }
}