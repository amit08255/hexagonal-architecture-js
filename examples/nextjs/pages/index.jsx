import React from 'react';
import { getBookUseClass } from '../use-classes/book/add';

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
    const bus = getBookUseClass();
    const [books] = await bus.emitAsync('get-books', 'books-received');
    return { props: { books } };
}

export default Page;
