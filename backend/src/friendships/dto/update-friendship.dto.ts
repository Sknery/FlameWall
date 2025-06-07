import { PartialType } from '@nestjs/mapped-types';
import { CreateFriendshipDto } from './create-friend-request.dto';

export class UpdateFriendshipDto extends PartialType(CreateFriendshipDto) {}
