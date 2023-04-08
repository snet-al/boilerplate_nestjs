import { applyDecorators, Type } from '@nestjs/common';
import { ApiProperty, ApiResponse, getSchemaPath } from '@nestjs/swagger'

export class ResponsePaginationDto<EntityType> {
  @ApiProperty()
  public status: string

  @ApiProperty()
  public meta: { total: number }

  public data: EntityType[]
}

export class ResponsePaginationObjDto<EntityType> {
  @ApiProperty()
  public status: string

  @ApiProperty()
  public meta: { total: number }

  public data: EntityType
}
export const ApiPaginateDto = <TModel extends Type<any>>({ type, status = 200, description = '' }: { type: TModel, status?: number, description?: string }) => {
  return applyDecorators(
    ApiResponse({
      description,
      status,
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string'
          },
          meta: {
            type: 'object',
            properties: {
              total: {
                type: 'number'
              }
            }
          },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(type) },
          },
        },
      },
    }),
  );
};

export const ApiPaginateObjDto = <TModel extends Type<any>>({ type, status = 200, description = '' }: { type: TModel, status?: number, description?: string }) => {
  return applyDecorators(
    ApiResponse({
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string'
          },
          meta: {
            type: 'object',
            properties: {
              total: {
                type: 'number'
              }
            }
          },
          data: {
            $ref: getSchemaPath(type)
          },
        },
      },
    }),
  );
};