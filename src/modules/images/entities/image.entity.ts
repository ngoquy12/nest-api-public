import { BaseEntity } from 'src/common/entities/base.entity';
import { TypeImage } from 'src/common/enums/type-image.enum';
import { Column, Entity } from 'typeorm';

@Entity('images')
export class Image extends BaseEntity {
  @Column({ unique: true })
  url: string;

  @Column()
  publicId: string;

  @Column()
  refId: number;

  @Column()
  type: TypeImage;
}
