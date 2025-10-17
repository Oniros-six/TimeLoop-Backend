export type BookingMP = {
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
  