import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

type PublicUser = Omit<User, 'password_hash' | 'validatePassword' | 'hashPassword'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const { email, username } = createUserDto;
    const existingUserByEmail = await this.usersRepository.findOne({ where: { email } });
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }
    const existingUserByUsername = await this.usersRepository.findOne({ where: { username } });
    if (existingUserByUsername) {
      throw new ConflictException('User with this username already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(user);
    
    const { password_hash, validatePassword, hashPassword, ...result } = savedUser;
    return result as PublicUser;
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.usersRepository.find();
    return users.map(user => {
        const { password_hash, validatePassword, hashPassword, ...result } = user;
        return result as PublicUser;
    });
  }

  async findOne(id: number): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { password_hash, validatePassword, hashPassword, ...result } = user;
    return result as PublicUser;
  }
  
  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }
}