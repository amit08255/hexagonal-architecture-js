export const getBookOutputPort = (bus, adapters) => ({
    listBooks() {
        return adapters.getBookList();
    },
    onBooksReceived(response, message) {
        return bus.emit('books-received', response, message);
    },
});
