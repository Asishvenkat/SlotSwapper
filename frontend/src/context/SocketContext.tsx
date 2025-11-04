import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    // Listen for swap request received
    newSocket.on('swap-request-received', (data) => {
      toast.success('You have a new swap request!', {
        duration: 5000,
      });
      // Trigger a custom event that can be listened to by components
      window.dispatchEvent(new CustomEvent('swap-request-received', { detail: data }));
    });

    // Listen for swap request accepted
    newSocket.on('swap-request-accepted', (data) => {
      toast.success('Your swap request was accepted!', {
        duration: 5000,
      });
      window.dispatchEvent(new CustomEvent('swap-request-accepted', { detail: data }));
    });

    // Listen for swap request rejected
    newSocket.on('swap-request-rejected', (data) => {
      toast('Your swap request was rejected', {
        duration: 5000,
        icon: '❌',
      });
      window.dispatchEvent(new CustomEvent('swap-request-rejected', { detail: data }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
