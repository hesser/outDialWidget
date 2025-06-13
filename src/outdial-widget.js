import { Desktop } from '@wxcc-desktop/sdk';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    .container {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      padding: 16px;
      border-radius: 8px;
      background-color: #f5f5f5;
      max-width: 500px;
      margin: 0 auto;
    }
    
    .dark-mode {
      background-color: #2d2d2d;
      color: #f5f5f5;
    }
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .icon {
      font-size: 24px;
      margin-right: 12px;
    }
    
    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .content {
      margin-bottom: 16px;
    }
    
    .status {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    
    
    .status-text {
      font-size: 14px;
    }
    
    .phone-container {
      margin-bottom: 16px;
    }
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 600;
    }
    
    input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
      margin-bottom: 8px;
    }
    
    .dark-mode input {
      background-color: #444;
      color: #f5f5f5;
      border-color: #666;
    }
    
    button {
      background-color: #007AA3;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    button:hover {
      background-color: #005E7D;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .dark-mode button:disabled {
      background-color: #444444;
    }
    
    .button-container {
      display: flex;
      justify-content: space-between;
    }
    
    .logs {
      margin-top: 16px;
      max-height: 120px;
      overflow-y: auto;
      font-size: 12px;
      background-color: #ffffff;
      border-radius: 4px;
      padding: 8px;
      border: 1px solid #ddd;
    }
    
    .dark-mode .logs {
      background-color: #333333;
      border-color: #555555;
    }
    
    .log-entry {
      margin-bottom: 4px;
      padding-bottom: 4px;
      border-bottom: 1px solid #eee;
    }
    
    .dark-mode .log-entry {
      border-bottom: 1px solid #444;
    }
    
    .timestamp {
      color: #888;
      margin-right: 6px;
    }
    
    .dark-mode .timestamp {
      color: #aaa;
    }
    
    .success {
      color: #44CC44;
    }
    
    .error {
      color: #FF5252;
    }
    
    .info {
      color: #2196F3;
    }
    
    .dark-mode .success {
      color: #5CFF5C;
    }
    
    .dark-mode .error {
      color: #FF7575;
    }
    
    .dark-mode .info {
      color: #64B5F6;
    }
  </style>

  <div class="container">
    <div class="header">
      <span class="icon">📞</span>
      <h2>Outdial Widget</h2>
    </div>
    
    <div class="content">
      
      <div class="phone-container">
        <label for="phone-number">Phone Number:</label>
        <input type="tel" id="phone-number" placeholder="Enter phone number (e.g., +1234567890)" />
        <label for="api-parameter">API Parameter:</label>
        <input type="text" id="api-parameter" placeholder="Enter parameter for API calls" />
      </div>
      
      <div class="button-container">
        <button id="outdial-button" disabled>Outdial</button>
      </div>
    </div>
    
    <div class="logs" id="logs">
      <div class="log-entry">
        <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
        <span class="info">Widget initialized. Waiting for active call...</span>
      </div>
    </div>
  </div>
