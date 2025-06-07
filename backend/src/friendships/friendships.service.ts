import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not } from 'typeorm';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/entities/user.entity';
import { FriendStatuses } from '../common/enums/friend-statuses.enum';
import { PublicUser } from '../users/users.service';

@Injectable()
export class FriendshipsService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipsRepository: Repository<Friendship>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async sendRequest(requesterId: number, receiverId: number): Promise<Friendship> {
    if (requesterId === receiverId) {
      throw new ForbiddenException('You cannot send a friend request to yourself.');
    }

    const receiver = await this.usersRepository.findOneBy({ id: receiverId });
    if (!receiver) {
      throw new NotFoundException(`User with ID ${receiverId} not found.`);
    }

    const existingFriendship = await this.friendshipsRepository.findOne({
      where: [
        { requester_id: requesterId, receiver_id: receiverId },
        { requester_id: receiverId, receiver_id: requesterId },
      ],
    });

    if (existingFriendship) {
      throw new ConflictException('A friendship request already exists or you are already friends.');
    }

    const newRequest = this.friendshipsRepository.create({
      requester_id: requesterId,
      receiver_id: receiverId,
      status: FriendStatuses.PENDING,
    });

    return this.friendshipsRepository.save(newRequest);
  }

  async getPendingRequests(userId: number): Promise<Friendship[]> {
    return this.friendshipsRepository.find({
      where: {
        receiver_id: userId,
        status: FriendStatuses.PENDING,
      },
      relations: ['requester'], // Показываем, от кого пришел запрос
    });
  }

  async acceptRequest(requestId: number, currentUserId: number): Promise<Friendship> {
    const request = await this.friendshipsRepository.findOneBy({ id: requestId });
    if (!request) {
      throw new NotFoundException(`Friendship request with ID ${requestId} not found.`);
    }
    if (request.receiver_id !== currentUserId) {
      throw new ForbiddenException('You are not authorized to accept this request.');
    }
    if (request.status !== FriendStatuses.PENDING) {
      throw new ConflictException('This request is no longer pending.');
    }

    request.status = FriendStatuses.ACCEPTED;
    return this.friendshipsRepository.save(request);
  }

  async rejectOrCancelRequest(requestId: number, currentUserId: number): Promise<void> {
    const request = await this.friendshipsRepository.findOneBy({ id: requestId });
    if (!request) {
      throw new NotFoundException(`Friendship request with ID ${requestId} not found.`);
    }
    if (request.receiver_id !== currentUserId && request.requester_id !== currentUserId) {
      throw new ForbiddenException('You are not authorized to manage this request.');
    }
    if (request.status !== FriendStatuses.PENDING) {
      throw new ConflictException('This request can no longer be rejected or cancelled.');
    }

    await this.friendshipsRepository.remove(request);
  }
  
  async removeFriend(friendshipId: number, currentUserId: number): Promise<void> {
    const friendship = await this.friendshipsRepository.findOneBy({ id: friendshipId });
    if (!friendship) {
      throw new NotFoundException(`Friendship with ID ${friendshipId} not found.`);
    }
    if (friendship.receiver_id !== currentUserId && friendship.requester_id !== currentUserId) {
      throw new ForbiddenException('You are not part of this friendship.');
    }
    if (friendship.status !== FriendStatuses.ACCEPTED) {
      throw new ConflictException('You are not friends with this user.');
    }

    await this.friendshipsRepository.remove(friendship);
  }

  async listFriends(userId: number): Promise<PublicUser[]> {
    const friendships = await this.friendshipsRepository.find({
      where: [
        { requester_id: userId, status: FriendStatuses.ACCEPTED },
        { receiver_id: userId, status: FriendStatuses.ACCEPTED },
      ],
      relations: ['requester', 'receiver'],
    });

    const friendIds = friendships.map(friendship => 
      friendship.requester_id === userId ? friendship.receiver_id : friendship.requester_id
    );
    
    if (friendIds.length === 0) {
      return [];
    }

    return this.usersRepository.find({
      where: {
        id: In(friendIds),
      },
    });
  }
}