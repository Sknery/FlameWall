import { SetMetadata } from '@nestjs/common';
import { Ranks } from '../../common/enums/ranks.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Ranks[]) => SetMetadata(ROLES_KEY, roles);