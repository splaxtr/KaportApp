import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { PhotosService } from './photos.service';

const rawUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const uploadDir = rawUploadDir.startsWith('~')
  ? path.join(os.homedir(), rawUploadDir.slice(1))
  : rawUploadDir;

@Controller('photos')
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('upload')
  @Roles('admin', 'owner', 'employee')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          fs.mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname || '');
          cb(null, `${crypto.randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Only JPEG/PNG/WEBP allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreatePhotoDto,
    @User('sub') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const publicUrl = `/uploads/${file.filename}`;
    const storagePath = file.path;
    return this.photosService.createFromFile(dto, userId, publicUrl, storagePath);
  }

  @Get()
  @Roles('admin', 'owner', 'employee')
  list(@Query('caseId') caseId?: string, @Query('shopId') shopId?: string) {
    return this.photosService.findMany({ caseId, shopId });
  }

  @Delete(':id')
  @Roles('admin', 'owner', 'employee')
  remove(@Param('id') id: string, @User('sub') userId: string) {
    return this.photosService.remove(id, userId);
  }
}
