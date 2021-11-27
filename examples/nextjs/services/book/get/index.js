export const getBookList = (repository) => () => {
    return repository.listBooks();
};
