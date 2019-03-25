import { AbstractSendingStrategy } from './SendingStrategy';

export class FlushLeftoversStrategy extends AbstractSendingStrategy {
    public shutdown(): Promise<void> {
        return this.flush();
    }
}
