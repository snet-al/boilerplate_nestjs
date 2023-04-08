import { Document } from './document.entity'
import { BasicEntity } from './basic.entity'
import { Attachment } from './attachment.entity'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

export enum FileStatus {
  ORIGINAL = 'original',
  COPY = 'copy',
}
@Entity('files')
export class File extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'data', type: 'simple-json', nullable: true })
  data: object

  @Column({ name: 'document_id', nullable: true })
  documentId: number

  @Column({ name: 'status', type: 'varchar', nullable: true })
  status: string

  @ManyToOne(() => Document, (document) => document.files)
  @JoinColumn({ name: 'document_id' })
  document: Document

  @OneToMany(() => Attachment, (attachment) => attachment.file)
  attachments: Attachment[]

  @Column({ name: 'notes', type: 'varchar', nullable: true })
  notes: string

  @Column({ name: 'overall_notes', type: 'varchar', nullable: true })
  overallNotes: string

  @Column({ name: 'tags', type: 'varchar', nullable: true })
  tags: string[]

  public get toResponse() {
    return {
      id: this.id,
      data: this.data,
      document: this.document,
      attachments: this.attachments.map((attachment) => attachment.toResponse) || undefined,
    }
  }

  public get toResponseForGroup() {
    return {
      id: this.id,
      data: this.data,
      document: this.document,
      attachments: this.attachments.map((attachment) => attachment.toResponseForGroup) || undefined,
    }
  }
}
