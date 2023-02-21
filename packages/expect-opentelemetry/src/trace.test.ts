import { TraceLoop } from './trace-loop';

jest.setTimeout(30000);

describe('trace', () => {
  it('should see orders-service calling emails-service', async () => {
    const traceloop = new TraceLoop();

    const axios = traceloop.axiosInstance; // contains trace-loop-id header set to t.traceLoopId (uuid)
    await axios.post('http://localhost:3000/orders/create'); // or use t.traceLoopId to set the header manually
    await traceloop.fetchTraces();

    expect(traceloop.service('orders-service'))
      .toSendHttpRequest()
      .ofMethod('POST');
  });
});
