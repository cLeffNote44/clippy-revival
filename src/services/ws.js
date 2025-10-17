import config from '../config';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = config.ws.url;
    this.reconnectInterval = config.ws.reconnectInterval;
    this.maxReconnectAttempts = config.ws.maxReconnectAttempts;
    this.heartbeatInterval = config.ws.heartbeatInterval;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.messageQueue = [];
    this.isConnected = false;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }

  // Connect to WebSocket server
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('[WS] Connecting to', this.url);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WS] Connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('[WS] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          this.emit('error', error);
        };

        this.ws.onclose = (event) => {
          console.log('[WS] Disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          this.attemptReconnect();
        };

      } catch (error) {
        console.error('[WS] Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.stopHeartbeat();
  }

  // Send message to server
  send(type, payload = {}) {
    const message = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateId()
    };

    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        if (config.app.isDev) {
          console.log('[WS] Sent:', type, payload);
        }
      } catch (error) {
        console.error('[WS] Failed to send message:', error);
        this.messageQueue.push(message);
      }
    } else {
      console.log('[WS] Queueing message (not connected):', type);
      this.messageQueue.push(message);
    }

    return message.id;
  }

  // Subscribe to events
  subscribe(events) {
    return this.send('subscribe', { events });
  }

  // Handle incoming messages
  handleMessage(data) {
    if (config.app.isDev) {
      console.log('[WS] Received:', data);
    }

    // Handle pong response
    if (data.type === 'pong') {
      return;
    }

    // Emit to listeners
    this.emit(data.type, data.payload || data);
    
    // Emit generic message event
    this.emit('message', data);
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  // Remove event listener
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[WS] Error in listener for ${event}:`, error);
      }
    });
  }

  // Start heartbeat
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send('ping');
      }
    }, this.heartbeatInterval);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnection attempts reached');
      this.emit('reconnect-failed');
      return;
    }

    if (this.reconnectTimer) {
      return; // Already trying to reconnect
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * this.reconnectAttempts, 30000);
    
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(error => {
        console.error('[WS] Reconnection failed:', error);
      });
    }, delay);
  }

  // Flush message queue
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      try {
        this.ws.send(JSON.stringify(message));
        console.log('[WS] Sent queued message:', message.type);
      } catch (error) {
        console.error('[WS] Failed to send queued message:', error);
        this.messageQueue.unshift(message); // Put it back
        break;
      }
    }
  }

  // Generate unique ID
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      readyState: this.ws ? this.ws.readyState : null
    };
  }
}

// Export singleton instance
const wsService = new WebSocketService();
export default wsService;