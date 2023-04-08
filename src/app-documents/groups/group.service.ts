import { Request } from 'express'
import { In, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { UpdateGroupDto } from './dto/update-group.dto'
import { CreateGroupDto } from './dto/create-group.dto'
import { ContextTypes, Group } from '../../entities/group.entity'
import { PaginationService } from '../../common/pagination.service'
import { DocumentsGroups } from '../../entities/documents_groups.entity'
import { FindGroupOrFailPipeService } from './pipe/find-group-or-fail-pipe.service'
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
@Injectable()
export class GroupService {
  @Inject(PaginationService)
  private readonly paginationService: PaginationService

  @Inject(FindGroupOrFailPipeService)
  private readonly findGroupOrFailPipeService: FindGroupOrFailPipeService

  @InjectRepository(Group)
  public repository: Repository<Group>

  @InjectRepository(DocumentsGroups)
  public documentFolders: Repository<DocumentsGroups>

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    if (createGroupDto.id) {
      const existingGroup = await this.repository.findOne({ where: { id: createGroupDto.id } })
      const mergedGroup = this.repository.merge(existingGroup, createGroupDto)
      const savedGroup = await this.repository.save(mergedGroup)
      return savedGroup
    } else {
    }
    let level = 1

    if (createGroupDto.type === ContextTypes.FOLDER) {
      createGroupDto.parentId = null
    }
    if (createGroupDto.parentName) {
      let title = createGroupDto.parentName.substring(createGroupDto.parentName.indexOf('-'))
      let parent = await this.repository.findOne({ where: { title: title } })
      if (parent) {
        if (createGroupDto.type === parent.type) {
          throw new Error('Cannot create same type of group as parent')
        }
        createGroupDto.parentId = parent.id
      }
    }
    if (createGroupDto.parentId) {
      let parent = await this.repository.findOne({ where: { id: createGroupDto.parentId } })
      if (parent) {
        if (createGroupDto.type === parent.type) {
          throw new Error('Cannot create same type of group as parent')
        }
        createGroupDto.parentId = parent.id
        level = parent.level + 1
      }
    }

    createGroupDto.level = level
    let newGroup = this.repository.create(createGroupDto)
    const savedGroup = await this.repository.save(newGroup)
    return savedGroup
  }

  async findAll(request: Request) {
    let query = {
      where: {},
      relations: ['parent', 'parent.parent', 'parent.parent.parent', 'parent.parent.parent.parent', 'parent.parent.parent.parent.parent'],
    }
    if (request.query) {
      if (request.query.type) {
        query.where = { type: request.query.type }
      } else {
        query.where = {
          type: In([ContextTypes.FOLDER, ContextTypes.SUBFOLDER]),
        }
      }
    }
    query = this.paginationService.paginate(query, request)
    let result = await this.repository.find(query)
    let response = result.map((el) => el.toResponse)
    return [response, response.length]
  }

  async findAllWithDocuments(group: Group, request: Request) {
    const queryBuilder = this.repository
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.documents', 'd')
      .leftJoinAndSelect('d.files', 'f')
      .leftJoinAndSelect('f.attachments', 'a')
      .where('group_id = :groupId', { groupId: group.id })
    await this.paginationService.paginateQueryBuilder(queryBuilder, request)
    const results = await queryBuilder.getManyAndCount()
    const items = results[0].map((group) => group.toResponseWithDocumentsFolders)
    return [items, items.length]
  }

  async buildTree(request: Request) {
    const query = this.paginationService.paginate(
      {
        relations: [
          'parent',
          'parent.parent',
          'parent.parent.parent',
          'parent.parent.parent.parent',
          'parent.parent.parent.parent.parent',
          'parent.parent.parent.parent.parent.parent',
          'documents',
          'documents.files',
          'documents.files.attachments',
        ],
      },
      request,
    )

    query.where = {
      type: In([ContextTypes.FOLDER, ContextTypes.SUBFOLDER]),
    }

    let [list, count] = await this.repository.findAndCount(query)
    let tree = {}
    let root = []
    if (request.query.locationTree) {
      for (let node of list) {
        tree[String(node.id)] = {
          ...node.baseGroup,
          children: node.documentsGroups.map((documentGroup) => {
            return {
              id: documentGroup.document.id,
              name: documentGroup.document.files[0]?.attachments[0]?.name,
              extension: documentGroup.document.files[0]?.attachments[0]?.extension,
              url: `/uploads/${documentGroup.document.files[0]?.attachments[0]?.name}.${documentGroup.document.files[0]?.attachments[0]?.extension}`,
              isDirectory: false,
              filename: documentGroup.document.files[0]?.attachments[0]?.filename,
            }
          }),
        }
      }

      for (let id in tree) {
        let node = tree[id]
        if (!node.parentId) continue
        let parentId = String(node.parentId)
        tree[parentId].children.push(tree[id])
      }
      for (let id in tree) {
        if (!tree[id].parentId) {
          root.push(tree[id])
        }
      }
    } else {
      for (let node of list) {
        tree[String(node.id)] = {
          ...node.toResponse,
          items: node.documentsGroups.map((documentGroup) => {
            return {
              id: documentGroup.document.id,
              name: documentGroup.document.files[0]?.attachments[0]?.name,
              extension: documentGroup.document.files[0]?.attachments[0]?.extension,
              url: `/uploads/${documentGroup.document.files[0]?.attachments[0]?.name}.${documentGroup.document.files[0]?.attachments[0]?.extension}`,
              isDirectory: false,
              filename: documentGroup.document.files[0]?.attachments[0]?.filename,
            }
          }),
        }
      }

      for (let id in tree) {
        let node = tree[id]
        if (!node.parentId) continue
        let parentId = String(node.parentId)
        tree[parentId].items.push(tree[id])
      }
      for (let id in tree) {
        if (!tree[id].parentId) {
          root.push(tree[id])
        }
      }
    }

    return root
  }

  async update(group: Group, updateGroupDto: UpdateGroupDto) {
    group = this.repository.merge(group, updateGroupDto)
    if (updateGroupDto.parentId) {
      const parent = await this.findGroupOrFailPipeService.transform(updateGroupDto.parentId)
      group.parent = parent
    }
    group = await this.repository.save(group)
    return group
  }

  async findOne(id: number): Promise<Group> {
    const group = await this.repository.findOne({
      where: { id },
      relations: ['parent', 'parent.parent', 'parent.parent.parent', 'parent.parent.parent.parent', 'parent.parent.parent.parent.parent'],
    })
    if (!group) {
      throw new NotFoundException('Group not found')
    }
    let count = 0
    let level = group.level
    let parentIds = [group.id]
    while (level < 6) {
      const nextLevelGroups = await this.repository.find({ where: { level: ++level, parentId: In(parentIds) } })
      for (const nextLevelGroup of nextLevelGroups) {
        if (nextLevelGroup.type === ContextTypes.FOLDER) {
          count++
        } else {
          parentIds.push(nextLevelGroup.id)
        }
      }
    }
    group.foldersCount = count

    return group
  }

  async remove(id: number) {
    let children = await this.getChildrenIds(id)
    let documentsInGroup = await this.documentFolders.find({ where: { groupId: In(children) } })
    if (documentsInGroup.length) {
      throw new BadRequestException('This group has documents')
    }
    if (children.length) {
      await this.repository.delete(children)
    }
    await this.repository.delete(+id)
    return true
  }

  public async getChildrenIds(actualNode: number) {
    let children = []
    const query = {
      relations: [
        'parent',
        'parent.parent',
        'parent.parent.parent',
        'parent.parent.parent.parent',
        'parent.parent.parent.parent.parent',
        'parent.parent.parent.parent.parent.parent',
        'parent.parent.parent.parent.parent.parent.parent',
      ],
    }
    let list = await this.repository.find(query)
    let tree = {}
    let root = []
    for (let node of list) {
      tree[parseInt(String(node.id))] = parseInt(String(node.parentId))
    }
    let parent = null

    for (let id in tree) {
      parent = tree[id]
      while (parent) {
        if (parent === actualNode) {
          children.push(id)
          break
        }
        parent = tree[parent]
      }
    }
    return children
  }
}
