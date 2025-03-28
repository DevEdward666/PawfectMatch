import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Message, MessageForm, MessageResponse } from '../models/message.model';
import api from '../services/api';
import { useIonToast } from '@ionic/react';

interface MessageContextProps {
  inboxMessages: Message[];
  sentMessages: Message[];
  currentMessage: Message | null;
  isLoading: boolean;
  error: string | null;
  fetchMessages: () => Promise<void>;
  fetchMessageById: (id: number) => Promise<void>;
  sendMessage: (messageData: MessageForm) => Promise<void>;
  deleteMessage: (id: number) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}

const MessageContext = createContext<MessageContextProps | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [present] = useIonToast();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    present({
      message,
      duration: 3000,
      position: 'bottom',
      color: type === 'success' ? 'success' : 'danger'
    });
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get<MessageResponse>('/messages');
      const messageData: MessageResponse = response.data;
      
      setInboxMessages(messageData.inbox);
      setSentMessages(messageData.sent);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch messages.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessageById = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get<Message>(`/messages/${id}`);
      setCurrentMessage(response.data);
      
      // If this is an unread message in our inbox, mark it as read automatically
      if (response.data.isRead === false && inboxMessages.some(msg => msg.id === id)) {
        markAsRead(id);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch message details.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageData: MessageForm) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post<Message>('/messages', messageData);
      
      // Add to sent messages list
      setSentMessages([response.data, ...sentMessages]);
      
      showToast('Message sent successfully');
      return Promise.resolve();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send message.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return Promise.reject(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.delete(`/messages/${id}`);
      
      // Remove from lists
      setInboxMessages(inboxMessages.filter(msg => msg.id !== id));
      setSentMessages(sentMessages.filter(msg => msg.id !== id));
      
      // Reset current message if it was deleted
      if (currentMessage && currentMessage.id === id) {
        setCurrentMessage(null);
      }
      
      showToast('Message deleted successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete message.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.put(`/messages/${id}/read`);
      
      // Update message in inbox
      setInboxMessages(inboxMessages.map(msg => 
        msg.id === id ? { ...msg, isRead: true } : msg
      ));
      
      // Update current message if it's this one
      if (currentMessage && currentMessage.id === id) {
        setCurrentMessage({ ...currentMessage, isRead: true });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to mark message as read.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MessageContext.Provider
      value={{
        inboxMessages,
        sentMessages,
        currentMessage,
        isLoading,
        error,
        fetchMessages,
        fetchMessageById,
        sendMessage,
        deleteMessage,
        markAsRead
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = (): MessageContextProps => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};