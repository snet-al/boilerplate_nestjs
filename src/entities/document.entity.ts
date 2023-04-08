import { File } from './file.entity'
import { BasicEntity } from './basic.entity'
import { DocumentsGroups } from './documents_groups.entity'
import { Entity, OneToMany, PrimaryGeneratedColumn, ManyToMany, JoinTable, Column } from 'typeorm'

export enum DocumentStatus {
  ANONYMIZED = 'anonymized',
  ORIGINAL = 'original',
}
@Entity('documents')
export class Document extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'status', type: 'varchar', nullable: true })
  status: string

  @Column({ name: 'notes', type: 'varchar', nullable: true })
  notes: string

  @Column({ name: 'overall_notes', type: 'varchar', nullable: true })
  overallNotes: string

  @Column({ name: 'tags', type: 'varchar', nullable: true })
  tags: string[]

  @OneToMany(() => File, (file) => file.document)
  files: File[]

  @OneToMany(() => DocumentsGroups, (documentGroup) => documentGroup.document)
  documentsGroups: DocumentsGroups[]

  public get toResponse() {
    return {
      id: this.id,
      files: this.files.map((file) => file.toResponseForGroup),
    }
  }
}
