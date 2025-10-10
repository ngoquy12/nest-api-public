import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../users/entities/user-session.entity';

interface LoginActivityDto {
  sessionId: string;
  deviceId?: string;
  deviceInfo?: string;
  ipAddress?: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://client-gara.ixe-agent.io.vn',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/login-activity',
  transports: ['websocket', 'polling'],
})
export class AccountsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Xác thực token từ query parameters hoặc headers
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.id || payload.sub;

      if (userId) {
        this.connectedUsers.set(userId, client.id);

        // Join user vào room riêng để nhận thông báo cá nhân
        await client.join(`user_${userId}`);

        console.log(`User ${userId} connected to login-activity namespace`);
      } else {
        client.disconnect();
      }
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove user from connected users map
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(
          `User ${userId} disconnected from login-activity namespace`,
        );
        break;
      }
    }
  }

  // Event khi có đăng xuất
  @SubscribeMessage('logout-activity')
  async handleLogoutActivity(
    @MessageBody() data: LoginActivityDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Cập nhật trạng thái session trong database
      // Logic cập nhật trạng thái session ở đây

      // Gửi thông báo real-time
      const userId = data.sessionId;
      this.server.to(`user_${userId}`).emit('login-activity-update', {
        type: 'logout',
        data: data,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error handling logout activity:', error);
      client.emit('error', { message: 'Failed to process logout activity' });
    }
  }

  // Event khi session hết hạn
  @SubscribeMessage('session-expired')
  async handleSessionExpired(
    @MessageBody() data: LoginActivityDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = data.sessionId;
      this.server.to(`user_${userId}`).emit('login-activity-update', {
        type: 'session_expired',
        data: data,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error handling session expired:', error);
      client.emit('error', { message: 'Failed to process session expired' });
    }
  }

  // Method để gửi thông báo đăng xuất tất cả thiết bị
  async notifyLogoutAllDevices(userId: string, reason: string = 'manual') {
    this.server.to(`user_${userId}`).emit('logout-all-devices', {
      reason,
      timestamp: new Date(),
    });
  }

  // Method để gửi thông báo đăng xuất một thiết bị cụ thể
  async notifyLogoutDevice(
    userId: string,
    deviceId: string,
    reason: string = 'manual',
  ) {
    this.server.to(`user_${userId}`).emit('logout-device', {
      deviceId,
      reason,
      timestamp: new Date(),
    });
  }

  private extractCoordinates(location: string): [number, number] {
    if (!location || typeof location !== 'string') {
      return [0, 0];
    }

    // Pattern 1: Extract coordinates from "lat,lng" format
    const coordinatePattern = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
    const coordinateMatch = location.match(coordinatePattern);

    if (coordinateMatch) {
      const lat = parseFloat(coordinateMatch[1]);
      const lng = parseFloat(coordinateMatch[2]);

      // Validate coordinate ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }

    // Pattern 2: Extract from "lat: X, lng: Y" format
    const labeledPattern =
      /lat[itude]*:\s*(-?\d+\.?\d*).*?lng[itude]*:\s*(-?\d+\.?\d*)/i;
    const labeledMatch = location.match(labeledPattern);

    if (labeledMatch) {
      const lat = parseFloat(labeledMatch[1]);
      const lng = parseFloat(labeledMatch[2]);

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }

    // Pattern 3: Extract from JSON-like format
    const jsonPattern =
      /"lat[itude]*":\s*(-?\d+\.?\d*).*?"lng[itude]*":\s*(-?\d+\.?\d*)/i;
    const jsonMatch = location.match(jsonPattern);

    if (jsonMatch) {
      const lat = parseFloat(jsonMatch[1]);
      const lng = parseFloat(jsonMatch[2]);

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }

    // Pattern 4: Extract from Vietnamese address format with coordinates
    // Example: "21.0285000, 105.8542000, Uỷ ban nhân dân thành phố Hà Nội..."
    const vietnamesePattern = /(-?\d+\.\d+),\s*(-?\d+\.\d+),\s*(.+)/;
    const vietnameseMatch = location.match(vietnamesePattern);

    if (vietnameseMatch) {
      const lat = parseFloat(vietnameseMatch[1]);
      const lng = parseFloat(vietnameseMatch[2]);

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }

    // Pattern 5: Try to parse as JSON object
    try {
      const parsed = JSON.parse(location);
      if (parsed && typeof parsed === 'object') {
        const lat = parseFloat(parsed.lat || parsed.latitude);
        const lng = parseFloat(parsed.lng || parsed.longitude);

        if (
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        ) {
          return [lat, lng];
        }
      }
    } catch {
      // Not valid JSON, continue
    }

    // If no pattern matches, return default coordinates
    // In a real implementation, you might want to use a geocoding service here
    console.warn(`Could not extract coordinates from location: ${location}`);
    return [0, 0];
  }

  // Method để lấy danh sách users đang kết nối
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Method để kiểm tra user có đang kết nối không
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
