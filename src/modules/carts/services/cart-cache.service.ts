import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CartCacheService {
  constructor(private readonly redisService: RedisService) {}

  // Tạo idempotency key dựa trên request hash
  generateIdempotencyKey(
    userId: number,
    operation: string,
    requestHash: string,
  ): string {
    return `cart:${userId}:${operation}:${requestHash}`;
  }

  // Tạo hash từ request data
  generateRequestHash(data: any, timestamp?: number): string {
    const requestData = {
      ...data,
      timestamp: timestamp || Date.now(),
    };
    const dataString = JSON.stringify(requestData);
    return Buffer.from(dataString).toString('base64').slice(0, 16); // Lấy 16 ký tự đầu
  }

  // Kiểm tra và lưu idempotency key
  async checkAndSetIdempotency(
    key: string,
    ttl: number = 300, // 5 phút
  ): Promise<boolean> {
    const exists = await this.redisService.exists(key);
    if (exists) {
      return false; // Request đã tồn tại
    }

    await this.redisService.setex(key, ttl, '1');
    return true; // Request mới
  }

  // Lưu kết quả cart operation
  async cacheCartResult(
    userId: number,
    operation: string,
    result: any,
    ttl: number = 60, // 1 phút
  ): Promise<void> {
    const key = `cart:result:${userId}:${operation}`;
    await this.redisService.setex(key, ttl, JSON.stringify(result));
  }

  // Lấy kết quả từ cache
  async getCachedCartResult(
    userId: number,
    operation: string,
  ): Promise<any | null> {
    const key = `cart:result:${userId}:${operation}`;
    const result = await this.redisService.get(key);
    return result ? JSON.parse(result) : null;
  }

  // Xóa cache khi cart thay đổi
  async invalidateCartCache(userId: number): Promise<void> {
    const pattern = `cart:result:${userId}:*`;
    const keys = await this.redisService.keys(pattern);
    if (keys.length > 0) {
      await this.redisService.delMultiple(...keys);
    }
  }
}
