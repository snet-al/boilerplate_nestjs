import { Group } from './group.entity'
import { BasicEntity } from './basic.entity'
import { Document } from './document.entity'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

@Entity('documents_groups')
export class DocumentsGroups extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Group, (group) => group.documentsGroups)
  @JoinColumn({ name: 'group_id' })
  group: Group
  @Column({ name: 'group_id', nullable: true })
  groupId: number

  @ManyToOne(() => Document, (document) => document.documentsGroups)
  @JoinColumn({ name: 'document_id' })
  document: Document
  @Column({ name: 'document_id', nullable: true })
  documentId: number

  public get toResponse() {
    return {
      id: this.id,
      group: this.group,
      document: this.document,
    }
  }
}
