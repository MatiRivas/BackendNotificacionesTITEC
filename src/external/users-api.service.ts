import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

export interface BasicUserDto {
  id: string;
  email: string;
  telefono?: string;
  push_token?: string;
  nombre: string;
  apellido: string;
}

@Injectable()
export class UsersApiService {
  private readonly logger = new Logger(UsersApiService.name);
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('USERS_SERVICE_URL', 'http://localhost:3001');
    this.timeout = this.configService.get<number>('USERS_SERVICE_TIMEOUT', 5000);
  }

  async getUser(userId: string): Promise<BasicUserDto> {
    try {
      this.logger.log(`Fetching user data for ID: ${userId}`);
      
      const response: AxiosResponse<BasicUserDto> = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/users/${userId}`, {
          timeout: this.timeout,
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching user ${userId}:`, error.message);
      throw new Error(`User service unavailable for user ${userId}`);
    }
  }

  async getUsersBatch(userIds: string[]): Promise<BasicUserDto[]> {
    try {
      this.logger.log(`Fetching batch user data for IDs: ${userIds.join(', ')}`);
      
      const response: AxiosResponse<BasicUserDto[]> = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/users/batch`, {
          ids: userIds,
        }, {
          timeout: this.timeout,
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching batch users:`, error.message);
      throw new Error('User service unavailable for batch request');
    }
  }

  async validateUserExists(userId: string): Promise<boolean> {
    try {
      await this.getUser(userId);
      return true;
    } catch (error) {
      return false;
    }
  }
}