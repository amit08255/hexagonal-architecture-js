import React from 'react';
import { getBookUseCase } from '../book/get';
import { getBookInputPort } from '../book/get/ports/in';
import { getBookOutputPort } from '../book/get/ports/out';
import { createNanoEvents } from '../nanoevents';
import { bookRepository } from '../services/book';
import { getBookList } from '../services/book/get';

const Page = ({ books }) => {
    console.log(books);
    return (
        <table>
            {
                books.map((book) => (
                    <tr key={`book-table-row-${book.id}`}>
                        <td>{book.id}</td>
                        <td>{book.name}</td>
                    </tr>
                ))
            }
        </table>
    );
};

// This gets called on every request
export async function getServerSideProps() {
    const bus = createNanoEvents();
    const outputPort = getBookOutputPort(bus, { getBookList: getBookList(bookRepository) });
    const useCase = getBookUseCase(outputPort);
    getBookInputPort(useCase, bus);
    const books = await bus.emitAsync('get-books', 'books-received');
    return { props: { books } };
}

export default Page;
