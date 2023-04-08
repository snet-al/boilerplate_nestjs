import { Injectable } from '@nestjs/common'

@Injectable()
export class PaginationService {
  public getQuery(repository: any) {
    return repository.getQueryBuilder()
  }

  public paginate(query: any, request: any) {
    query.take = request.query.pageSize || 20
    let skip = query.take * ((request.query.page || 1) - 1)
    query.skip = skip

    if (request.query.sortBy) {
      query.order = {
        [request.query.sortBy]: request.query.sortOrder ?? 'ASC',
      }
    }
    return query
  }

  public paginateQueryBuilder(queryBuilder: any, request: any) {
    if (request.query.sortBy) {
      queryBuilder.addOrderBy(request.query.sortBy, request.query.sortOrder ?? 'ASC')
    }
    let take = request.query.pageSize || 20
    let skip = take * ((request.query.page || 1) - 1)
    queryBuilder.take(take).skip(skip)

    return queryBuilder
  }

  public prepareQuery(query?: any, request?: any) {
    query = query || {}
  }
}
