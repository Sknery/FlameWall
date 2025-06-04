import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Purchase } from '../../purchases/entities/purchase.entity';

@Entity('shop_items')
export class ShopItem {
  @PrimaryGeneratedColumn({ name: 'item_id' })
  item_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer', default: 0 })
  price: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'image_url' })
  image_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'ingame_command' })
  ingame_command: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => Purchase, (purchase) => purchase.item)
  purchases: Purchase[];
}