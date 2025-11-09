import React from "react";

interface PayuPaymentPageProps {
  hash: string;
  transactionId: string;
  open: boolean;
  data: {
    amount: number,
    productioninfo: string,
    firstname: string,
    email: string,
    phone: string,
    surl: string,
    furl: string
  };
}

function PayuPaymentPage({data, hash, transactionId, open}: PayuPaymentPageProps){
    return (
<div>
    
 </div>
    )
}

export default PayuPaymentPage;