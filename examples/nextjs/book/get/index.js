export const getBookUseCase = (ports) => ({
    getBookList() {
        const promise = ports.listBooks();
        promise.then((response) => {
            if(response.success === true) {
                ports.onBooksReceived(response.message);
            } else {
                throw response.message;
            }
        }).catch(() => {
            ports.onBooksReceived(null, 'Failed to get book list.');
        });
    },
});
