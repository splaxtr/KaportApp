import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { PhotosService } from './photos.service';

const rawUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const uploadDir = rawUploadDir.startsWith('~')
  ? path.join(os.homedir(), rawUploadDir.slice(1))
  : rawUploadDir;

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('cases/:caseId/photos')
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
    @Param('caseId') caseId: string,
    @UploadedFile() file: Express.Multer.File,
    @User('sub') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const publicUrl = `/uploads/${file.filename}`;
    const storagePath = file.path;
    return this.photosService.createFromFile(caseId, userId, publicUrl, storagePath);
  }

  @Get('cases/:caseId/photos')
  @Roles('admin', 'owner', 'employee')
  list(@Param('caseId') caseId: string) {
    return this.photosService.findMany(caseId);
  }

  @Delete('photos/:id')
  @Roles('admin', 'owner', 'employee')
  remove(@Param('id') id: string, @User('sub') userId: string) {
    return this.photosService.remove(id, userId);
  }
}
