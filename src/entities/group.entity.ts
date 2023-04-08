import { BasicEntity } from './basic.entity'
import { DocumentsGroups } from './documents_groups.entity'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

export enum ContextTypes {
  FOLDER = 'folder',
  SUBFOLDER = 'subfolder',
}

@Entity('groups')
export class Group extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'parents', type: 'varchar', nullable: true })
  parents: string

  @Column({ name: 'nr', type: 'varchar', nullable: true })
  nr: string

  @Column({ name: 'level', type: 'integer', nullable: true })
  level: number

  @Column({ name: 'type', type: 'varchar', nullable: true })
  type: string

  @Column({ name: 'location', type: 'varchar', nullable: true })
  location: string

  @Column({ name: 'title', type: 'varchar', nullable: true })
  title: string

  @Column({ name: 'description', type: 'varchar', nullable: true })
  description: string

  @Column({ name: 'is_public', type: 'boolean', nullable: true })
  isPublic: boolean

  @ManyToOne(() => Group, (group) => group.parent, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Group
  @Column({ name: 'parent_id', type: 'integer', nullable: true })
  parentId: number

  @OneToMany(() => DocumentsGroups, (documentGroup) => documentGroup.group)
  documentsGroups: DocumentsGroups[]

  foldersCount: number = 0

  get baseGroup() {
    return {
      id: this.id,
      parentId: this.parentId,
      parents: this.parents,
      nr: this.nr,
      foldersCount: this.foldersCount,
      level: this.level,
      type: this.type,
      description: this.description,
      isDirectory: true,
      isPublic: this.isPublic,
      title: this.title,
      location: this.location,
      path: this.getPathName(),
    }
  }

  public toResponse() {
    return {
      ...this.baseGroup,
    }
  }

  public get toResponseWithDocumentsFolders() {
    return {
      ...this.baseGroup,
      title: this.title,
      documents: this.documentsGroups.map((documentGroup) => documentGroup.document.toResponse) || [],
    }
  }

  public getPathName() {
    let path = []
    let parent = this.parent

    while (parent) {
      path.push(parent.title)
      parent = parent.parent
    }
    return path.reverse().join(' / ')
  }
}
