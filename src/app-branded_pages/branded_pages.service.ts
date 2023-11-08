import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationService } from "src/common/pagination.service";
import { BrandedPage } from "../entities/branded_page.entity";
import { Repository } from "typeorm";


@Injectable()
export class BrandedPageService {
    @Inject(PaginationService)
    public paginationService: PaginationService

    @InjectRepository(BrandedPage)
    private repository: Repository<BrandedPage>

    async findAll(request: Request){
        const brandedPages = await this.repository.find()
         
        return { brandedPages }
    }
}