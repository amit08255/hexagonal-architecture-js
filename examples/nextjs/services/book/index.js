import axios from 'axios';

const extractResponseData = (res) => res.data;

export const bookRepository = {
    listBooks(){
        const promise = axios.get('http://localhost:3000/api/list-books');
        return (
            promise.then(extractResponseData)
        );
    },
    addBook({ name, author, isbn }){
        return axios.post('http://localhost:3000/api/add-book', { name, author, isbn });
    },
    findBook(isbn){
        return axios.get(`http://localhost:3000/api/book/${isbn}`);
    }
};
