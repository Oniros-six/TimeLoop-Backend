import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ICommerceRepository } from '@/domain/repositories/commerce.repository';
import { COMMERCE_REPOSITORY } from '@/application/providers';

@WebSocketGateway({
  namespace: '/bookings',
  cors: {
    origin: '*', // Ajustar según necesidades de producción
  },
})
export class BookingRealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BookingRealtimeGateway.name);
  private readonly rateLimitMap = new Map<string, { count: number; lastSeen: number }>();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minuto
  private readonly RATE_LIMIT_MAX_CONNECTIONS = 30; // 30 conexiones por minuto
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    @Inject(COMMERCE_REPOSITORY)
    private readonly commerceRepository: ICommerceRepository,
  ) {}

  afterInit() {
    this.logger.log('BookingRealtimeGateway initialized');
    
    // Limpiar entradas antiguas del rate limit cada minuto
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.rateLimitMap.entries()) {
        if (now - value.lastSeen > this.RATE_LIMIT_WINDOW) {
          this.rateLimitMap.delete(key);
        }
      }
    }, this.RATE_LIMIT_WINDOW);
  }

  async handleConnection(socket: Socket) {
    const clientIp = socket.handshake.address;
    
    // Rate limiting
    if (!this.checkRateLimit(clientIp)) {
      this.logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
      socket.emit('error', { message: 'Too many connections' });
      socket.disconnect();
      return;
    }

    // Obtener commerceId del query param o esperar primer mensaje
    const commerceId = socket.handshake.query.commerceId as string;
    
    if (!commerceId) {
      this.logger.warn('Connection attempt without commerceId');
      socket.emit('error', { message: 'commerceId is required' });
      socket.disconnect();
      return;
    }

    // Validar que sea numérico
    const commerceIdNum = parseInt(commerceId, 10);
    if (isNaN(commerceIdNum)) {
      this.logger.warn(`Invalid commerceId format: ${commerceId}`);
      socket.emit('error', { message: 'commerceId must be a number' });
      socket.disconnect();
      return;
    }

    try {
      // Validar que el comercio exista
      const commerce = await this.commerceRepository.findCommerce({
        commerceId: commerceIdNum,
      });
      if (!commerce) {
        this.logger.warn(`Commerce not found: ${commerceIdNum}`);
        socket.emit('error', { message: 'Commerce not found' });
        socket.disconnect();
        return;
      }

      // Unir a la sala del comercio
      const room = `commerce-${commerceIdNum}`;
      socket.join(room);
      
      // Guardar commerceId en el socket para uso posterior
      socket.data.commerceId = commerceIdNum;
      
      this.logger.log(`Client ${socket.id} joined room ${room}`);
      socket.emit('connected', { commerceId: commerceIdNum });
      
    } catch (error) {
      this.logger.error('Error validating commerce', error);
      socket.emit('error', { message: 'Internal server error' });
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const commerceId = socket.data.commerceId;
    if (commerceId) {
      this.logger.log(`Client ${socket.id} disconnected from commerce-${commerceId}`);
    }
  }

  private checkRateLimit(clientIp: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(clientIp);

    if (!entry) {
      this.rateLimitMap.set(clientIp, { count: 1, lastSeen: now });
      return true;
    }

    // Si la ventana expiró, reiniciar contador
    if (now - entry.lastSeen > this.RATE_LIMIT_WINDOW) {
      this.rateLimitMap.set(clientIp, { count: 1, lastSeen: now });
      return true;
    }

    // Incrementar contador
    entry.count++;
    entry.lastSeen = now;

    return entry.count <= this.RATE_LIMIT_MAX_CONNECTIONS;
  }

  // Método para emitir actualizaciones a una sala específica
  emitToCommerce(commerceId: number, event: string, data: any) {
    const room = `commerce-${commerceId}`;
    this.server.to(room).emit(event, data);
  }

  // Limpiar al destruir el módulo
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
