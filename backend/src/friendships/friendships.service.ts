import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not } from 'typeorm';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/entities/user.entity';
import { FriendStatuses } from '../common/enums/friend-statuses.enum';
import { PublicUser, UsersService } from '../users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter'; // <-- Импортируем EventEmitter

// Определим новый тип для ответа, который включает ID дружбы
export type FriendWithFriendshipId = {
  friendshipId: number;
  user: PublicUser;
}

@Injectable()
export class FriendshipsService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipsRepository: Repository<Friendship>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private eventEmitter: EventEmitter2, // <-- Внедряем EventEmitter
  ) { }

  async sendRequest(requesterId: number, receiverId: number): Promise<Friendship> {
    if (requesterId === receiverId) {
      throw new ForbiddenException('You cannot send a friend request to yourself.');
    }
    
    // Нам нужна полная сущность отправителя для события
    const [requester, receiver] = await Promise.all([
        this.usersRepository.findOneBy({ id: requesterId }),
        this.usersRepository.findOneBy({ id: receiverId }),
    ]);

    if (!receiver || !requester) {
      throw new NotFoundException(`User not found.`);
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
    
    const savedRequest = await this.friendshipsRepository.save(newRequest);

    // "Кричим" о событии, что был отправлен новый запрос
    this.eventEmitter.emit(
      'friendship.requested',
      { requester: requester, receiver: receiver }
    );

    return savedRequest;
  }

  async getPendingRequests(userId: number): Promise<Friendship[]> {
    return this.friendshipsRepository.find({
      where: { receiver_id: userId, status: FriendStatuses.PENDING },
      relations: ['requester'],
    });
  }

  async acceptRequest(requestId: number, currentUserId: number): Promise<Friendship> {
    const request = await this.friendshipsRepository.findOne({ 
        where: { id: requestId, receiver_id: currentUserId, status: FriendStatuses.PENDING },
        relations: ['requester', 'receiver'],
    });
    if (!request) {
      throw new NotFoundException(`Pending request with ID ${requestId} not found for you.`);
    }
    
    request.status = FriendStatuses.ACCEPTED;
    
    // "Кричим" о событии, что дружба принята
    this.eventEmitter.emit(
      'friendship.accepted',
      { requester: request.requester, receiver: request.receiver }
    );

    return this.friendshipsRepository.save(request);
  }

  // ... остальной код (reject, remove, list, block и т.д.) остается без изменений ...
  async rejectOrCancelRequest(requestId: number, currentUserId: number): Promise<void> {
    const request = await this.friendshipsRepository.findOne({ where: { id: requestId, status: FriendStatuses.PENDING } });
    if (!request) { throw new NotFoundException(`Pending request with ID ${requestId} not found.`); }
    if (request.receiver_id !== currentUserId && request.requester_id !== currentUserId) { throw new ForbiddenException('You are not authorized to manage this request.'); }
    await this.friendshipsRepository.remove(request);
  }
  async removeFriend(friendshipId: number, currentUserId: number): Promise<void> {
    const friendship = await this.friendshipsRepository.findOneBy({ id: friendshipId, status: FriendStatuses.ACCEPTED });
    if (!friendship) { throw new NotFoundException(`Friendship with ID ${friendshipId} not found.`); }
    if (friendship.receiver_id !== currentUserId && friendship.requester_id !== currentUserId) { throw new ForbiddenException('You are not part of this friendship.'); }
    await this.friendshipsRepository.remove(friendship);
  }
  async listFriends(userId: number): Promise<FriendWithFriendshipId[]> {
    const friendships = await this.friendshipsRepository.find({ where: [{ requester_id: userId, status: FriendStatuses.ACCEPTED }, { receiver_id: userId, status: FriendStatuses.ACCEPTED }], relations: ['requester', 'receiver'] });
    return friendships.map(friendship => {
      const friendUserEntity = friendship.requester_id === userId ? friendship.receiver : friendship.requester;
      const { password_hash, validatePassword, deleted_at, ...publicFriendData } = friendUserEntity;
      return { friendshipId: friendship.id, user: publicFriendData as PublicUser };
    });
  }
  async getFriendshipStatus(userId1: number, userId2: number) {
    if (userId1 === userId2) return { status: 'self' };
    const friendship = await this.friendshipsRepository.findOne({ where: [{ requester_id: userId1, receiver_id: userId2 }, { requester_id: userId2, receiver_id: userId1 }] });
    if (!friendship) return { status: 'none' };
    if (friendship.status === FriendStatuses.PENDING) {
      if (friendship.requester_id === userId1) { return { status: 'pending_outgoing', requestId: friendship.id }; } 
      else { return { status: 'pending_incoming', requestId: friendship.id }; }
    }
    return { status: friendship.status, friendshipId: friendship.id };
  }
  async blockUser(requesterId: number, userToBlockId: number): Promise<Friendship> {
    if (requesterId === userToBlockId) { throw new ForbiddenException('You cannot block yourself.'); }
    let friendship = await this.friendshipsRepository.findOne({ where: [{ requester_id: requesterId, receiver_id: userToBlockId }, { requester_id: userToBlockId, receiver_id: requesterId }] });
    if (friendship) {
      friendship.requester_id = requesterId;
      friendship.receiver_id = userToBlockId;
      friendship.status = FriendStatuses.BLOCKED;
    } else {
      friendship = this.friendshipsRepository.create({ requester_id: requesterId, receiver_id: userToBlockId, status: FriendStatuses.BLOCKED });
    }
    return this.friendshipsRepository.save(friendship);
  }
  async unblockUser(requesterId: number, userToUnblockId: number): Promise<void> {
    const friendship = await this.friendshipsRepository.findOne({ where: { requester_id: requesterId, receiver_id: userToUnblockId, status: FriendStatuses.BLOCKED } });
    if (!friendship) { throw new NotFoundException('You have not blocked this user.'); }
    await this.friendshipsRepository.remove(friendship);
  }
  async getOutgoingRequests(userId: number): Promise<Friendship[]> {
    return this.friendshipsRepository.find({ where: { requester_id: userId, status: FriendStatuses.PENDING }, relations: ['receiver'] });
  }
  async listBlockedUsers(userId: number): Promise<Friendship[]> {
    return this.friendshipsRepository.find({ where: { requester_id: userId, status: FriendStatuses.BLOCKED }, relations: ['receiver'] });
  }
}