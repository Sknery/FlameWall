import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class PluginApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-api-key'];
    const validKey = this.configService.get<string>('PLUGIN_SECRET_KEY');

    if (!providedKey || providedKey !== validKey) {
      throw new UnauthorizedException('Invalid or missing API key for plugin');
    }
    return true;
  }
}