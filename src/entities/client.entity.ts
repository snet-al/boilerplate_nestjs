import { BasicEntity } from './basic.entity'
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
@Entity('clients')
export class Client extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'company_name', type: 'varchar', nullable: true })
  companyName: string

  @Column({ name: 'client_type', type: 'varchar', nullable: true })
  clientType: string

  @Column({ name: 'city', type: 'varchar', nullable: true })
  city: string

  @Column({ name: 'contact_method', type: 'varchar', nullable: true })
  contactMethod: string

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string

  public get baseGroup() {
    return {
      id: this.id,
      companyName: this.companyName,
      clientType: this.clientType,
      city: this.city,
      contactMethod: this.contactMethod,
      notes: this.notes,
    }
  }
}
