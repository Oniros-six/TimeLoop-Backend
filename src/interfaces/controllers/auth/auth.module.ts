  import { Module } from '@nestjs/common';
  import { PassportModule } from '@nestjs/passport';
  import { AuthController } from './auth.controller';
  import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

  // Use cases
  import { LoginUser } from '@/application/use-cases/user/login.use-case';
  import { FindUser } from '@/application/use-cases/user/find.use-case';

  // Tokens
  import { USER_REPOSITORY } from '@/application/providers';

  // Repositories
  import { PrismaUserRepository } from '@/infrastructure/prisma/repositories/user.repository';

  // Auth components
  import { LocalStrategy } from '@/infrastructure/auth/local.strategy';
  import { SessionSerializer } from '@/infrastructure/auth/session.serializer';
  import { AuthService } from '@/domain/services/auth/auth.service';
  import { AuthGuard } from '@/infrastructure/auth/auth.guard';
  import { RolesGuard } from '@/infrastructure/auth/roles.guard';
  import { BcryptPasswordHasher } from '@/infrastructure/auth/bcrypt-password-hasher';

  @Module({
    imports: [PrismaModule, PassportModule.register({ session: true })],
    controllers: [AuthController],
    providers: [
      {
        provide: USER_REPOSITORY,
        useClass: PrismaUserRepository,
      },
      {
        provide: 'IPasswordHasher',
        useClass: BcryptPasswordHasher,
      },
      LoginUser,
      FindUser,
      AuthService,
      LocalStrategy,
      SessionSerializer,
      AuthGuard,
      RolesGuard,
    ],
    exports: [AuthGuard, RolesGuard],
  })
  export class AuthModule {}
