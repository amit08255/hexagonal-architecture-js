export const addBookOutputPort = (bus, adapters) => ({
    findBook(ISBN) {
        return adapters.findBook(ISBN);
    },
    addBook(name, author, ISBN) {
        return adapters.addBook(name, author, ISBN);
    },
    onBookAdded(response, message) {
        return bus.emit('book-added', response, message);
    },
});
