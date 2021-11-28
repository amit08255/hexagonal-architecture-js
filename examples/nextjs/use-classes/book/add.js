import { getBookUseCase } from '../../book/get';
import { getBookInputPort } from '../../book/get/ports/in';
import { getBookOutputPort } from '../../book/get/ports/out';
import { createNanoEvents } from '../../nanoevents';
import { bookRepository } from '../../services/book';
import { getBookList } from '../../services/book/get';

export const getBookUseClass = (eventBus = null) => {
    const bus = eventBus ? eventBus : createNanoEvents();
    const outputPort = getBookOutputPort(bus, { getBookList: getBookList(bookRepository) });
    const useCase = getBookUseCase(outputPort);
    getBookInputPort(useCase, bus);
    return bus;
};
