import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BasicEntity } from "./basic.entity";

@Entity('brandedPages')
export class BrandedPage extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number
  
  @Column({name: 'title', type: 'varchar', nullable: true})
  title: string

  @Column({name: 'description', type: 'varchar', nullable: true})
  decription: string

  @Column({name: 'content', type: 'text', nullable: true})
  content: string

  @Column({name: 'leftMenu', type: 'boolean', nullable: true})
  leftMenu: boolean

  @Column({name: 'dashboard', type: 'boolean', nullable: true})
  showInDashbpard: boolean

  @Column({name: 'status', type: 'integer', nullable: true})
  status: number

  @Column({name: 'merchantId', type: 'integer', nullable: true})
  merchantId: number

  @Column({name: 'icon', type: 'text', nullable: true})
  icon: string

  @Column({name: 'image', type: 'text', nullable: true})
  image: string

  @Column({name: 'template', type: 'boolean', nullable: true})
  template: boolean

}