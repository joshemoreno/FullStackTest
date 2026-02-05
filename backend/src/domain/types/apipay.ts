export type ApiPayMerchantResponse = {
  data: {
    presigned_acceptance: {
      acceptance_token: string;
      permalink: string;
      type: string;
    };
    presigned_personal_data_auth: {
      acceptance_token: string;
      permalink: string;
      type: string;
    };
  };
};

export type ApiPayTokenizeCardResponse = {
  data: {
    id: string;
    status: string;
  };
};

export type ApiPayCreateTxResponse = {
  data: {
    id: string;
    status: string;
    status_message?: string;
  };
};

export type ApiPayGetTxResponse = {
  data: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
    status_message?: string;
    amount_in_cents: number;
    currency: string;
    reference: string;
  };
};
