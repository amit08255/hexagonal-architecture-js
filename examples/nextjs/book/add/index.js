export const addBookUseCase = (ports) => ({
    addNewBook(name, author, ISBN) {
        const book = ports.findBook(ISBN);
        if (book) {
            return ports.onBookAdded(null, 'Book aleady exists. Failed to add book.');
        }
        const response = ports.addBook(name, author, ISBN);

        if (response) {
            return ports.onBookAdded(response);
        }
        return ports.onBookAdded(null, 'Book addition failed.');
    },
});
