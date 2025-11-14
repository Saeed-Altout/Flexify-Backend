import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProjectTranslation } from './project-translation.entity';
import { ProjectRating } from './project-rating.entity';
import { ProjectLike } from './project-like.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'jsonb', default: [] })
  tech_stack: string[];

  @Column({ type: 'varchar', length: 100 })
  role: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  github_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  github_backend_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  live_demo_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  main_image: string;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  average_rating: number;

  @Column({ type: 'int', default: 0 })
  total_ratings: number;

  @Column({ type: 'int', default: 0 })
  total_likes: number;

  @Column({ type: 'boolean', default: true })
  is_published: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @OneToMany(() => ProjectTranslation, (translation) => translation.project, {
    cascade: true,
  })
  translations: ProjectTranslation[];

  @OneToMany(() => ProjectRating, (rating) => rating.project, {
    cascade: true,
  })
  ratings: ProjectRating[];

  @OneToMany(() => ProjectLike, (like) => like.project, {
    cascade: true,
  })
  likes: ProjectLike[];
}
