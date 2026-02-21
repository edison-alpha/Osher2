import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FloatingNotification } from './FloatingNotification';

interface NotificationData {
  id: string;
  type: 'new_order' | 'new_payment';
  title: string;
  message: string;
  orderNumber: string;
  buyerName?: string;
  buyerImage?: string;
  productImage?: string;
  onClick: () => void;
}

interface FloatingNotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
}

const FloatingNotificationContext = createContext<FloatingNotificationContextType | undefined>(undefined);

export function useFloatingNotification() {
  const context = useContext(FloatingNotificationContext);
  if (!context) {
    throw new Error('useFloatingNotification must be used within FloatingNotificationProvider');
  }
  return context;
}

interface FloatingNotificationProviderProps {
  children: ReactNode;
}

export function FloatingNotificationProvider({ children }: FloatingNotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification].slice(-3)); // Max 3 notifications
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <FloatingNotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Floating Notifications Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-3">
          {notifications.map((notification) => (
            <FloatingNotification
              key={notification.id}
              {...notification}
              onClose={removeNotification}
            />
          ))}
        </div>
      </div>
    </FloatingNotificationContext.Provider>
  );
}
