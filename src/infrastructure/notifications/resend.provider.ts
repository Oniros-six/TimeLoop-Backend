import { Provider } from '@nestjs/common';
import { Resend } from 'resend';
import { RESEND_PROVIDER } from '@/application/constants/providers';

export const ResendProvider: Provider = {
  provide: RESEND_PROVIDER,
  useFactory: () => {
    return new Resend(process.env.RESEND_API_KEY);
  },
};
