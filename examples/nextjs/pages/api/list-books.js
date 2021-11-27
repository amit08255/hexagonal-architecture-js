export default function handler(req, res) {
    if (req.method === 'POST') {
        res.status(400).json({ success: false, message: 'POST method not allowed' });
    } else {
        res.status(200).json({ success: true, message: [
            { id: 1, name: 'Shawshank Redemption' },
            { id: 2, name: 'The Compund Effect' },
        ] });
    }
}
