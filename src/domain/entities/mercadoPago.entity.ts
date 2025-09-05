export class MercadoPago {
  constructor(
    public readonly id: number,
    public readonly commerceId: number,
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly publicKey: string | null,
    public readonly mpUserId: string,
    public readonly tokenExpires: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // Clase interna para tokens
  static Token = class {
    constructor(
      public readonly commerceId: number,
      public readonly accessToken: string,
      public readonly refreshToken: string,
      public readonly publicKey: string | null,
      public readonly mpUserId: string,
      public readonly tokenExpires: Date,
    ) {}
  };

  // Factory method para MercadoPago
  static create(props: {
    id: number;
    commerceId: number;
    accessToken: string;
    refreshToken: string;
    publicKey: string | null;
    mpUserId: string;
    tokenExpires: Date;
    createdAt: Date;
    updatedAt: Date;
  }): MercadoPago {
    return new MercadoPago(
      props.id,
      props.commerceId,
      props.accessToken,
      props.refreshToken,
      props.publicKey,
      props.mpUserId,
      props.tokenExpires,
      props.createdAt,
      props.updatedAt,
    );
  }

  // Factory method para Token
  static createTokens(props: {
    commerceId: number;
    accessToken: string;
    refreshToken: string;
    publicKey: string | null;
    mpUserId: string;
    tokenExpires: Date;
  }): InstanceType<typeof MercadoPago.Token> {
    return new this.Token(
      props.commerceId,
      props.accessToken,
      props.refreshToken,
      props.publicKey,
      props.mpUserId,
      props.tokenExpires,
    );
  }
}
