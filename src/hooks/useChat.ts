import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types/api/chat';
import { LLMModel } from '../types/api/models';
import { Device, deviceService } from '../services/deviceService';
import { llmService } from '../services/llmService';

export const useChat = (userId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<LLMModel[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isInActiveChatRef = useRef(false);

  const loadPersistedSelectedModel = async () => {
    try {
      let persistedModel = '';
      
      if (window.electronAPI) {
        persistedModel = await window.electronAPI.getStoreValue('selectedModel') || '';
      } else {
        persistedModel = localStorage.getItem('selectedModel') || '';
      }
      
      if (persistedModel) {
        setSelectedModel(persistedModel);
      }
    } catch (error) {
      console.warn('Failed to load persisted selected model:', error);
    }
  };

  const saveSelectedModel = async (modelId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.setStoreValue('selectedModel', modelId);
      } else {
        localStorage.setItem('selectedModel', modelId);
      }
    } catch (error) {
      console.warn('Failed to save selected model:', error);
    }
  };

  const loadModels = async () => {
    try {
      // Remember the current selection before loading
      const previousSelection = selectedModel;
      
      const availableModels = await llmService.getAllModels();
      setModels(availableModels);
      
      // Only change selected model if we don't have one or if it truly doesn't exist
      // Don't reset just because models are temporarily unavailable
      if (!selectedModel && availableModels.length > 0) {
        // No model selected, pick the first one
        const newSelectedModel = availableModels[0].id;
        console.log('[useChat] No model selected, picking first:', newSelectedModel);
        setSelectedModel(newSelectedModel);
        await saveSelectedModel(newSelectedModel);
      } else if (selectedModel && availableModels.length > 0) {
        // We have a selected model, check if it exists
        const selectedModelExists = availableModels.some(model => model.id === selectedModel);
        if (!selectedModelExists) {
          console.log('[useChat] Selected model not found:', selectedModel);
          console.log('[useChat] Available models:', availableModels.map(m => m.id));
          
          // If we're in an active chat (have messages) or loading, don't change the model
          if (isInActiveChatRef.current || loading) {
            console.log('[useChat] Keeping current model selection during active chat:', selectedModel);
            return; // Exit early, don't change anything
          }
          
          // Not in active chat, try to find a similar model
          const baseModelName = selectedModel.split('_').slice(-1)[0];
          
          // First try to find exact base model match
          let similarModel = availableModels.find(model => {
            if (selectedModel.includes('_')) {
              // Selected is P2P model
              if (model.id.includes('_')) {
                // Compare P2P models by their base model name
                const modelBase = model.id.split('_').slice(-1)[0];
                return modelBase === baseModelName;
              } else {
                // Compare P2P selected with local model
                return model.id === baseModelName;
              }
            } else {
              // Selected is local model, must be exact match
              return model.id === selectedModel;
            }
          });
          
          if (similarModel) {
            console.log('[useChat] Found similar model:', similarModel.id);
            setSelectedModel(similarModel.id);
            await saveSelectedModel(similarModel.id);
          } else {
            // No similar model found, pick the first one
            const newSelectedModel = availableModels[0].id;
            console.log('[useChat] No similar model found, switching to:', newSelectedModel);
            setSelectedModel(newSelectedModel);
            await saveSelectedModel(newSelectedModel);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadDevices = async () => {
    if (!userId) return;
    
    try {
      const userDevices = await deviceService.getDevicesForUser(userId);
      setDevices(userDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDevices();
      await loadModels();
    } finally {
      setRefreshing(false);
    }
  };

  const handleModelSelect = async (modelId: string | LLMModel) => {
    const id = typeof modelId === 'string' ? modelId : modelId.id;
    setSelectedModel(id);
    await saveSelectedModel(id);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedModel || loading) return;

    // Save the current selected model before sending
    const currentSelectedModel = selectedModel;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      modelId: selectedModel
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await llmService.chat(selectedModel, [...messages, userMessage]);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        modelId: selectedModel
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
        modelId: selectedModel
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setIsTyping(false);
      
      // Ensure the selected model hasn't changed during the request
      if (selectedModel !== currentSelectedModel) {
        console.log('[useChat] Model changed during request, restoring:', currentSelectedModel);
        setSelectedModel(currentSelectedModel);
        await saveSelectedModel(currentSelectedModel);
      }
    }
  };

  const handleDebugOllama = async () => {
    try {
      const isDev = window.location.port === '3000' || window.location.hostname === 'localhost';
      const ollamaUrl = isDev ? '/api/ollama/api/tags' : 'http://127.0.0.1:11434/api/tags';
      
      const response = await fetch(ollamaUrl);
      const data = await response.json();
      
      const models = await llmService.getAllModels();
      
      alert(`Ollama models: ${data.models?.length || 0}\nTotal models: ${models.length}`);
    } catch (error) {
      console.error('Ollama debug failed:', error);
      alert('Ollama connection failed. Make sure Ollama is running.');
    }
  };

  // Update active chat ref when messages change
  useEffect(() => {
    isInActiveChatRef.current = messages.length > 0;
  }, [messages]);

  useEffect(() => {
    if (userId) {
      llmService.setCurrentUserId(userId);
      deviceService.setCurrentUserId(userId);
      
      loadPersistedSelectedModel();
      loadModels();
      loadDevices();
      
      const unsubscribeDevices = deviceService.onDevicesChange(userId, (updatedDevices) => {
        setDevices(updatedDevices);
        // Only reload models if not in active chat
        if (!isInActiveChatRef.current) {
          loadModels();
        }
      });

      const unsubscribeHosting = deviceService.onHostingChange(() => {
        setRefreshing(true);
        
        setTimeout(async () => {
          // Only reload models if not in active chat
          if (!isInActiveChatRef.current) {
            await loadModels();
          }
          setRefreshing(false);
        }, 500);
      });

      return () => {
        unsubscribeDevices();
        unsubscribeHosting();
      };
    }
  }, [userId]);

  return {
    messages,
    inputMessage,
    selectedModel,
    models,
    devices,
    loading,
    isTyping,
    refreshing,
    setInputMessage,
    handleSendMessage,
    handleModelSelect,
    handleRefresh,
    handleDebugOllama
  };
};