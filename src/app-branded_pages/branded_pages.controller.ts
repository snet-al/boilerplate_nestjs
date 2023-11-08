import { Controller, Get, Inject } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BaseController } from "src/app-api/base.controller";
import { BrandedPageService } from "./branded_pages.service";

@ApiTags('Branded Pages')
@Controller('branded_pages')

export class BrandedPageController extends BaseController{
    @Inject(BrandedPageService)
    public bradedPageService: BrandedPageService

    @Get()
    
}