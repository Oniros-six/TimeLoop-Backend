export type BookingDetail = {
    id: number;
    customer: {
      id: number;
      name: string;
      email: string;
    };
    commerce: {
      name: string;
    };
  };
  