import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

export type PublicUser = Omit<User, 'password_hash' | 'validatePassword' | 'hashPasswordMethod' | 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const { email, username } = createUserDto;
    let existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    existingUser = await this.usersRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new ConflictException('User with this username already exists');
    }

    const user = this.usersRepository.create(createUserDto); 
    const savedUser = await this.usersRepository.save(user);
    
    const { password_hash, password, validatePassword, hashPasswordMethod, ...result } = savedUser;
    return result as PublicUser;
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.usersRepository.find();
    return users.map(user => {
        const { password_hash, password, validatePassword, hashPasswordMethod, ...result } = user;
        return result as PublicUser;
    });
  }

  async findOne(id: number): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { password_hash, password, validatePassword, hashPasswordMethod, ...result } = user;
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