export interface INotificationService {
  createNotification(data: any): Promise<any>;
}

export interface IChatGateway {
  isUserOnline(userId: number): boolean;
  sendNotificationToUser(userId: number, notification: any): Promise<void>;
}
