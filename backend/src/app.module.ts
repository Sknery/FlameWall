import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { ShopItem } from './shop/entities/shop-item.entity';
import { Post } from './posts/entities/post.entity';
import { Friendship } from './friendships/entities/friendship.entity';
import { Message } from './messages/entities/message.entity';
import { News } from './news/entities/news.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Comment } from './comments/entities/comment.entity';
import { Purchase } from './purchases/entities/purchase.entity';
import { UsersModule } from './users/users.module';
import { ShopModule } from './shop/shop.module';
import { PostsModule } from './posts/posts.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { MessagesModule } from './messages/messages.module';
import { NewsModule } from './news/news.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comments/comments.module';
import { PurchasesModule } from './purchases/purchases.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      name: 'default',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          User,
          ShopItem,
          Post,
          Friendship,
          Message,
          News,
          Notification,
          Comment,
          Purchase,
        ],
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    UsersModule,
    ShopModule,
    PostsModule,
    FriendshipsModule,
    MessagesModule,
    NewsModule,
    NotificationsModule,
    CommentsModule,
    PurchasesModule,
    AuthModule,
    AdminModule,
    CommentsModule,
    FriendshipsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}