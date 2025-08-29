import { InvoiceStatus } from "../dbEnums/invoiceStatus";
import { Invoice } from "../entities/invoice.entity";

export interface IInvoiceRepository {
  createInvoice(data: Invoice): Promise<Invoice>;
  findAllByCommerce(commerceId: number): Promise<Invoice[] | null>;
  findById(invoiceId: number): Promise<Invoice | null>;
  findAllByCommerceDate(data: { commerceId: number, startPeriod: Date, endPeriod: Date }): Promise<Invoice[] | null>;
  updateStatus(data: { invoiceId: number, status: InvoiceStatus }): Promise<Invoice | null>;
}
