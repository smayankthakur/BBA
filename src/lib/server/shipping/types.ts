import type { AdminOrder } from "../orders";

export type ShipResult = {
  provider: string;
  providerOrderId: string | null;
  shipmentId: string;
  awb: string;
  courier: string;
  labelUrl: string | null;
  trackingUrl: string;
};

/** A courier aggregator the admin panel can book shipments with. */
export interface ShippingProvider {
  id: string;
  name: string;
  configured(): boolean;
  trackingUrl(awb: string): string;
  createShipment(o: AdminOrder): Promise<ShipResult>;
  label(shipmentId: string): Promise<string | null>;
}
