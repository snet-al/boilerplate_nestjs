import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { MeService } from './me.service'
import { Response } from 'express'
import { ResponseMeDetailsDto } from './dto/response-me-details.dto'
import { BaseController } from '../../../app-api/base.controller'
//import { JwtTwoFactorGuard } from '../../guards/jwt-2fa.guard'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'
import { ChangePasswordDto } from './dto/change-password.dto'
// import { HasRoles } from '../../decorators/roles.decorator'
// import { UserRoles } from '../../../entities/role.entity'
// import { FindProcurementOrFailPipe } from '../../../app-api/procurement/pipe/find-procurement-or-fail-pipe.service'
// import { Procurement } from '../../../entities/procurement.entity'
//import { FindOfferOrFailPipe } from '../../../app-api/offer/pipe/find-offer-or-fail-pipe.service'
// import { Offer } from '../../../entities/offer.entity'
// import { OfferDto } from '../../../app-api/offer/dto/offer.dto'

@ApiTags('Me')
@Controller('me')
export class MeController extends BaseController {
  @Inject(MeService)
  private readonly service: MeService

  // @Inject(FindOfferOrFailPipe)
  // private readonly findOfferService: FindOfferOrFailPipe

  @Get()
  //@UseGuards(JwtTwoFactorGuard)
  @ApiResponse({
    status: 200,
    description: 'Logged user data were successfully returned',
    type: ResponseMeDetailsDto,
  })
  async me(@Req() req: any, @Res() res: Response) {
    const userData = await this.service.me(req.user)
    return this.success(res, userData)
  }

  @Post('/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change user password.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully.',
  })
  @UsePipes(new ValidationPipe())
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto, @Res() res: Response) {
    const data = await this.service.changePassword(dto, req.user)
    return this.success(res, data)
  }

  // @Get('procurements')
  // @UseGuards(JwtTwoFactorGuard)
  // @HasRoles(UserRoles.client)
  // @ApiQuery({ name: 'filters', required: false, type: String, description: 'json format of filters' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Logged client procurements were fetched successfully',
  // })
  // async myProcurements(@Req() req: any, @Res() res: Response) {
  //   let filterParams = {}
  //   if (req.query.filters) {
  //     try {
  //       filterParams = JSON.parse(req.query.filters)
  //     } catch (e) {
  //       res.status(HttpStatus.BAD_REQUEST).json({
  //         statusCode: HttpStatus.BAD_REQUEST,
  //         error: 'Bad Request',
  //         message: 'Filters must be in json format',
  //       })
  //       return
  //     }
  //   }
  //   const data = await this.service.getClientProcurements(req, filterParams)
  //   res.status(HttpStatus.OK).json({
  //     statusCode: HttpStatus.OK,
  //     message: 'All procurements were returned successfully!',
  //     data,
  //   })
  // }

  // @ApiBearerAuth()
  // @HasRoles(UserRoles.client)
  // @Put('procurements/:id/offers/:offerId')
  // @ApiResponse({
  //   status: 200,
  //   description: 'Update offer',
  // })
  // async update(
  //   @Param('id', ParseIntPipe, FindProcurementOrFailPipe) procurement: Procurement,
  //   @Param('offerId', ParseIntPipe, FindOfferOrFailPipe) offer: Offer,
  //   @Body() offerDto: OfferDto,
  //   @Res() res,
  // ) {
  //   if (offer.procurement.id !== procurement.id) {
  //     res.status(HttpStatus.BAD_REQUEST).json({
  //       statusCode: HttpStatus.BAD_REQUEST,
  //       error: 'Bad Request',
  //       message: `This offer ${offer.id} is not part of procurement with ID: ${procurement.id} `,
  //     })
  //     return
  //   }
  //   await this.service.update(offer, offerDto)
  //   res.status(HttpStatus.OK).json({
  //     statusCode: HttpStatus.OK,
  //     message: 'Offer updated successfully!',
  //   })
  // }

  // @Get('procurements/:id')
  // @UseGuards(JwtTwoFactorGuard)
  // @HasRoles(UserRoles.client)
  // @ApiResponse({
  //   status: 200,
  //   description: 'Logged client procurement was fetched successfully',
  // })
  // async myProcurement(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: Response) {
  //   const procurement = await this.service.getClientProcurement(id, req.user)
  //   res.status(HttpStatus.OK).json({
  //     statusCode: HttpStatus.OK,
  //     message: 'Success',
  //     data: {
  //       procurement,
  //     },
  //   })
  // }

  // @Get('procurements/:id/offers/:offerId')
  // @UseGuards(JwtTwoFactorGuard)
  // @HasRoles(UserRoles.client)
  // @ApiResponse({
  //   status: 200,
  //   description: 'Logged client procurement was fetched successfully',
  // })
  // async myOffer(
  //   @Param('id', ParseIntPipe, FindProcurementOrFailPipe) procurement: Procurement,
  //   @Param('offerId', ParseIntPipe, FindOfferOrFailPipe) offer: Offer,
  //   @Res() res: Response,
  // ) {
  //   if (offer.procurement.id !== procurement.id) {
  //     res.status(HttpStatus.BAD_REQUEST).json({
  //       statusCode: HttpStatus.BAD_REQUEST,
  //       error: 'Bad Request',
  //       message: `This offer ${offer.id} is not part of procurement with ID: ${procurement.id} `,
  //     })
  //     return
  //   }
  //   res.status(HttpStatus.OK).json({
  //     statusCode: HttpStatus.OK,
  //     message: 'Success',
  //     data: offer.toResponseWithBids,
  //   })
  // }
}
