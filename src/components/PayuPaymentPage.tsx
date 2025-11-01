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
    <form name="payu" method="post" action="https://secure.payu.in/_payment">
      <input type="hidden" name="key" value="5QR9hy" />
      <input type="hidden" name="txnid" value={transactionId} />
      <input type="hidden" name="amount" value={data.amount} />
      <input type="hidden" name="productinfo" value={data.productioninfo} />
      <input type="hidden" name="firstname" value={data.firstname} />
      <input type="hidden" name="email" value={data.email} />
      <input type="hidden" name="phone" value={data.phone} />
      <input type="hidden" name="surl" value={data.surl} />
      <input type="hidden" name="furl" value={data.furl} />
      <input type="hidden" name="hash" value={hash} />
      <input type="submit" value="Submit" />
    </form>
 </div>
    )
}

export default PayuPaymentPage;