`;

// Creating a custom logger
const logger = Desktop.logger.createLogger('outdial-widget');

class OutdialWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    
    // State
    this.state = {
      interactionId: null,
      phoneNumber: '',
      apiParameter: '',
      hasActiveCall: false
    };
    
    // Bind methods to ensure 'this' context
    this.outdial = this.outdial.bind(this);
  }

  connectedCallback() {
    this.init();
    this.addEventListeners();
    this.subscribeToContactEvents();
  }

  disconnectedCallback() {
    this.removeEventListeners();
    Desktop.agentContact.removeAllEventListeners();
  }

  addEventListeners() {
    // Button event listeners
    this.shadowRoot.getElementById('outdial-button').addEventListener('click', () => this.outdial());
    
    // Input event listeners for updating state
    this.shadowRoot.getElementById('phone-number').addEventListener('input', (e) => {
      this.state.phoneNumber = e.target.value;
      this.updateButtonStates();
    });
    
    this.shadowRoot.getElementById('api-parameter').addEventListener('input', (e) => {
      this.state.apiParameter = e.target.value;
    });
  }

  removeEventListeners() {
    this.shadowRoot.getElementById('outdial-button').removeEventListener('click', () => this.outdial());
  }

  init() {
    // Initiate desktop config
    Desktop.config.init();
    this.logMessage('Widget initialized');
  }

  async   subscribeToContactEvents() {
    // Subscribe to agent contact events
    Desktop.agentContact.addEventListener('eAgentContact', (msg) => {
      this.logMessage('Agent contact event received', 'info');
      this.state.hasActiveCall = true;
      this.state.interactionId = msg.data.interactionId;
      this.updateUI();
    });

    Desktop.agentContact.addEventListener('eAgentContactEnded', (msg) => {
      this.logMessage('Call ended', 'info');
      this.state.hasActiveCall = false;
      this.state.interactionId = null;
      this.updateUI();
    });


    // Check for current active tasks on initialization
    this.checkForActiveTasks();
    
    // Debug logging for all agent contact events
    const allEvents = [
      'eAgentContact', 'eAgentContactEnded', 'eAgentWrapup', 'eAgentContactEstablished',
      'eAgentContactHeld', 'eAgentContactUnHeld'
    ];
    
    allEvents.forEach(eventName => {
      Desktop.agentContact.addEventListener(eventName, (msg) => {
        logger.info(`Event received: ${eventName}`, msg);
      });
    });
  }

  async checkForActiveTasks() {
    try {
      const taskMap = await Desktop.actions.getTaskMap();
      if (taskMap && taskMap.size > 0) {
        for (const [key, task] of taskMap.entries()) {
          if (task.interactionId) {
            this.state.hasActiveCall = true;
            this.state.interactionId = task.interactionId;
            this.logMessage(`Active call detected: ${task.interactionId}`, 'info');
            break;
          }
        }
      }
      this.updateUI();
    } catch (error) {
      this.logMessage(`Error checking active tasks: ${error.message}`, 'error');
    }
  }

  updateUI() {
    this.updateButtonStates();
  }

  updateButtonStates() {
    const outdialButton = this.shadowRoot.getElementById('outdial-button');
    
    // Disable outdial button if phone number is empty
    if (!this.state.phoneNumber) {
      outdialButton.disabled = true;
    } else {
      outdialButton.disabled = false;
    }
  }


  async outdial() {
    logger.debug('Outdial function called');
    
    if (!this.state.phoneNumber) {
      logger.error('Outdial failed: No phone number provided');
      this.logMessage('No phone number entered', 'error');
      return;
    }

    logger.debug(`Outdial parameters: phoneNumber=${this.state.phoneNumber}, state=${JSON.stringify(this.state)}`);

    try {
      // Pre-outdial API validation
      this.logMessage('Validating outdial request...', 'info');
      const preOutdialValidation = await this.callPreOutdialAPI();
      
      if (!preOutdialValidation.success) {
        this.logMessage(`Outdial validation failed: ${preOutdialValidation.message}`, 'error');
        logger.error(`Pre-outdial validation failed: ${preOutdialValidation.message}`);
        return;
      }
      
      this.logMessage('Outdial validation successful', 'success');
      this.logMessage(`Attempting to outdial ${this.state.phoneNumber}...`, 'info');
      logger.info(`Starting outdial process for destination: ${this.state.phoneNumber}`);
      
      logger.debug('Calling Desktop.dialer.startOutdial with parameters:', {
        destination: this.state.phoneNumber
      });
      
      const response = await Desktop.dialer.startOutdial({
		data:{  
        destination: this.state.phoneNumber,
		entryPointId: '4610c21f-3968-4835-b3b8-a9422c1771a9',
        direction: 'OUTBOUND',
        origin: '+14697502984',
        attributes: {},
        mediaType: 'telephony',
        outboundType: 'OUTDIAL',
		}
		
      });
      
      logger.debug('Desktop.dialer.startOutdial response:', response);
      this.logMessage(`Outdial initiated successfully to ${this.state.phoneNumber}`, 'success');
      logger.info(`Outdial completed successfully. Response: ${JSON.stringify(response)}`);
      
      // Post-outdial API call
      this.logMessage('Sending post-outdial notification...', 'info');
      await this.callPostOutdialAPI(response);
      this.logMessage('Post-outdial notification sent', 'success');
      
      return response;
    } catch (error) {
      logger.error('Outdial failed with error:', error);
      logger.debug('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        phoneNumber: this.state.phoneNumber
      });
      this.logMessage(`Error initiating outdial: ${error.message}`, 'error');
    }
  }

  async callPreOutdialAPI() {
    try {
      // TODO: Replace with actual API endpoint
      const apiUrl = 'https://api.example.com/validate-outdial';
      
      const requestData = {
        phoneNumber: this.state.phoneNumber,
        apiParameter: this.state.apiParameter,
        agentId: 'agent-placeholder', // TODO: Get actual agent ID
        timestamp: new Date().toISOString()
      };
      
      logger.debug('Calling pre-outdial validation API:', { url: apiUrl, data: requestData });
      
      // Placeholder API call - replace with actual implementation
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_TOKEN' // TODO: Replace with actual token
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      logger.debug('Pre-outdial validation API response:', result);
      
      return {
        success: result.allowed || true, // Default to true for placeholder
        message: result.message || 'Validation successful'
      };
      
    } catch (error) {
      logger.error('Pre-outdial API call failed:', error);
      // For placeholder implementation, return success to allow outdial
      // In production, you might want to fail closed for security
      return {
        success: true, // TODO: Change to false for fail-closed behavior
        message: `API validation failed: ${error.message}`
      };
    }
  }

  async callPostOutdialAPI(outdialResponse) {
    try {
      // TODO: Replace with actual API endpoint
      const apiUrl = 'https://api.example.com/outdial-notification';
      
      const requestData = {
        phoneNumber: this.state.phoneNumber,
        apiParameter: this.state.apiParameter,
        agentId: 'agent-placeholder', // TODO: Get actual agent ID
        outdialResult: outdialResponse,
        timestamp: new Date().toISOString(),
        status: 'initiated'
      };
      
      logger.debug('Calling post-outdial notification API:', { url: apiUrl, data: requestData });
      
      // Placeholder API call - replace with actual implementation
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_TOKEN' // TODO: Replace with actual token
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      logger.debug('Post-outdial notification API response:', result);
      
      return result;
      
    } catch (error) {
      logger.error('Post-outdial API call failed:', error);
      // Don't fail the outdial process if notification fails
      // Just log the error
      throw error;
    }
  }

  logMessage(message, type = 'info') {
    // Create log entry
    const logContainer = this.shadowRoot.getElementById('logs');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = `[${new Date().toLocaleTimeString()}]`;
    
    const messageSpan = document.createElement('span');
    messageSpan.className = type;
    messageSpan.textContent = message;
    
    logEntry.appendChild(timestamp);
    logEntry.appendChild(messageSpan);
    
    // Add to log container
    logContainer.appendChild(logEntry);
    
    // Auto scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Log to console as well
    switch (type) {
      case 'error':
        logger.error(message);
        break;
      case 'success':
        logger.info(`SUCCESS: ${message}`);
        break;
      default:
        logger.info(message);
    }
  }

  // Handle dark mode
  attributeChangedCallback(attrName, oldVal, newVal) {
    if (attrName === 'darkmode') {
      const container = this.shadowRoot.querySelector('.container');
      if (newVal === 'true') {
        container.classList.add('dark-mode');
      } else {
        container.classList.remove('dark-mode');
      }
    }
  }

  static get observedAttributes() {
    return ['darkmode'];
  }
}

customElements.define('outdial-widget', OutdialWidget);
