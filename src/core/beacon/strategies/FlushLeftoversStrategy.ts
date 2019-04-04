import { AbstractSendingStrategy } from './SendingStrategy';

export class FlushLeftoversStrategy extends AbstractSendingStrategy {
    public shutdown(): Promise<void> {
        if (!this.sender) {
            return Promise.resolve();
        }

        return this.sender.flushImmediate();
    }
}
