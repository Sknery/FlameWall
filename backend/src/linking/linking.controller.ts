// backend/src/linking/linking.controller.ts

import { Controller, Post, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LinkingService } from './linking.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Account Linking')
@Controller('linking')
export class LinkingController {
  constructor(private readonly linkingService: LinkingService) {}

  @Post('generate-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a one-time code to link a Minecraft account' })
  @ApiResponse({ status: 200, description: 'Returns the generated code.', schema: { type: 'object', properties: { code: { type: 'string' } } }})
  async generateCode(@Request() req): Promise<{ code: string }> {
    const userId = req.user.userId;
    const code = await this.linkingService.generateCodeForUser(userId);
    return { code };
  }
}