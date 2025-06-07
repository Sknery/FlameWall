import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not, Or } from 'typeorm';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/entities/user.entity';
import { FriendStatuses } from '../common/enums/friend-statuses.enum';
import { PublicUser } from '../users/users.service';

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
  ) { }

  // ... метод sendRequest остается без изменений ...
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


  // ... методы getPendingRequests, acceptRequest, rejectOrCancelRequest остаются без изменений ...
  async getPendingRequests(userId: number): Promise<Friendship[]> {
    return this.friendshipsRepository.find({
      where: { receiver_id: userId, status: FriendStatuses.PENDING },
      relations: ['requester'],
    });
  }
  async acceptRequest(requestId: number, currentUserId: number): Promise<Friendship> {
    const request = await this.friendshipsRepository.findOneBy({ id: requestId, receiver_id: currentUserId, status: FriendStatuses.PENDING });
    if (!request) {
      throw new NotFoundException(`Pending request with ID ${requestId} not found for you.`);
    }
    request.status = FriendStatuses.ACCEPTED;
    return this.friendshipsRepository.save(request);
  }
  async rejectOrCancelRequest(requestId: number, currentUserId: number): Promise<void> {
    const request = await this.friendshipsRepository.findOne({ where: { id: requestId, status: FriendStatuses.PENDING } });
    if (!request) {
      throw new NotFoundException(`Pending request with ID ${requestId} not found.`);
    }
    if (request.receiver_id !== currentUserId && request.requester_id !== currentUserId) {
      throw new ForbiddenException('You are not authorized to manage this request.');
    }
    await this.friendshipsRepository.remove(request);
  }


  async removeFriend(friendshipId: number, currentUserId: number): Promise<void> {
    const friendship = await this.friendshipsRepository.findOneBy({ id: friendshipId, status: FriendStatuses.ACCEPTED });
    if (!friendship) {
      throw new NotFoundException(`Friendship with ID ${friendshipId} not found.`);
    }
    if (friendship.receiver_id !== currentUserId && friendship.requester_id !== currentUserId) {
      throw new ForbiddenException('You are not part of this friendship.');
    }
    await this.friendshipsRepository.remove(friendship);
  }

  // ИЗМЕНЕННЫЙ МЕТОД
  async listFriends(userId: number): Promise<FriendWithFriendshipId[]> {
    const friendships = await this.friendshipsRepository.find({
      where: [
        { requester_id: userId, status: FriendStatuses.ACCEPTED },
        { receiver_id: userId, status: FriendStatuses.ACCEPTED },
      ],
      relations: ['requester', 'receiver'],
    });

    // Преобразуем данные в удобный для фронтенда формат
    const friendsList = friendships.map(friendship => {
      // Определяем, кто в этой паре является другом, а кто - текущим пользователем
      const friendUserEntity = friendship.requester_id === userId ? friendship.receiver : friendship.requester;
      // Исключаем лишние поля из друга, чтобы вернуть PublicUser
      const { password_hash, validatePassword, deleted_at, ...publicFriendData } = friendUserEntity;

      return {
        friendshipId: friendship.id,
        user: publicFriendData as PublicUser,
      };
    });

    return friendsList;
  }

  // НОВЫЙ МЕТОД
  async getFriendshipStatus(userId1: number, userId2: number) {
    if (userId1 === userId2) return { status: 'self' };

    const friendship = await this.friendshipsRepository.findOne({
      where: [
        { requester_id: userId1, receiver_id: userId2 },
        { requester_id: userId2, receiver_id: userId1 },
      ]
    });

    if (!friendship) return { status: 'none' };

    // Определяем, кто отправил запрос, чтобы вернуть правильный статус
    if (friendship.status === FriendStatuses.PENDING) {
      if (friendship.requester_id === userId1) {
        return { status: 'pending_outgoing' }; // Я отправил запрос
      } else {
        return { status: 'pending_incoming', requestId: friendship.id }; // Мне отправили запрос
      }
    }

    return { status: friendship.status, friendshipId: friendship.id }; // 'ACCEPTED' или 'BLOCKED'
  }

  // НОВЫЙ МЕТОД
  async blockUser(requesterId: number, userToBlockId: number): Promise<Friendship> {
    if (requesterId === userToBlockId) {
      throw new ForbiddenException('You cannot block yourself.');
    }

    let friendship = await this.friendshipsRepository.findOne({
      where: [
        { requester_id: requesterId, receiver_id: userToBlockId },
        { requester_id: userToBlockId, receiver_id: requesterId },
      ],
    });

    if (friendship) {
      // Если отношения уже есть, обновляем их
      friendship.requester_id = requesterId; // Тот, кто блокирует - всегда "запрашивающий"
      friendship.receiver_id = userToBlockId;
      friendship.status = FriendStatuses.BLOCKED;
    } else {
      // Если отношений не было, создаем новую запись о блокировке
      friendship = this.friendshipsRepository.create({
        requester_id: requesterId,
        receiver_id: userToBlockId,
        status: FriendStatuses.BLOCKED,
      });
    }
    return this.friendshipsRepository.save(friendship);
  }

  // НОВЫЙ МЕТОД
  async unblockUser(requesterId: number, userToUnblockId: number): Promise<void> {
    const friendship = await this.friendshipsRepository.findOne({
      where: {
        requester_id: requesterId,
        receiver_id: userToUnblockId,
        status: FriendStatuses.BLOCKED,
      }
    });

    if (!friendship) {
      throw new NotFoundException('You have not blocked this user.');
    }

    await this.friendshipsRepository.remove(friendship);
  }

  async getOutgoingRequests(userId: number): Promise<Friendship[]> {
    return this.friendshipsRepository.find({
      where: {
        requester_id: userId,
        status: FriendStatuses.PENDING,
      },
      relations: ['receiver'], // Показываем, кому отправили запрос
    });
  }

  // НОВЫЙ МЕТОД
  async listBlockedUsers(userId: number): Promise<Friendship[]> {
    return this.friendshipsRepository.find({
      where: {
        requester_id: userId,
        status: FriendStatuses.BLOCKED,
      },
      relations: ['receiver'], // Показываем, кого заблокировали
    });
  }
}

