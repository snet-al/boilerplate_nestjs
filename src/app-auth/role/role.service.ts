import { Repository } from 'typeorm'
import { RoleDto } from './dto/role.dto'
import { Role } from '../../entities/role.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { PaginationService } from '../../common/pagination.service'
import { BadRequestException, Inject, Injectable } from '@nestjs/common'

@Injectable()
export class RoleService {
  @InjectRepository(Role)
  private repository: Repository<Role>

  @Inject(PaginationService)
  public paginationService: PaginationService

  async getAll() {
    const results = await this.repository.createQueryBuilder('role').getManyAndCount()
    const items = results[0].map((role) => role.baseGroup)
    const totalRecords = results[1] || 0
    return { items, totalRecords }
  }

  async findOne(whereCondition): Promise<Role | undefined> {
    return await this.repository.findOne({ where: whereCondition })
  }

  async create(createRoleDto: RoleDto) {
    const createdRole = this.repository.create(createRoleDto)
    return await this.repository.save(createdRole)
  }

  async update(role: Role, updateDto: RoleDto) {
    const mergedRole = this.repository.merge(role, updateDto)
    return await this.repository.save(mergedRole)
  }

  async remove(role: Role) {
    const queryBuilder = await this.repository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.userRoles', 'userRole')
      .where('userRole.role_id = :roleId', { roleId: role.id })
      .getMany()
    if (queryBuilder.length > 0) {
      throw new BadRequestException('This role can not be deleted! It is related to many users.')
    }
    return await this.repository.remove(role)
  }
}
