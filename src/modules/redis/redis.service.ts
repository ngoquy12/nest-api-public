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
}
