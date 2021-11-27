export const addNewBook = (repository) => (name, author, isbn) => {
    return repository.addBook({ name, author, isbn });
};
