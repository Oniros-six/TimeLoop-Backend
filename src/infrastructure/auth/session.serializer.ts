import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from '@/domain/services/auth/auth.service';
import { User, SafeUser } from '@/domain/common/auth.types';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(user: User, done: (err: any, id: number) => void) {
    done(null, user.id);
  }

  async deserializeUser(
    userId: number,
    done: (err: any, user: SafeUser | false) => void,
  ) {
    try {
      const user = await this.authService.findUserById(userId);
      if (!user) return done(null, false);

      const safeUser: SafeUser = {
        id: user.id,
        commerceId: user.commerceId,
        email: user.email,
        name: user.name,
        role: user.roleId,
        active: user.active,
      };

      done(null, safeUser);
    } catch (err) {
      done(err, false);
    }
  }
}
