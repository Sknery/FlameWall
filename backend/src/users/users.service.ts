import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Ranks } from '../common/enums/ranks.enum';
import * as bcrypt from 'bcrypt'; // Импортируем bcrypt

// Убедимся, что PublicUser не ожидает методов, которые мы убрали из User
export type PublicUser = Omit<User, 'password_hash' | 'validatePassword'>;


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const { email, username, password } = createUserDto; // Получаем password из DTO
    let existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    existingUser = await this.usersRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new ConflictException('User with this username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Хешируем пароль здесь

    const userToCreate = this.usersRepository.create({
      username: username,
      email: email,
      password_hash: hashedPassword, // Передаем хешированный пароль
      rank: Ranks.DEFAULT,
    });

    const savedUser = await this.usersRepository.save(userToCreate);

    const { password_hash, validatePassword, ...result } = savedUser; // Убираем password_hash и validatePassword из возвращаемого объекта
    return result as PublicUser;
  }

  // ... остальные методы сервиса (findAll, findOne и т.д.) остаются без изменений по этой логике,
  // но тип PublicUser был обновлен, так что возвращаемые значения из них тоже будут соответствовать.
  // findOneWithPasswordByEmail и findOneWithPasswordById по-прежнему будут загружать password_hash для AuthService.

  async findAll(): Promise<PublicUser[]> {
    const users = await this.usersRepository.find();
    return users.map(user => {
        const { password_hash, validatePassword, ...result } = user;
        return result as PublicUser;
    });
  }

  async findOne(id: number): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { password_hash, validatePassword, ...result } = user;
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