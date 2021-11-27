export const createNanoEvents = () => ({
    events: {},
    promises: {},
    emit(event, ...args) {
        (this.events[event] || []).forEach((i) => i(...args));

        if (this.promises[event]) {
            this.promises[event](...args);
            delete this.promises[event];
        }
    },
    emitAsync(event, endEvent, ...args) {
        this.emit(event, ...args);

        if (this.promises[endEvent]) {
            return this.promises[endEvent];
        }
        const promiseList = this.promises;
        const promise = new Promise((resolve) => {
            promiseList[endEvent] = resolve;
        });

        return promise;
    },
    on(event, cb) {
        (this.events[event] = this.events[event] || []).push(cb);
        // eslint-disable-next-line no-return-assign
        return () => (this.events[event] = (this.events[event] || []).filter((i) => i !== cb));
    },
});
