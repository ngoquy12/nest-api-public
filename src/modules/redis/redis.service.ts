import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redisClient: Redis.Redis;

  constructor() {
    this.redisClient = new Redis.default({
      host: process.env.DB_HOST, // Địa chỉ của Redis server
      port: 6379, // Cổng của Redis server
    });
  }

  async set(key: string, value: string, expiration: number): Promise<void> {
    await this.redisClient.setex(key, expiration, value);
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result === 1;
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    await this.redisClient.setex(key, ttl, value);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }

  async delMultiple(...keys: string[]): Promise<number> {
    return this.redisClient.del(...keys);
  }
}
