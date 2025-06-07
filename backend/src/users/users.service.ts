import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Ranks } from '../common/enums/ranks.enum';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

export type PublicUser = Omit<User, 'password_hash' | 'validatePassword' | 'deleted_at'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const { email, username, password } = createUserDto;
    const existingUserByEmail = await this.usersRepository.findOne({ where: { email } });
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userToCreate = this.usersRepository.create({
      username: username,
      email: email,
      password_hash: hashedPassword,
      rank: Ranks.DEFAULT,
    });
    
    const savedUser = await this.usersRepository.save(userToCreate);
    
    const { password_hash, validatePassword, deleted_at, ...result } = savedUser;
    return result as PublicUser;
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    if (updateUserDto.profile_slug) {
      const existingSlugUser = await this.usersRepository.findOne({
        where: { 
          profile_slug: updateUserDto.profile_slug,
          id: Not(userId)
        }
      });
      if (existingSlugUser) {
        throw new ConflictException('This profile URL slug is already taken.');
      }
    }

    Object.assign(user, updateUserDto);

    const updatedUser = await this.usersRepository.save(user);

    const { password_hash, validatePassword, deleted_at, ...result } = updatedUser;
    return result as PublicUser;
  }

  async banUser(userId: number): Promise<PublicUser> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    user.is_banned = true;
    const bannedUser = await this.usersRepository.save(user);
    const { password_hash, validatePassword, deleted_at, ...result } = bannedUser;
    return result as PublicUser;
  }

  async unbanUser(userId: number): Promise<PublicUser> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    user.is_banned = false;
    const unbannedUser = await this.usersRepository.save(user);
    const { password_hash, validatePassword, deleted_at, ...result } = unbannedUser;
    return result as PublicUser;
  }

  async softDeleteUser(userId: number): Promise<void> {
    const result = await this.usersRepository.softDelete(userId);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.usersRepository.find();
    return users.map(user => {
        const { password_hash, validatePassword, deleted_at, ...result } = user;
        return result as PublicUser;
    });
  }

  async findOne(id: number): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { password_hash, validatePassword, deleted_at, ...result } = user;
    return result as PublicUser;
  }
  
  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findOneWithPasswordByEmail(email: string): Promise<User | null> { 
    return this.usersRepository.createQueryBuilder("user")
        .addSelect("user.password_hash")
        .where("user.email = :email", { email })
        .getOne();
  }

  async findOneWithPasswordById(id: number): Promise<User | null> {
    return this.usersRepository.createQueryBuilder("user")
        .addSelect("user.password_hash")
        .where("user.id = :id", { id })
        .getOne();
  }
}