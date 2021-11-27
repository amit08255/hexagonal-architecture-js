export const getBookInputPort = (useCase, bus) => {
    bus.on('get-books', () => {
        useCase.getBookList();
    });
};
