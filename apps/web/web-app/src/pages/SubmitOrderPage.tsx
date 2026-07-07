import { Card, CardBody, CardHeader } from '@fuel-pass/ui';

import { FuelOrderForm } from '../features/fuel-orders';

export const SubmitOrderPage = () => (
  <section className="submit-order-page">
    <div className="page-header">
      <h1>Submit Fuel Order</h1>
      <p>Request aircraft refueling at a specific airport and delivery window.</p>
    </div>

    <Card className="submit-order-card">
      <CardHeader>
        <h2>Fuel request details</h2>
      </CardHeader>
      <CardBody>
        <FuelOrderForm />
      </CardBody>
    </Card>
  </section>
);
