import { MercadoPago } from "@/domain/entities/mercadoPago.entity";

export async function exchangeCodeForTokens(commerceId: number, code: string) {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_secret: process.env.MP_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.MP_REDIRECT_URI,
        }),
    });

    if (!response.ok) throw new Error('Error al obtener tokens de MP');

    const data = await response.json();

    const tokenInstance = MercadoPago.createTokens({
        commerceId: commerceId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        publicKey: data.public_key ?? null,
        mpUserId: data.user_id,
        tokenExpires: new Date(Date.now() + data.expires_in * 1000),
    });

    return tokenInstance;
}
