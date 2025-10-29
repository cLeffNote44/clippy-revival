import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Connection state (not persisted)
      backendUrl: null,
      isConnected: false,
      websocket: null,

      // Assistant state (persisted)
      assistantPaused: false,
      activeCharacter: 'clippy',
      characterState: 'idle',

      // System metrics (not persisted)
      systemMetrics: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: { upload: 0, download: 0 }
      },

      // AI chat (last 50 messages persisted)
      chatHistory: [],
      isTyping: false,

      // User preferences (persisted)
      preferences: {
        theme: 'light',
        startOnBoot: false,
        showNotifications: true,
        aiModel: 'llama3.2'
      },

      // Window positions (persisted)
      windowPositions: {
        buddy: { x: 100, y: 100 }
      },

      // Initialize backend connection
      initializeBackend: async () => {
        try {
          if (window.electronAPI) {
            const backendUrl = await window.electronAPI.getBackendUrl();
            set({ backendUrl });

            // Connect WebSocket
            const ws = await window.electronAPI.connectWebSocket('/ws');

            ws.onopen = () => {
              set({ isConnected: true, websocket: ws });
              // eslint-disable-next-line no-console
              console.log('Connected to backend WebSocket');

              // Subscribe to system metrics
              ws.send(JSON.stringify({
                type: 'subscribe',
                events: ['system.metrics', 'ai.response', 'task.progress']
              }));
            };

            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);

              switch (data.type) {
              case 'system.metrics':
                set({ systemMetrics: data.payload });
                break;

              case 'ai.response': {
                const { chatHistory } = get();
                set({
                  chatHistory: [...chatHistory, data.payload],
                  isTyping: false,
                  characterState: 'speak'
                });
                // Return to idle after speaking
                setTimeout(() => {
                  if (get().characterState === 'speak') {
                    set({ characterState: 'idle' });
                  }
                }, 3000);
                break;
              }

              case 'ai.typing':
                set({ isTyping: true, characterState: 'think' });
                break;

              case 'ai.streaming':
                // While AI is streaming response
                set({ characterState: 'speak' });
                break;

              case 'task.started':
                set({ characterState: 'work' });
                break;

              case 'task.success':
                set({ characterState: 'success' });
                setTimeout(() => {
                  if (get().characterState === 'success') {
                    set({ characterState: 'idle' });
                  }
                }, 2000);
                break;

              case 'task.error':
                set({ characterState: 'error' });
                setTimeout(() => {
                  if (get().characterState === 'error') {
                    set({ characterState: 'idle' });
                  }
                }, 3000);
                break;

              default:
                // eslint-disable-next-line no-console
                console.log('Received WebSocket message:', data);
              }
            };

            ws.onerror = (error) => {
              // eslint-disable-next-line no-console
              console.error('WebSocket error:', error);
              set({ isConnected: false });
            };

            ws.onclose = () => {
              // eslint-disable-next-line no-console
              console.log('WebSocket connection closed');
              set({ isConnected: false, websocket: null });

              // Attempt to reconnect after 5 seconds
              setTimeout(() => {
                get().initializeBackend();
              }, 5000);
            };
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to initialize backend:', error);
          set({ isConnected: false });
        }
      },

      // Send message to AI
      sendMessage: async (message) => {
        const { backendUrl, chatHistory } = get();

        // Add user message to history
        set({
          chatHistory: [...chatHistory, { role: 'user', content: message }],
          isTyping: true,
          characterState: 'think'
        });

        try {
          const response = await fetch(`${backendUrl}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
          });

          if (!response.ok) {
            throw new Error('Failed to send message');
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error sending message:', error);
          set({ isTyping: false, characterState: 'idle' });
        }
      },

      // Clear chat history
      clearChatHistory: () => {
        set({ chatHistory: [] });
      },

      // Change character
      setActiveCharacter: (characterId) => {
        set({ activeCharacter: characterId, characterState: 'wave' });

        // Reset to idle after wave animation
        setTimeout(() => {
          set({ characterState: 'idle' });
        }, 2000);
      },

      // Set character animation state
      setCharacterState: (state) => {
        set({ characterState: state });
      },

      // Update user preferences
      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        }));
      },

      // Update window position
      updateWindowPosition: (window, position) => {
        set((state) => ({
          windowPositions: {
            ...state.windowPositions,
            [window]: position
          }
        }));
      }
    }),
    {
      name: 'clippy-storage',
      // Persist only specific parts of the state
      partialize: (state) => ({
        activeCharacter: state.activeCharacter,
        chatHistory: state.chatHistory.slice(-50), // Keep last 50 messages
        preferences: state.preferences,
        windowPositions: state.windowPositions
      })
    }
  )
);
