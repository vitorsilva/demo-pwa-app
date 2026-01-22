// State Manager - Centralized state for the app

class AppState {
  constructor() {
    this.data = {
      currentTopic: null,
      currentGradeLevel: 'middle school',
      currentQuestions: null,
      currentAnswers: [],
      currentScore: null,
      lastSessionId: null,
      // Continue chain - tracks questions across continues on same topic
      continueChain: null, // { topic, continueCount, previousQuestions, startingGradeLevel }
    };

    this.listeners = []; // Functions to call when state changes
  }

  /**
   * Get a state value
   * @param {string} key - State key to get
   */
  get(key) {
    return this.data[key];
  }

  /**
   * Set a state value
   * @param {string} key - State key to set
   * @param {*} value - Value to set
   */
  set(key, value) {
    this.data[key] = value;
    this.notify(key, value);
  }

  /**
   * Update multiple state values at once
   * @param {Object} updates - Object with key-value pairs to update
   */
  update(updates) {
    Object.assign(this.data, updates);
    this.notify('*', this.data);
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Function to call when state changes
   */
  subscribe(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners of state change
   */
  notify(key, value) {
    this.listeners.forEach((callback) => callback(key, value));
  }

  /**
   * Clear all state (useful for logout, reset)
   */
  clear() {
    this.data = {
      currentTopic: null,
      currentGradeLevel: 'middle school',
      currentQuestions: null,
      currentAnswers: [],
      currentScore: null,
      lastSessionId: null,
      continueChain: null,
    };
    this.notify('*', this.data);
  }

  /**
   * Initialize a continue chain for a topic
   * @param {string} topic - Topic being continued
   * @param {string} gradeLevel - Starting grade level
   * @param {Array} questions - Initial questions
   */
  initContinueChain(topic, gradeLevel, questions) {
    this.data.continueChain = {
      topic,
      continueCount: 0,
      previousQuestions: questions.map((q) => q.question),
      startingGradeLevel: gradeLevel,
    };
  }

  /**
   * Add questions to the continue chain
   * @param {Array} questions - New questions to add
   */
  addToContinueChain(questions) {
    if (this.data.continueChain) {
      this.data.continueChain.continueCount++;
      this.data.continueChain.previousQuestions.push(...questions.map((q) => q.question));
    }
  }

  /**
   * Clear the continue chain
   */
  clearContinueChain() {
    this.data.continueChain = null;
  }

  /**
   * Get the continue chain data
   */
  getContinueChain() {
    return this.data.continueChain;
  }
}

// Export singleton instance
export default new AppState();
