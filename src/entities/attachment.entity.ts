import { File } from './file.entity'
import { BasicEntity } from './basic.entity'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

@Entity('attachments')
export class Attachment extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: true })
  name: string

  @Column({ type: 'varchar', nullable: true })
  extension: string

  @Column({ type: 'varchar', nullable: true })
  path: string

  @Column({ name: 'file_id', nullable: true })
  fileId: number

  @ManyToOne(() => File, (file) => file.attachments)
  @JoinColumn({ name: 'file_id' })
  file: File

  @Column({ type: 'varchar', nullable: true })
  checksum: string

  @Column({ type: 'varchar', nullable: true })
  filename: string

  @Column({ name: 'original_name', type: 'varchar', nullable: true })
  originalName: string

  public get toResponse() {
    return {
      id: this.id,
      name: this.name,
      extension: this.extension,
      file: this.file,
      filename: this.filename,
      originalName: this.originalName,
    }
  }

  public get toResponseForGroup() {
    return {
      id: this.id,
      name: this.name,
      extension: this.extension,
      path: this.path.split('public/')[1],
      filename: this.filename,
      originalName: this.originalName,
    }
  }
}
