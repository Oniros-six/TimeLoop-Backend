import { BusinessCategory } from '../common/BusinessCategory';

export class Commerce {
  constructor(
    public readonly id: number,
    public name: string,
    public email: string,
    public phone: string,
    public address: string,
    public businessCategory: BusinessCategory,
  ) {}
}
