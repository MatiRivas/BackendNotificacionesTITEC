export interface NotificationChannel {
  send(to: string, subject: string, content: string, context?: any): Promise<boolean>;
  testConnection?(): Promise<boolean>;
  sendNotification?(notification: any): Promise<boolean>; // Nuevo método para notificaciones complejas
}

export interface SMSOptions {
  to: string;
  message: string;
}

export interface PushNotificationOptions {
  userId: string;
  title: string;
  body: string;
  data?: any;
}
