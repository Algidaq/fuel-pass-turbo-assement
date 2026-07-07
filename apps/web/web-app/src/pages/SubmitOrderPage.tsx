import { Badge, Card, CardBody } from '@fuel-pass/ui';

import { FuelOrderForm } from '../features/fuel-orders';

export const SubmitOrderPage = () => (
  <section className="submit-order-page">
    <div className="page-header">
      <div className="page-header-title-row">
        <h1>Submit Fuel Order</h1>
        <Badge variant="info">Aircraft Operator</Badge>
      </div>
      <p>
        Request aircraft refueling at a specific airport and delivery window. Ensure all data conforms to international aviation standards.
      </p>
    </div>

    <div className="submit-order-grid">
      <div className="submit-order-main">
        <Card className="submit-order-card">
          <CardBody className="submit-order-card-body">
            <div className="submit-order-card-header">
              <h2>Fuel order details</h2>
              <p>Enter the aircraft, airport, fuel volume, and delivery time window.</p>
            </div>
            <FuelOrderForm />
          </CardBody>
        </Card>
      </div>

      <aside className="submit-order-support" aria-label="Fuel order guidance">
        <Card className="support-card">
          <CardBody className="support-card-body">
            <h3>Submission checklist</h3>
            <ul className="submission-checklist">
              <li>
                <span aria-hidden="true">✓</span>
                <p>Confirm the aircraft tail number.</p>
              </li>
              <li>
                <span aria-hidden="true">✓</span>
                <p>Use a valid 4-letter ICAO airport code.</p>
              </li>
              <li>
                <span aria-hidden="true">✓</span>
                <p>Choose a realistic delivery time window.</p>
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card className="support-card">
          <CardBody className="support-card-body">
            <div className="support-card-heading-row">
              <h3>Order status</h3>
              <span className="pending-status-badge">Pending</span>
            </div>
            <p>
              New fuel orders are created as Pending until operations confirm scheduling. You will receive a notification once the status
              updates.
            </p>
          </CardBody>
        </Card>

        <div className="support-help-card">
          <div className="support-help-heading">
            <span aria-hidden="true">?</span>
            <h3>Need assistance?</h3>
          </div>
          <p>Contact our flight support desk for urgent refueling requests or fleet management inquiries. Available 24/7.</p>
        </div>
      </aside>
    </div>
  </section>
);
