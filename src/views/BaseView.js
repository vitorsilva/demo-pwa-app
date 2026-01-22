// BaseView - Base class for all views

export default class BaseView {
  constructor() {
    this.appContainer = document.getElementById('app');
    this.listeners = []; // Track event listeners for cleanup
  }

  /**
   * Render the view (must be implemented by subclass)
   */
  render() {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Cleanup method - prevents memory leaks
   */
  destroy() {
    // Remove all tracked event listeners
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];

    // Clear DOM content
    this.appContainer.innerHTML = '';
  }

  /**
   * Helper to set HTML content
   */
  setHTML(html) {
    this.appContainer.innerHTML = html;
  }

  /**
   * Helper to find elements
   */
  querySelector(selector) {
    return this.appContainer.querySelector(selector);
  }

  /**
   * Helper to add event listener with automatic tracking
   */
  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.listeners.push({ element, event, handler });
  }

  /**
   * Helper to navigate to another route
   */
  navigateTo(path) {
    window.location.hash = path;
  }
}
