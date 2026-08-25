import React from 'react';

interface TelegramGateProps {
  children: React.ReactNode;
}

export const TelegramGate: React.FC<TelegramGateProps> = ({ children }) => {
  // Barcha brauzerlarda va Telegram ichida to'siqsiz, silliq ochiladi
  return <>{children}</>;
};
