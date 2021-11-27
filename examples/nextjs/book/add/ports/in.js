export const addBookInputPort = (useCase, bus) => {
    bus.on('add-book', (name, author, ISBN) => {
        useCase.addNewBook(name, author, ISBN);
    });
};
